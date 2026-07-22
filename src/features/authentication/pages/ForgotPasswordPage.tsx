import { AuthLayout } from '@/components/layouts/AuthLayout/AuthLayout';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';

/**
 * ForgotPasswordPage — public route /forgot-password.
 * No auth guard — accessible to any visitor.
 */
export function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
