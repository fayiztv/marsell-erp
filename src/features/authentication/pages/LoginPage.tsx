import { AuthLayout } from '@/components/layouts/AuthLayout/AuthLayout';
import { LoginForm } from '../components/LoginForm';

/**
 * LoginPage — public route /login.
 * If the user is already authenticated, useLoginForm redirects them to the correct portal.
 */
export function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Marsell workspace"
    >
      <LoginForm />
    </AuthLayout>
  );
}
