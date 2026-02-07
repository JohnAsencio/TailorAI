/**
 * Stripe webhook handler. Must use raw request body for signature verification.
 * Uses export default (req, res) like other api/ routes so Vercel invokes it.
 * Raw body: read from stream first; fallback to req.body if it's a string.
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { loadEnvFromLocal } from '../lib/loadEnv.js';

loadEnvFromLocal();

const STRIPE_API_VERSION = '2024-12-18.acacia';

const CREDITS_ON_PURCHASE = { basic: 10, pro: 50, lifetime: 999999 };

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');
}

/** Read raw body from request stream (before any parser consumes it) */
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    loadEnvFromLocal();

    const stripeSecretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    const endpointSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
    const supabaseUrl =
      (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
    const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    if (!stripeSecretKey) {
      console.error('[stripe-webhook] Missing STRIPE_SECRET_KEY');
      return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not set' });
    }
    if (!endpointSecret) {
      console.error('[stripe-webhook] Missing STRIPE_WEBHOOK_SECRET');
      return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET is not set' });
    }
    if (!supabaseUrl) {
      console.error('[stripe-webhook] Missing SUPABASE_URL (or VITE_SUPABASE_URL)');
      return res.status(500).json({ error: 'Supabase URL is not set' });
    }
    if (!supabaseServiceRoleKey) {
      console.error('[stripe-webhook] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set' });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: STRIPE_API_VERSION });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Raw body: stream first (exact bytes Stripe sent); fallback to req.body if string
    let rawBody = await getRawBody(req);
    if (!rawBody && typeof req.body === 'string') {
      rawBody = req.body;
    }
    const signature = req.headers['stripe-signature'];

    if (!rawBody) {
      console.error('stripe-webhook: empty body (stream and req.body both empty)');
      return res.status(400).json({ error: 'Empty body' });
    }
    if (!signature) {
      console.error('stripe-webhook: missing stripe-signature header');
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = (session.customer_details?.email || session.metadata?.email || '').toLowerCase().trim();
      const isCreditPurchase = session.mode === 'payment' && session.metadata?.type === 'credits';
      const creditsQuantity = parseInt(session.metadata?.creditsQuantity, 10) || 0;
      const userId = session.metadata?.userId || null;

      if (isCreditPurchase && creditsQuantity > 0) {
        let currentCredits = 0;
        let updateBy = null;

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
        const planId = session.metadata?.planId || 'free';
        const creditsFromPlan = CREDITS_ON_PURCHASE[planId] ?? 0;
        const userId = session.metadata?.userId || null;

        let currentCredits = 0;
        let updateBy = null;
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

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('stripe-webhook failed', err.message);
    return res.status(400).json({ error: err.message || 'Webhook Error' });
  }
}

// Disable body parsing so we can read the raw stream for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
