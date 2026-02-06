import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchCreditStatus } from '../services/creditService';

const CREDITS_UPDATED_EVENT = 'credits-updated';
const CACHE_KEY = 'credit_status_cache';

function readCache(userId) {
  try {
    if (typeof sessionStorage === 'undefined' || !userId) return null;
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.userId === userId) return data;
    return null;
  } catch {
    return null;
  }
}

function writeCache(userId, planId, resumeCredits, unlimited) {
  try {
    if (typeof sessionStorage === 'undefined' || !userId) return;
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      userId,
      planId: planId || 'free',
      resumeCredits: resumeCredits ?? 0,
      unlimited: !!unlimited,
    }));
  } catch {
    // ignore
  }
}

function clearCache() {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

function isPayingPlan(planId) {
  return planId && planId !== 'free';
}

/**
 * Notify the app that credits/subscription may have changed (e.g. after purchase or plan change).
 */
export function notifyCreditsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CREDITS_UPDATED_EVENT));
  }
}

/**
 * Hook to read current plan and credits (from app_users / credits API).
 * Use this for display (Header, Profile); refetches when credits-updated fires.
 * When authLoading is true and userId is null, we do NOT set plan to free (avoids flash to Free during auth init or flicker).
 * @param {string | null} userId - Supabase user id
 * @param {boolean} [authLoading] - if true, treat null userId as "still loading" and don't reset to free
 * @returns {{ planId: string, resumeCredits: number, unlimited: boolean, loading: boolean, refetch: function }}
 */
function getInitialState(userId) {
  const c = readCache(userId);
  if (!c) return { planId: 'free', resumeCredits: 0, unlimited: false };
  return {
    planId: c.planId || 'free',
    resumeCredits: c.resumeCredits ?? 0,
    unlimited: !!c.unlimited,
  };
}

export function useCreditStatus(userId, authLoading = false) {
  const [planId, setPlanId] = useState(() => getInitialState(userId).planId);
  const [resumeCredits, setResumeCredits] = useState(() => getInitialState(userId).resumeCredits);
  const [unlimited, setUnlimited] = useState(() => getInitialState(userId).unlimited);
  const [loading, setLoading] = useState(!!userId || authLoading);
  const userIdRef = useRef(userId);
  const planIdRef = useRef('free');

  const refetch = useCallback(async () => {
    if (!userId) {
      if (authLoading) {
        setLoading(true);
        return;
      }
      // Don't set Free here—let the delayed effect below do it. Avoids overwriting plan on a brief auth flicker.
      return;
    }
    userIdRef.current = userId;
    const cached = readCache(userId);
    if (cached?.planId != null) {
      setPlanId(cached.planId || 'free');
      setResumeCredits(cached.resumeCredits ?? 0);
      setUnlimited(!!cached.unlimited);
      planIdRef.current = cached.planId || 'free';
    }
    setLoading(true);
    try {
      const status = await fetchCreditStatus(userId);
      if (userIdRef.current !== userId) return;
      const nextPlanId = status.planId || 'free';
      setPlanId(nextPlanId);
      setResumeCredits(status.resumeCredits ?? 0);
      setUnlimited(status.unlimited ?? false);
      planIdRef.current = nextPlanId;
      writeCache(userId, nextPlanId, status.resumeCredits ?? 0, status.unlimited ?? false);
    } catch (err) {
      console.error('useCreditStatus refetch error:', err);
      if (userIdRef.current !== userId) return;
      if (isPayingPlan(planIdRef.current)) {
        // Don't overwrite paying plan on transient error; keep previous state
      } else {
        setPlanId('free');
        setResumeCredits(0);
        setUnlimited(false);
      }
    } finally {
      if (userIdRef.current === userId) setLoading(false);
    }
  }, [userId, authLoading]);

  useEffect(() => {
    planIdRef.current = planId;
  }, [planId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // When userId is null and auth not loading, set Free only after a short delay. If user/auth flickers back, we never set Free.
  useEffect(() => {
    if (userId != null || authLoading) return;
    const timer = setTimeout(() => {
      clearCache();
      setPlanId('free');
      setResumeCredits(0);
      setUnlimited(false);
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [userId, authLoading]);

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener(CREDITS_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CREDITS_UPDATED_EVENT, handler);
  }, [refetch]);

  return { planId, resumeCredits, unlimited, loading, refetch };
}
