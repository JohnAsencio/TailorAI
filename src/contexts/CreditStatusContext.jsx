import { createContext, useContext } from 'react';
import { useAuthFromContext } from './AuthContext';
import { useCreditStatus } from '../hooks/useCreditStatus';

const CreditStatusContext = createContext(null);

/**
 * Single source of truth for plan/credits. Header and Pricing (and others) read from here
 * so the plan stays correct when switching tabs—no per-page refetch or fresh "free" state.
 */
export function CreditStatusProvider({ children }) {
  const { user, authLoading } = useAuthFromContext();
  const creditStatus = useCreditStatus(user?.id ?? null, authLoading);
  return (
    <CreditStatusContext.Provider value={creditStatus}>
      {children}
    </CreditStatusContext.Provider>
  );
}

export function useCreditStatusFromContext() {
  const ctx = useContext(CreditStatusContext);
  if (ctx == null) {
    throw new Error('useCreditStatusFromContext must be used within CreditStatusProvider');
  }
  return ctx;
}
