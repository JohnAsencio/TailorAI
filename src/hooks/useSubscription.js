import { useState, useEffect, useCallback } from 'react';
import { checkUserSubscription } from '../services/subscriptionService';

const SUBSCRIPTION_UPDATED_EVENT = 'subscription-updated';

/**
 * Notify the app that subscription state may have changed (e.g. after payment success).
 * Components using useSubscription will refetch.
 */
export function notifySubscriptionUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SUBSCRIPTION_UPDATED_EVENT));
  }
}

/**
 * Hook to read current subscription status and refetch when notified (e.g. after Stripe checkout).
 * @param {string | null} userId - Supabase user id
 * @returns {{ hasSubscription: boolean, subscription: object | null, loading: boolean, refetch: function }}
 */
export function useSubscription(userId) {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(!!userId);

  const refetch = useCallback(async () => {
    if (!userId) {
      setHasSubscription(false);
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await checkUserSubscription(userId);
      setHasSubscription(result.hasSubscription);
      setSubscription(result.subscription);
    } catch (err) {
      console.error('useSubscription refetch error:', err);
      setHasSubscription(false);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener(SUBSCRIPTION_UPDATED_EVENT, handler);
    return () => window.removeEventListener(SUBSCRIPTION_UPDATED_EVENT, handler);
  }, [refetch]);

  return { hasSubscription, subscription, loading, refetch };
}
