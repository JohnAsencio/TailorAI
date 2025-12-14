import Stripe from 'stripe';
import { loadEnvFromLocal } from './utils/loadEnv.js';

// Ensure environment variables are loaded for local development
loadEnvFromLocal();

// Initialize Stripe only if key is available
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim() !== '') {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  });
}

// Import pricing configuration
// Note: We can't use ES6 imports in serverless functions, so we'll inline the logic
function isPreLaunchSpecialActive(planId) {
  const now = new Date();
  const specials = {
    unlimited: {
      expiresAt: new Date('2025-12-31T23:59:59Z'),
    },
    lifetime: {
      expiresAt: new Date('2025-12-31T23:59:59Z'),
    },
  };
  
  const special = specials[planId];
  if (!special) return false;
  return now < special.expiresAt;
}

// Plan configurations
function getPlanConfig(planId) {
  const isSpecial = isPreLaunchSpecialActive(planId);
  
  const plans = {
    unlimited: {
      priceId: process.env.STRIPE_PRICE_UNLIMITED || '',
      specialAmount: 299, // $2.99 in cents
      regularAmount: 1599, // $15.99 in cents
      specialName: 'Unlimited Plan (Pre-Launch Special)',
      regularName: 'Unlimited Plan',
    },
    pro: {
      priceId: process.env.STRIPE_PRICE_PRO || '',
      amount: 1299, // $12.99 in cents
      name: 'Pro Plan',
    },
    lifetime: {
      specialAmount: 2299, // $22.99 in cents
      regularAmount: 4999, // $49.99 in cents
      specialName: 'Lifetime Plan (Pre-Launch Special)',
      regularName: 'Lifetime Plan',
    },
  };
  
  const plan = plans[planId];
  if (!plan) return null;
  
  // Return plan config with current pricing
  if (planId === 'unlimited' || planId === 'lifetime') {
    return {
      ...plan,
      amount: isSpecial ? plan.specialAmount : plan.regularAmount,
      name: isSpecial ? plan.specialName : plan.regularName,
      isSpecial,
    };
  }
  
  return plan;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
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
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    // Debug logging (remove in production if needed)
    console.log('Stripe key check:', {
      hasKey: !!process.env.STRIPE_SECRET_KEY,
      keyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
      keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'missing',
    });

    if (!process.env.STRIPE_SECRET_KEY || !stripe) {
      console.error('STRIPE_SECRET_KEY is not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Stripe API key is not configured. Please set STRIPE_SECRET_KEY in your environment variables and redeploy.',
        debug: {
          hasKey: !!process.env.STRIPE_SECRET_KEY,
          keyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
        },
      });
    }

    // For subscription plans (unlimited, pro)
    if (planId === 'unlimited' || planId === 'pro') {
      // For unlimited plan, use dynamic pricing (supports pre-launch special)
      if (planId === 'unlimited') {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'subscription',
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: plan.name,
                  description: 'Unlimited tailored resumes, ATS checks, and all premium features',
                },
                recurring: {
                  interval: 'month',
                },
                unit_amount: plan.amount,
              },
              quantity: 1,
            },
          ],
          customer_email: email || undefined,
          allow_promotion_codes: true,
          success_url: `${req.headers.origin || process.env.VERCEL_URL || 'http://localhost:5173'}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.headers.origin || process.env.VERCEL_URL || 'http://localhost:5173'}/pricing?canceled=true`,
          metadata: {
            planId,
            planName: plan.name,
            userId,
            email,
            isPreLaunchSpecial: plan.isSpecial ? 'true' : 'false',
            pricePaid: plan.amount.toString(),
          },
          subscription_data: {
            metadata: {
              planId,
              planName: plan.name,
              userId,
              email,
              isPreLaunchSpecial: plan.isSpecial ? 'true' : 'false',
              pricePaid: plan.amount.toString(),
            },
          },
        });

        return res.status(200).json({
          sessionId: session.id,
          url: session.url,
        });
      }

      // For Pro plan, use Stripe Price ID if configured
      if (plan.priceId) {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'subscription',
          line_items: [
            {
              price: plan.priceId,
              quantity: 1,
            },
          ],
          customer_email: email || undefined,
          allow_promotion_codes: true,
          success_url: `${req.headers.origin || process.env.VERCEL_URL || 'http://localhost:5173'}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.headers.origin || process.env.VERCEL_URL || 'http://localhost:5173'}/pricing?canceled=true`,
          metadata: {
            planId,
            planName: plan.name,
            userId,
            email,
          },
        });

        return res.status(200).json({
          sessionId: session.id,
          url: session.url,
        });
      } else {
        return res.status(500).json({
          error: 'Price ID not configured for this plan',
        });
      }
    }

    // For one-time payment (lifetime), create a payment intent
    if (planId === 'lifetime') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: plan.name,
                description: 'Lifetime access to Tailor AI with 500 credits included',
              },
              unit_amount: plan.amount,
            },
            quantity: 1,
          },
        ],
        customer_email: email || undefined,
        allow_promotion_codes: true,
        success_url: `${req.headers.origin || process.env.VERCEL_URL || 'http://localhost:5173'}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin || process.env.VERCEL_URL || 'http://localhost:5173'}/pricing?canceled=true`,
        metadata: {
          planId,
          planName: plan.name,
          userId,
          email,
          isPreLaunchSpecial: plan.isSpecial ? 'true' : 'false',
          pricePaid: plan.amount.toString(),
        },
      });

      return res.status(200).json({
        sessionId: session.id,
        url: session.url,
      });
    }

    return res.status(400).json({ error: 'Invalid plan ID' });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
}

