import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { hasPaidPlan } from '../../services/subscriptionService';

export default function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);

  // Check subscription status when user is available
  useEffect(() => {
    if (!authLoading && user) {
      checkSubscription();
    } else if (!authLoading && !user) {
      setSubscriptionLoading(false);
    }
  }, [user, authLoading]);

  const checkSubscription = async () => {
    setSubscriptionLoading(true);
    try {
      const hasPlan = await hasPaidPlan(user.id);
      setHasSubscription(hasPlan);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasSubscription(false);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  if (authLoading || subscriptionLoading) {
    // Don't show loading screen - just return null while checking
    return null;
  }

  if (!user) {
    // Redirect to landing page when user is not authenticated
    return <Navigate to="/" replace />;
  }

  if (!hasSubscription) {
    // User is logged in but doesn't have a paid plan - redirect to landing page with modal trigger
    // Store the attempted route so we can redirect back after subscription
    const attemptedRoute = location.pathname;
    return <Navigate to={`/?subscription_required=true&redirect=${encodeURIComponent(attemptedRoute)}`} replace />;
  }

  return children;
}

