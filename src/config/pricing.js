/**
 * Pricing configuration and special offers
 * Update these dates to control when pre-launch specials expire
 */

// Pre-launch special expiration dates (ISO format)
export const PRE_LAUNCH_SPECIALS = {
  unlimited: {
    active: true,
    expiresAt: new Date('2025-12-31T23:59:59Z'), // Set your expiration date
    specialPrice: 299, // $2.99 in cents
    regularPrice: 599, // $15.99 in cents
    name: 'Unlimited Plan (Pre-Launch Special)',
    regularName: 'Unlimited Plan',
  },
  lifetime: {
    active: true,
    expiresAt: new Date('2025-12-31T23:59:59Z'), // Set your expiration date
    specialPrice: 2299, // $22.99 in cents
    regularPrice: 3999, // $49.99 in cents
    name: 'Lifetime Plan (Pre-Launch Special)',
    regularName: 'Lifetime Plan',
  },
};

/**
 * Check if a pre-launch special is currently active
 * @param {string} planId - The plan identifier
 * @returns {boolean}
 */
export function isPreLaunchSpecialActive(planId) {
  const special = PRE_LAUNCH_SPECIALS[planId];
  if (!special || !special.active) {
    return false;
  }
  
  const now = new Date();
  return now < special.expiresAt;
}

/**
 * Get the current price for a plan (special or regular)
 * @param {string} planId - The plan identifier
 * @returns {number} Price in cents
 */
export function getCurrentPrice(planId) {
  const special = PRE_LAUNCH_SPECIALS[planId];
  if (special && isPreLaunchSpecialActive(planId)) {
    return special.specialPrice;
  }
  return special?.regularPrice || 0;
}

/**
 * Get the plan name (with or without special designation)
 * @param {string} planId - The plan identifier
 * @returns {string}
 */
export function getPlanName(planId) {
  const special = PRE_LAUNCH_SPECIALS[planId];
  if (special && isPreLaunchSpecialActive(planId)) {
    return special.name;
  }
  return special?.regularName || '';
}

/**
 * Get pricing display info for a plan
 * @param {string} planId - The plan identifier
 * @returns {object} { currentPrice, originalPrice, isSpecial, expiresAt }
 */
export function getPricingInfo(planId) {
  const special = PRE_LAUNCH_SPECIALS[planId];
  const isActive = isPreLaunchSpecialActive(planId);
  
  if (special && isActive) {
    return {
      currentPrice: special.specialPrice,
      originalPrice: special.regularPrice,
      isSpecial: true,
      expiresAt: special.expiresAt,
    };
  }
  
  return {
    currentPrice: special?.regularPrice || 0,
    originalPrice: null,
    isSpecial: false,
    expiresAt: null,
  };
}

