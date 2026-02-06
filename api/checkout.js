/**
 * Single Stripe Checkout API: plan subscription/one-time OR credit-pack purchase.
 * Body: plan checkout { planId, userId, email } OR credits { creditsQuantity, userId, email }.
 */

import Stripe from 'stripe';
import { loadEnvFromLocal } from './utils/loadEnv.js';

loadEnvFromLocal();

const PRICE_PER_CREDIT_CENTS = 100;
const MIN_CREDITS = 1;
const MAX_CREDITS = 100;
const STRIPE_PRICE_CREDITS = (process.env.STRIPE_PRICE_CREDITS || '').trim();

let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim() !== '') {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  });
}

function getPlanConfig(planId) {
  const plans = {
    basic: {
      priceId: process.env.STRIPE_PRICE_BASIC || '',
      amount: 299,
      name: 'Basic Plan',
      description: '10 credits/month (1 resume = 1 credit, 1 mock interview = 5 credits)',
      mode: 'subscription',
    },
    pro: {
      priceId: process.env.STRIPE_PRICE_PRO || '',
      amount: 1299,
      name: 'Pro Plan',
      description: '50 credits/month — best for active applicants',
      mode: 'subscription',
    },
    lifetime: {
      priceId: process.env.STRIPE_PRICE_LIFETIME || '',
      amount: 2299,
      name: 'Lifetime Plan',
      description: 'Unlimited credits, one-time purchase',
      mode: 'payment',
    },
  };
  return plans[planId] || null;
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
  if (!stripe) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Stripe API key is not configured. Set STRIPE_SECRET_KEY in your environment.',
    });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const { planId, userId, email, creditsQuantity } = body;

  const baseUrl = req.headers?.origin || process.env.VERCEL_URL || 'http://localhost:5173';

  if (creditsQuantity != null && !planId) {
    const quantity = parseInt(creditsQuantity, 10);
    if (!Number.isInteger(quantity) || quantity < MIN_CREDITS || quantity > MAX_CREDITS) {
      return res.status(400).json({
        error: `creditsQuantity must be between ${MIN_CREDITS} and ${MAX_CREDITS}.`,
      });
    }
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId. Please sign in before checkout.' });
    }
    if (!email) {
      return res.status(400).json({ error: 'Missing email.' });
    }
    if (STRIPE_PRICE_CREDITS && STRIPE_PRICE_CREDITS.startsWith('prod_')) {
      return res.status(400).json({
        error: 'STRIPE_PRICE_CREDITS must be a Price ID (price_), not a Product ID (prod_).',
      });
    }
    const successUrl = `${baseUrl}/profile?credits_success=true`;
    const cancelUrl = `${baseUrl}/profile?credits_canceled=true`;
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
    try {
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
      console.error('Credits checkout error:', error?.message);
      const isNoSuchPrice =
        error?.code === 'resource_missing' ||
        (error?.message && String(error.message).includes('No such price'));
      if (isNoSuchPrice) {
        return res.status(400).json({
          error: 'STRIPE_PRICE_CREDITS not found in this Stripe account',
          priceId: STRIPE_PRICE_CREDITS || '(not set)',
          checklist: [
            'STRIPE_SECRET_KEY and the price must be from the same Stripe account.',
            'With sk_test_..., the price must be created in Test mode.',
            'Copy the Price ID: open the Credits product → click the price → copy the ID that starts with price_.',
            'Confirm the price exists in the same Stripe account and mode as STRIPE_SECRET_KEY.',
          ],
        });
      }
      return res.status(500).json({
        error: 'Failed to create checkout session',
        message: error?.message,
      });
    }
  }

  if (!planId) {
    return res.status(400).json({ error: 'Missing planId or creditsQuantity.' });
  }
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId. Please sign in before checkout.' });
  }
  const plan = getPlanConfig(planId);
  if (!plan) {
    return res.status(400).json({ error: 'Invalid plan ID. Use basic, pro, or lifetime.' });
  }

  const successUrl = `${baseUrl}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/pricing?canceled=true`;
  const metadata = { planId, planName: plan.name, userId, email: email || '' };

  try {
    if (planId === 'lifetime') {
      const lineItems = plan.priceId
        ? [{ price: plan.priceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: 'usd',
                product_data: { name: plan.name, description: plan.description },
                unit_amount: plan.amount,
              },
              quantity: 1,
            },
          ];
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: lineItems,
        customer_email: email || undefined,
        allow_promotion_codes: true,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { ...metadata, pricePaid: plan.amount.toString() },
      });
      return res.status(200).json({ sessionId: session.id, url: session.url });
    }
    if (plan.priceId) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{ price: plan.priceId, quantity: 1 }],
        customer_email: email || undefined,
        allow_promotion_codes: true,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        subscription_data: { metadata },
      });
      return res.status(200).json({ sessionId: session.id, url: session.url });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: plan.name, description: plan.description },
            recurring: { interval: 'month' },
            unit_amount: plan.amount,
          },
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      subscription_data: { metadata },
    });
    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Plan checkout error:', error?.message);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error?.message,
    });
  }
}
