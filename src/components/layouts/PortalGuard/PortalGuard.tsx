import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';
import type { UserRole } from '@/types';

interface PortalGuardProps {
  requiredRole: UserRole;
  children: React.ReactNode;
}

/**
 * PortalGuard — role-based route protection component.
 *
 * Renders a full-screen loading state during auth initialization.
 * Redirects to /login if unauthenticated.
 * Redirects to the correct portal if the role doesn't match.
 */
export function PortalGuard({ requiredRole, children }: PortalGuardProps) {
  const { isInitialized, isAuthenticated, role } = useAuth();

  // Auth state is still being resolved — show nothing (AuthProvider handles the skeleton)
  if (!isInitialized) {
    return null;
  }

  // Not logged in — go to login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Wrong portal for this role — redirect to correct one
  if (role !== requiredRole) {
    if (role === 'manager') return <Navigate to={ROUTES.MANAGER.DASHBOARD} replace />;
    if (role === 'employee') return <Navigate to={ROUTES.EMPLOYEE.TICKETS} replace />;
    // Unknown role — back to login
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
}
