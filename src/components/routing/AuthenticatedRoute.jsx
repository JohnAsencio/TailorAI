import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * AuthenticatedRoute - Only requires user to be logged in, not subscribed
 * Use this for pages like Profile that should be accessible to all logged-in users
 */
export default function AuthenticatedRoute({ children }) {
  const { user, authLoading } = useAuth();

  // If auth is still loading, wait
  if (authLoading) {
    return null;
  }

  // If no user, redirect immediately
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated, allow access
  return children;
}

