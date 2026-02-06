/**
 * Create a Stripe Customer Portal session so the user can manage subscription, payment method, invoices.
 * Looks up stripe_customer_id from subscriptions or app_users by userId.
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { loadEnvFromLocal } from './utils/loadEnv.js';

loadEnvFromLocal();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' })
  : null;

const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId. Please sign in.' });
    }

    if (!stripe) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Stripe API key is not configured.',
      });
    }

    let stripeCustomerId = null;

    if (supabaseAdmin) {
      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .not('stripe_customer_id', 'is', null)
        .limit(1)
        .maybeSingle();

      if (sub?.stripe_customer_id) {
        stripeCustomerId = sub.stripe_customer_id;
      }

      if (!stripeCustomerId) {
        const { data: appUser } = await supabaseAdmin
          .from('app_users')
          .select('stripe_customer_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (appUser?.stripe_customer_id) {
          stripeCustomerId = appUser.stripe_customer_id;
        }
      }
    }

    if (!stripeCustomerId) {
      return res.status(400).json({
        error: 'No billing account found',
        message: 'You need an active subscription to manage billing. Subscribe from the Pricing page.',
      });
    }

    const baseUrl = req.headers.origin || process.env.VERCEL_URL || 'http://localhost:5173';
    const returnUrl = `${baseUrl}/profile`;

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Create portal session error:', error);
    return res.status(500).json({
      error: 'Failed to create portal session',
      message: error.message,
    });
  }
}
