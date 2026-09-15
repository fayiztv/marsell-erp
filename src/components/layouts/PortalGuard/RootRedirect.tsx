import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';

/**
 * RootRedirect — routes root `/` to the appropriate dashboard or login page
 * based on authenticated status and user role.
 */
export function RootRedirect() {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (role === 'admin') return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
  if (role === 'manager') return <Navigate to={ROUTES.MANAGER.DASHBOARD} replace />;
  if (role === 'employee') return <Navigate to={ROUTES.EMPLOYEE.TICKETS} replace />;

  return <Navigate to={ROUTES.LOGIN} replace />;
}
