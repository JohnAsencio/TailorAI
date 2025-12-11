import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();

  // Wait for auth to finish loading
  if (authLoading) {
    return null;
  }

  // If no user, redirect to landing page
  if (!user || !user.id) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated, allow access
  return children;
}

