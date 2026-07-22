import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '../services/authService';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '../validation/authSchema';
import { useToast } from '@/hooks/useToast';
import { AppError } from '@/utils/errorUtils';

/**
 * useForgotPasswordForm — drives the forgot-password form.
 * Returns a `isSuccess` flag so the UI can swap to a confirmation state.
 */
export function useForgotPasswordForm() {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsSubmitting(true);
    try {
      await authService.resetPassword(values.email);
      setIsSuccess(true);
      toast.success('Reset link sent', 'Check your email for the password reset link.');
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : 'Something went wrong. Please try again.';
      toast.error('Reset failed', message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting,
    isSuccess,
  };
}
