import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { loginSchema, type LoginFormValues } from '../validation/authSchema';
import { useToast } from '@/hooks/useToast';
import { AppError } from '@/utils/errorUtils';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

/**
 * useLoginForm — drives the login form.
 * Calls authService.signIn; on success the AuthProvider's onAuthStateChanged
 * listener fires and PortalGuard handles the redirect automatically.
 */
export function useLoginForm() {
  const { role, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'tvfayiztv@gmail.com', password: '123456' },
  });

  // If already authenticated, redirect immediately
  if (isAuthenticated) {
    if (role === 'manager') {
      navigate(ROUTES.MANAGER.DASHBOARD, { replace: true });
    } else if (role === 'employee') {
      navigate(ROUTES.EMPLOYEE.TICKETS, { replace: true });
    }
  }

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    try {
      await authService.signIn(values.email, values.password);
      // Navigation is handled automatically by PortalGuard after auth state resolves
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : 'Sign in failed. Please try again.';
      toast.error('Sign in failed', message);
      form.setError('root', { message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return { form, onSubmit: form.handleSubmit(onSubmit), isSubmitting };
}
