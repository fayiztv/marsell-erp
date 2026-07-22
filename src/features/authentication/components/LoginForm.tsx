import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useLoginForm } from '../hooks/useLoginForm';
import { ROUTES } from '@/constants';

/**
 * LoginForm — self-contained form that drives itself via useLoginForm.
 * Rendered inside LoginPage/AuthLayout.
 */
export function LoginForm() {
  const { form, onSubmit, isSubmitting } = useLoginForm();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-label="Sign in form">
      {/* Root-level error (e.g., wrong credentials) */}
      {errors.root && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
          <p className="text-sm text-red-400">{errors.root.message}</p>
        </div>
      )}

      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        leftIcon={<Mail size={15} />}
        error={errors.email?.message}
        disabled={isSubmitting}
        {...register('email')}
      />

      <div className="space-y-1">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Enter your password"
          leftIcon={<Lock size={15} />}
          rightIcon={
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          error={errors.password?.message}
          disabled={isSubmitting}
          {...register('password')}
        />

        {/* Forgot password link */}
        <div className="flex justify-end">
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-xs text-gray-500 hover:text-blue-400 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        className="w-full mt-2"
      >
        Sign in
      </Button>
    </form>
  );
}
