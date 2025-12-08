import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    // You could show a loading spinner here
    return null;
  }

  if (!user) {
    // Redirect to signin, but save the location they were trying to visit
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
}

