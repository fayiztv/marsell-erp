import { Navigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layouts/AuthLayout/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';

/**
 * LoginPage — public route /login.
 * If the user is already authenticated, redirects them directly to their portal dashboard.
 */
export function LoginPage() {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated) {
    if (role === 'admin') return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    if (role === 'manager') return <Navigate to={ROUTES.MANAGER.DASHBOARD} replace />;
    if (role === 'employee') return <Navigate to={ROUTES.EMPLOYEE.TICKETS} replace />;
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Marsell workspace"
    >
      <LoginForm />
    </AuthLayout>
  );
}
