/**
 * Pricing configuration: four tiers with credits
 * Sale/launch prices shown; regular prices for strikethrough.
 * Save limits: free=0, basic=3, pro=15, lifetime=unlimited
 */

export const PLANS = {
  free: {
    planId: 'free',
    name: 'Free',
    priceCents: 0,
    regularPriceCents: 0,
    period: 'forever',
    credits: 2,
    creditsLabel: '2 credits',
    description: 'For trying features',
    saveLimit: 0,
  },
  basic: {
    planId: 'basic',
    name: 'Basic',
    priceCents: 299, // sale $2.99
    regularPriceCents: 499, // $4.99
    period: '/month',
    credits: 10,
    creditsLabel: '10 credits',
    description: '1 interview = 5 credits, 1 resume = 1 credit',
    saveLimit: 3,
  },
  pro: {
    planId: 'pro',
    name: 'Pro',
    priceCents: 1299, // sale $12.99
    regularPriceCents: 2099, // $20.99
    period: '/month',
    credits: 50,
    creditsLabel: '50 credits',
    description: 'Best for active applicants',
    saveLimit: 15,
  },
  lifetime: {
    planId: 'lifetime',
    name: 'Lifetime',
    priceCents: 2299, // sale $22.99
    regularPriceCents: 4999, // $49.99
    period: 'one-time',
    credits: null,
    creditsLabel: 'Unlimited credits',
    description: 'One-time purchase, no monthly fees',
    saveLimit: null, // unlimited
  },
};

/** Max saved resumes by plan (free=0, basic=3, pro=15, lifetime=unlimited) */
export const SAVE_LIMITS = {
  free: 0,
  basic: 3,
  pro: 15,
  lifetime: null,
};

/** Credit costs (for display and logic) */
export const CREDIT_COSTS = {
  oneResume: 1,
  oneMockInterview: 5,
  pricePerCreditDollars: 1,
};

/**
 * Get plan config by id
 * @param {string} planId - 'free' | 'basic' | 'pro' | 'lifetime'
 */
export function getPlan(planId) {
  return PLANS[planId] || null;
}

/**
 * Get the monthly credit allotment for a plan (null = unlimited, e.g. lifetime).
 * Single source of truth for "how many credits does this plan grant" — API
 * routes should import this instead of hardcoding their own copy.
 * @param {string} planId
 * @returns {number|null}
 */
export function getPlanCredits(planId) {
  const plan = PLANS[planId];
  return plan ? plan.credits : null;
}

/**
 * Get price for display (e.g. "$2.99")
 */
export function formatPrice(cents) {
  if (cents === 0) return '$0';
  return `$${(cents / 100).toFixed(2)}`;
}
