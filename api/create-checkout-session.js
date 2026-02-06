import Stripe from 'stripe';
import { loadEnvFromLocal } from './utils/loadEnv.js';

loadEnvFromLocal();

let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim() !== '') {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  });
}

// Plan config: Basic $2.99/mo, Pro $12.99/mo, Lifetime $22.99 one-time
// Use STRIPE_PRICE_BASIC / STRIPE_PRICE_PRO if set; otherwise create dynamic pricing
function getPlanConfig(planId) {
  const plans = {
    basic: {
      priceId: process.env.STRIPE_PRICE_BASIC || '',
      amount: 299, // $2.99 in cents
      name: 'Basic Plan',
      description: '10 credits/month (1 resume = 1 credit, 1 mock interview = 5 credits)',
      mode: 'subscription',
    },
    pro: {
      priceId: process.env.STRIPE_PRICE_PRO || '',
      amount: 1299, // $12.99 in cents
      name: 'Pro Plan',
      description: '50 credits/month — best for active applicants',
      mode: 'subscription',
    },
    lifetime: {
      priceId: process.env.STRIPE_PRICE_LIFETIME || '',
      amount: 2299, // $22.99 in cents
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

  try {
    const { planId, email, userId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Missing planId' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId. Please sign in before checkout.' });
    }

    const plan = getPlanConfig(planId);
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan ID. Use basic, pro, or lifetime.' });
    }

    if (!process.env.STRIPE_SECRET_KEY || !stripe) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Stripe API key is not configured. Set STRIPE_SECRET_KEY in your environment.',
      });
    }

    const baseUrl = req.headers.origin || process.env.VERCEL_URL || 'http://localhost:5173';
    const successUrl = `${baseUrl}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/pricing?canceled=true`;

    const metadata = { planId, planName: plan.name, userId, email: email || '' };

    // Lifetime: one-time payment $22.99 (use Dashboard price if set)
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

    // Basic or Pro: subscription
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

    // Dynamic pricing when Price ID not set
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
    console.error('Stripe checkout error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
}
