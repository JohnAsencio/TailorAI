/**
 * Verify STRIPE_PRICE_CREDITS exists in the Stripe account tied to STRIPE_SECRET_KEY.
 * GET /api/verify-stripe-price — use this to confirm your price ID and key match (same account, test mode).
 */

import Stripe from 'stripe';
import { loadEnvFromLocal } from './utils/loadEnv.js';

loadEnvFromLocal();

const STRIPE_PRICE_CREDITS = (process.env.STRIPE_PRICE_CREDITS || '').trim();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!STRIPE_PRICE_CREDITS) {
    return res.status(400).json({
      ok: false,
      error: 'STRIPE_PRICE_CREDITS is not set in .env.local',
      hint: 'Add STRIPE_PRICE_CREDITS=price_xxxx (from Stripe Dashboard → Product catalog → Credits → price).',
    });
  }

  if (STRIPE_PRICE_CREDITS.startsWith('prod_')) {
    return res.status(400).json({
      ok: false,
      error: 'STRIPE_PRICE_CREDITS must be a Price ID (price_...), not a Product ID (prod_...)',
      hint: 'In Dashboard, open the Credits product and copy the ID of the price row (e.g. $1.00 one-time), not the product.',
    });
  }

  const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (!secretKey) {
    return res.status(500).json({
      ok: false,
      error: 'STRIPE_SECRET_KEY is not set',
      hint: 'Add your Stripe secret key to .env.local (sk_test_... for test mode).',
    });
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' });

  try {
    const price = await stripe.prices.retrieve(STRIPE_PRICE_CREDITS);
    const keyMode = secretKey.startsWith('sk_test_') ? 'test' : 'live';
    return res.status(200).json({
      ok: true,
      keyMode,
      price: {
        id: price.id,
        active: price.active,
        currency: price.currency,
        unit_amount: price.unit_amount,
        type: price.type,
        product: price.product,
      },
      message: price.active
        ? 'Price exists and is active. Credits checkout should work.'
        : 'Price exists but is archived. Create a new price or activate this one in Dashboard.',
    });
  } catch (err) {
    const isNotFound =
      err?.code === 'resource_missing' ||
      (err?.message && String(err.message).includes('No such price'));
    if (isNotFound) {
      return res.status(404).json({
        ok: false,
        error: 'No such price in this Stripe account',
        priceId: STRIPE_PRICE_CREDITS,
        checklist: [
          'STRIPE_SECRET_KEY and the price must be from the same Stripe account.',
          'With sk_test_..., create/copy the price in Test mode (Dashboard toggle ON).',
          'In Product catalog (Test mode), open Credits → copy the Price ID (price_...) of an active price.',
        ],
      });
    }
    console.error('verify-stripe-price error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Stripe API error',
    });
  }
}
