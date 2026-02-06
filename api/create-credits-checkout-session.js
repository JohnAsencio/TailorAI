/**
 * Create Stripe Checkout session for purchasing individual credits (one-time payment).
 * Metadata: type: 'credits', creditsQuantity, userId, email.
 */

import Stripe from 'stripe';
import { loadEnvFromLocal } from './utils/loadEnv.js';

loadEnvFromLocal();

const PRICE_PER_CREDIT_CENTS = 100; // $1 per credit
const MIN_CREDITS = 1;
const MAX_CREDITS = 100;
// Optional: use your Stripe Dashboard "Credits" product's PRICE ID (starts with price_), not the Product ID (prod_).
const STRIPE_PRICE_CREDITS = (process.env.STRIPE_PRICE_CREDITS || '').trim();

let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim() !== '') {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  });
}

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
    const { userId, email, creditsQuantity } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId. Please sign in before checkout.' });
    }
    if (!email) {
      return res.status(400).json({ error: 'Missing email.' });
    }

    const quantity = parseInt(creditsQuantity, 10);
    if (!Number.isInteger(quantity) || quantity < MIN_CREDITS || quantity > MAX_CREDITS) {
      return res.status(400).json({
        error: `creditsQuantity must be between ${MIN_CREDITS} and ${MAX_CREDITS}.`,
      });
    }

    if (!stripe) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Stripe API key is not configured. Set STRIPE_SECRET_KEY in your environment.',
      });
    }

    const baseUrl = req.headers.origin || process.env.VERCEL_URL || 'http://localhost:5173';
    const successUrl = `${baseUrl}/profile?credits_success=true`;
    const cancelUrl = `${baseUrl}/profile?credits_canceled=true`;

    if (STRIPE_PRICE_CREDITS && STRIPE_PRICE_CREDITS.startsWith('prod_')) {
      return res.status(400).json({
        error: 'STRIPE_PRICE_CREDITS must be a Price ID (starts with price_), not a Product ID (prod_). In Stripe Dashboard, open your Credits product and copy the ID of the price (e.g. $1.00 one-time), not the product.',
      });
    }

    const lineItems = STRIPE_PRICE_CREDITS
      ? [{ price: STRIPE_PRICE_CREDITS, quantity }]
      : [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: quantity === 1 ? '1 Credit' : `${quantity} Credits`,
                description: 'Resume credits for Tailor AI. 1 credit = 1 tailored resume, 5 credits = 1 mock interview.',
              },
              unit_amount: PRICE_PER_CREDIT_CENTS,
            },
            quantity,
          },
        ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      customer_email: email,
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'credits',
        creditsQuantity: quantity.toString(),
        userId,
        email: email || '',
      },
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Credits checkout error:', error);

    const isNoSuchPrice =
      error?.code === 'resource_missing' ||
      (error?.message && String(error.message).includes('No such price'));
    if (isNoSuchPrice) {
      return res.status(400).json({
        error: 'STRIPE_PRICE_CREDITS not found in this Stripe account',
        priceId: STRIPE_PRICE_CREDITS || '(not set)',
        checklist: [
          'STRIPE_SECRET_KEY and the price must be from the same Stripe account (Dashboard → Developers → API keys).',
          'With sk_test_..., the price must be created in Test mode (Dashboard toggle ON, then Product catalog).',
          'In the product’s price list, the price must be active (not archived).',
          'Copy the Price ID again: open the Credits product → click the price (e.g. $1.00 one-time) → copy the ID that starts with price_.',
          'Run GET /api/verify-stripe-price to confirm the price exists with your current key.',
        ],
      });
    }

    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
}
