import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { loadEnvFromLocal } from './utils/loadEnv.js';

// Load env vars for local dev
loadEnvFromLocal();

// Helper to read raw request body (needed for Stripe signature verification)
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Environment variables (server-side only)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
// Use SUPABASE_URL if set, otherwise fall back to VITE_SUPABASE_URL (server-side can access VITE_ vars)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Initialize Stripe only if key is present
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' })
  : null;

// Initialize Supabase admin client (service role)
const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

export default async function handler(req, res) {
  // Stripe requires the raw body
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  if (!stripe || !stripeWebhookSecret) {
    console.error('Stripe webhook not configured');
    return res
      .status(500)
      .json({ error: 'Stripe webhook not configured on the server' });
  }

  if (!supabaseAdmin) {
    console.error('Supabase service role not configured');
    return res.status(500).json({
      error:
        'Supabase service role not configured. Set SUPABASE_SERVICE_ROLE_KEY (and optionally SUPABASE_URL, or use existing VITE_SUPABASE_URL).',
    });
  }

  let event;
  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      stripeWebhookSecret
    );
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const planId = session.metadata?.planId || 'unknown';
        const status = planId === 'lifetime' ? 'lifetime' : 'active';
        await upsertSubscriptionFromSession(session, status);
        // Mark waitlist entry as converted if user was on waitlist
        await markWaitlistAsConverted(session);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await upsertSubscriptionFromStripeSubscription(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await upsertSubscriptionFromStripeSubscription(subscription, 'canceled');
        break;
      }
      default:
        // Ignore other events
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function upsertSubscriptionFromSession(session, status = 'active') {
  const email = session.customer_details?.email || session.customer_email;
  const customerId = session.customer;
  const planId = session.metadata?.planId || 'unknown';
  const planName = session.metadata?.planName || 'unknown';
  const isPreLaunchSpecial = session.metadata?.isPreLaunchSpecial === 'true';
  const pricePaid = session.metadata?.pricePaid
    ? parseInt(session.metadata.pricePaid, 10)
    : null;
  const userId = session.metadata?.userId || null;

  if (!email && !customerId) {
    throw new Error('Missing email and customerId in session');
  }

  const { error } = await supabaseAdmin.from('subscriptions').upsert(
    {
      email: email || null,
      user_id: userId || null,
      stripe_customer_id: customerId || null,
      plan_id: planId,
      plan_name: planName,
      status,
      is_prelaunch_special: isPreLaunchSpecial,
      price_paid_cents: pricePaid,
      current_period_end: session.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  );

  if (error) {
    throw error;
  }

  // Also upsert lightweight user profile (non-auth) for status lookup by email
  await upsertAppUserProfile({
    userId,
    email,
    customerId,
    planId,
    planName,
    status,
  });
}

async function upsertSubscriptionFromStripeSubscription(
  subscription,
  overrideStatus
) {
  const customerId = subscription.customer;
  const status = overrideStatus || subscription.status || 'active';
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;
  const userId =
    subscription.metadata?.userId ||
    subscription.items?.data?.[0]?.price?.metadata?.userId ||
    null;

  // Fetch customer to get email
  const customer =
    customerId && stripe ? await stripe.customers.retrieve(customerId) : null;
  const email = customer?.email || null;

  const { error } = await supabaseAdmin.from('subscriptions').upsert(
    {
      email,
      user_id: userId || null,
      stripe_customer_id: customerId,
      plan_id: subscription.items?.data?.[0]?.price?.id || 'unknown',
      plan_name: subscription.items?.data?.[0]?.price?.nickname || 'unknown',
      status,
      is_prelaunch_special:
        subscription.metadata?.isPreLaunchSpecial === 'true',
      price_paid_cents: subscription.items?.data?.[0]?.price?.unit_amount || 0,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  );

  if (error) {
    throw error;
  }

  await upsertAppUserProfile({
    userId,
    email,
    customerId,
    planId: subscription.items?.data?.[0]?.price?.id || 'unknown',
    planName: subscription.items?.data?.[0]?.price?.nickname || 'unknown',
    status,
  });
}

// Mark waitlist entry as converted when user purchases a plan
async function markWaitlistAsConverted(session) {
  if (!supabaseAdmin) return;

  try {
    const userId = session.metadata?.userId || null;
    const email = session.customer_email || session.customer_details?.email || null;

    if (!userId && !email) {
      return; // Can't identify user
    }

    // Update waitlist entry
    const updateData = {
      converted: true,
      converted_at: new Date().toISOString(),
    };

    let query = supabaseAdmin.from('waitlist');

    if (userId) {
      // Try to update by user_id first
      const { data: waitlistEntry } = await supabaseAdmin
        .from('waitlist')
        .select('id, converted')
        .eq('user_id', userId)
        .single();

      if (waitlistEntry && !waitlistEntry.converted) {
        await query.update(updateData).eq('id', waitlistEntry.id);
        return;
      }
    }

    // Fallback: update by email
    if (email) {
      const { data: waitlistEntry } = await supabaseAdmin
        .from('waitlist')
        .select('id, converted')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (waitlistEntry && !waitlistEntry.converted) {
        await query.update(updateData).eq('id', waitlistEntry.id);
      }
    }
  } catch (error) {
    // Don't fail webhook if waitlist update fails
    console.error('Error marking waitlist as converted:', error);
  }
}

// Credit balance to set on purchase: basic=10, pro=50, lifetime=effectively unlimited (high number for display)
const CREDITS_ON_PURCHASE = { basic: 10, pro: 50, lifetime: 999999 };

async function upsertAppUserProfile({
  userId,
  email,
  customerId,
  planId,
  planName,
  status,
}) {
  const normalizedEmail = email ? String(email).toLowerCase().trim() : '';
  if (!normalizedEmail && !userId) return;
  try {
    const normalizedPlanId = (planId || 'unknown').toLowerCase();
    const creditsToSet = CREDITS_ON_PURCHASE[normalizedPlanId];
    const now = new Date().toISOString();
    const planUpdate = {
      plan_id: normalizedPlanId,
      plan_name: planName || 'unknown',
      plan_status: status || 'active',
      updated_at: now,
    };
    if (creditsToSet != null) {
      planUpdate.resume_credits = creditsToSet;
    }

    // 1) Update by user_id so the row the credits API reads (by user_id) always gets new credits/plan
    if (userId) {
      const { error: updateByUserError } = await supabaseAdmin
        .from('app_users')
        .update(planUpdate)
        .eq('user_id', userId);
      if (updateByUserError) {
        console.warn('app_users update by user_id warning:', updateByUserError.message);
      }
    }

    // 2) Upsert by email (normalized to match create-user-profile) so row exists and stays in sync
    if (normalizedEmail) {
      const row = {
        email: normalizedEmail,
        user_id: userId || null,
        stripe_customer_id: customerId || null,
        ...planUpdate,
      };
      const { error } = await supabaseAdmin
        .from('app_users')
        .upsert(row, { onConflict: 'email' });
      if (error) {
        console.warn('app_users upsert warning (table missing?):', error.message);
      }
    }
  } catch (err) {
    console.warn('app_users upsert exception (ignored):', err.message);
  }
}

