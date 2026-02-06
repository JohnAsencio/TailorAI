import { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';

const AuthContext = createContext(null);

/**
 * Single source of truth for auth. All consumers (App, CreditStatusProvider, PricingPage, etc.)
 * read the same user/authLoading so plan state never sees a flickering or different user.
 */
export function AuthProvider({ children }) {
  const auth = useAuth();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthFromContext() {
  const ctx = useContext(AuthContext);
  if (ctx == null) {
    throw new Error('useAuthFromContext must be used within AuthProvider');
  }
  return ctx;
}
