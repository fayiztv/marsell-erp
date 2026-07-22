import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useForgotPasswordForm } from '../hooks/useForgotPasswordForm';
import { ROUTES } from '@/constants';

/**
 * ForgotPasswordForm — email input with success confirmation state.
 * After a successful submit, swaps to a confirmation UI.
 */
export function ForgotPasswordForm() {
  const { form, onSubmit, isSubmitting, isSuccess } = useForgotPasswordForm();
  const {
    register,
    formState: { errors },
  } = form;

  // ── Success state ─────────────────────────────────────────────────────────

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="size-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
          <CheckCircle2 size={22} className="text-emerald-400" />
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-gray-100">Check your email</p>
          <p className="text-sm text-gray-400 leading-relaxed max-w-[260px]">
            We've sent a password reset link. It may take a few minutes to arrive.
          </p>
        </div>
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors mt-1"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    );
  }

  // ── Default state ─────────────────────────────────────────────────────────

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-label="Reset password form">
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        leftIcon={<Mail size={15} />}
        error={errors.email?.message}
        disabled={isSubmitting}
        helperText="We'll send a password reset link to this address."
        {...register('email')}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        className="w-full"
      >
        Send reset link
      </Button>

      <div className="text-center">
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={13} />
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
