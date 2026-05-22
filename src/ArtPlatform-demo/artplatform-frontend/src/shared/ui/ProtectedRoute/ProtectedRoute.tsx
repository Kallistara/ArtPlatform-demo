import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';

type ProtectedRouteProps = {
  roles?: Array<'Unauthorized' | 'User' | 'Artist' | 'Admin'>;
};

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0 && !roles.includes(user?.role ?? 'Unauthorized')) {
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
}