import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { loadEnvFromLocal } from './utils/loadEnv.js';

loadEnvFromLocal();

const STRIPE_API_VERSION = '2024-12-18.acacia';

const CREDITS_ON_PURCHASE = { basic: 10, pro: 50, lifetime: 999999 };

export async function POST(request) {
  let rawBody;
  try {
    // Ensure local env is loaded even if cwd differs
    loadEnvFromLocal();

    const stripeSecretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    const endpointSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
    const supabaseUrl =
      (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
    const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    if (!stripeSecretKey) {
      console.error('[stripe-webhook] Missing STRIPE_SECRET_KEY');
      return new Response('Webhook Error: STRIPE_SECRET_KEY is not set', { status: 500 });
    }
    if (!endpointSecret) {
      console.error('[stripe-webhook] Missing STRIPE_WEBHOOK_SECRET');
      return new Response('Webhook Error: STRIPE_WEBHOOK_SECRET is not set', { status: 500 });
    }
    if (!supabaseUrl) {
      console.error('[stripe-webhook] Missing SUPABASE_URL (or VITE_SUPABASE_URL)');
      return new Response('Webhook Error: SUPABASE_URL is not set', { status: 500 });
    }
    if (!supabaseServiceRoleKey) {
      console.error('[stripe-webhook] Missing SUPABASE_SERVICE_ROLE_KEY');
      return new Response('Webhook Error: SUPABASE_SERVICE_ROLE_KEY is not set', { status: 500 });
    }

    // Lazily initialize clients AFTER env validation
    const stripe = new Stripe(stripeSecretKey, { apiVersion: STRIPE_API_VERSION });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Attempt to get raw text
    rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!rawBody) {
      console.error('stripe-webhook: empty body');
      return new Response('Empty body', { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);

    // Handle Checkout Completion
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = (session.customer_details?.email || session.metadata?.email || '').toLowerCase().trim();
      const isCreditPurchase = session.mode === 'payment' && session.metadata?.type === 'credits';
      const creditsQuantity = parseInt(session.metadata?.creditsQuantity, 10) || 0;
      const userId = session.metadata?.userId || null;

      if (isCreditPurchase && creditsQuantity > 0) {

        let currentCredits = 0;
        let updateBy = null; // 'user_id' | 'email'

        if (userId) {
          const { data: byUser } = await supabaseAdmin
            .from('app_users')
            .select('resume_credits')
            .eq('user_id', userId)
            .maybeSingle();
          if (byUser != null) {
            currentCredits = byUser.resume_credits ?? 0;
            updateBy = 'user_id';
          }
        }
        if (updateBy === null && email) {
          const { data: byEmail } = await supabaseAdmin
            .from('app_users')
            .select('resume_credits')
            .eq('email', email)
            .maybeSingle();
          if (byEmail != null) {
            currentCredits = byEmail.resume_credits ?? 0;
            updateBy = 'email';
          }
        }

        const newCredits = currentCredits + creditsQuantity;
        const now = new Date().toISOString();

        if (updateBy === 'user_id') {
          const { error } = await supabaseAdmin
            .from('app_users')
            .update({ resume_credits: newCredits, updated_at: now })
            .eq('user_id', userId);
          if (error) {
            console.error('stripe-webhook: credit update by user_id failed', error.message);
            throw error;
          }
        } else if (updateBy === 'email') {
          const { error } = await supabaseAdmin
            .from('app_users')
            .update({ resume_credits: newCredits, updated_at: now })
            .eq('email', email);
          if (error) {
            console.error('stripe-webhook: credit update by email failed', error.message);
            throw error;
          }
        } else {
          console.warn('stripe-webhook: credit purchase, no app_users row for userId or email');
        }
      } else {
        // Plan purchase (subscription or one-time plan): set plan and ADD plan credits to current balance
        const planId = session.metadata?.planId || 'free';
        const creditsFromPlan = CREDITS_ON_PURCHASE[planId] ?? 0;
        const userId = session.metadata?.userId || null;

        let currentCredits = 0;
        let updateBy = null; // 'user_id' | 'email'
        if (userId) {
          const { data: byUser } = await supabaseAdmin
            .from('app_users')
            .select('resume_credits')
            .eq('user_id', userId)
            .maybeSingle();
          if (byUser != null) {
            currentCredits = byUser.resume_credits ?? 0;
            updateBy = 'user_id';
          }
        }
        if (updateBy === null && email) {
          const { data: byEmail } = await supabaseAdmin
            .from('app_users')
            .select('resume_credits')
            .eq('email', email)
            .maybeSingle();
          if (byEmail != null) {
            currentCredits = byEmail.resume_credits ?? 0;
            updateBy = 'email';
          }
        }

        const newCredits = currentCredits + creditsFromPlan;
        const now = new Date().toISOString();

        if (updateBy === 'user_id') {
          const { error } = await supabaseAdmin
            .from('app_users')
            .update({ plan_id: planId, resume_credits: newCredits, updated_at: now })
            .eq('user_id', userId);
          if (error) {
            console.error('stripe-webhook: plan update by user_id failed', error.message);
            throw error;
          }
        } else if (updateBy === 'email') {
          const { error } = await supabaseAdmin
            .from('app_users')
            .update({ plan_id: planId, resume_credits: newCredits, updated_at: now })
            .eq('email', email);
          if (error) {
            console.error('stripe-webhook: plan update by email failed', error.message);
            throw error;
          }
        } else {
          console.warn('stripe-webhook: plan purchase, no app_users row for userId or email');
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (err) {
    console.error('stripe-webhook failed', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
}

// Critical for Next.js/Vercel to prevent body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};