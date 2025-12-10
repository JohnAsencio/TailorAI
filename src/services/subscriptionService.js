import { supabase } from '../supabaseClient';

/**
 * Check if user has an active subscription
 * @param {string} userId - User's Supabase ID
 * @returns {Promise<{hasSubscription: boolean, subscription: object | null}>}
 */
export async function checkUserSubscription(userId) {
  if (!supabase || !userId) {
    return { hasSubscription: false, subscription: null };
  }

  try {
    // Check subscriptions table for active subscription
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking subscription:', error);
      return { hasSubscription: false, subscription: null };
    }

    // Also check for lifetime plans (status might be 'lifetime' or 'active')
    if (!subscriptions) {
      const { data: lifetimeSub, error: lifetimeError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'lifetime')
        .single();

      if (lifetimeError && lifetimeError.code !== 'PGRST116') {
        console.error('Error checking lifetime subscription:', lifetimeError);
        return { hasSubscription: false, subscription: null };
      }

      if (lifetimeSub) {
        return { hasSubscription: true, subscription: lifetimeSub };
      }
    }

    return {
      hasSubscription: !!subscriptions,
      subscription: subscriptions || null,
    };
  } catch (err) {
    console.error('Error in checkUserSubscription:', err);
    return { hasSubscription: false, subscription: null };
  }
}

/**
 * Check if user has any paid plan (active subscription or lifetime)
 * @param {string} userId - User's Supabase ID
 * @returns {Promise<boolean>}
 */
export async function hasPaidPlan(userId) {
  const { hasSubscription } = await checkUserSubscription(userId);
  return hasSubscription;
}

