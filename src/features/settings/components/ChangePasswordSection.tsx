import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Card, Input, Button } from '@/components/ui';
import { authService } from '@/features/authentication/services/authService';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/authentication/validation/authSchema';
import { useToast } from '@/hooks/useToast';
import { AppError } from '@/utils/errorUtils';

export function ChangePasswordSection() {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = form;

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setIsSubmitting(true);
    try {
      await authService.updatePassword(values.currentPassword, values.newPassword);
      toast.success('Password updated', 'Your password has been changed successfully.');
      reset();
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : 'Failed to update password. Please try again.';

      if (message.toLowerCase().includes('current password')) {
        setError('currentPassword', { message });
      } else {
        setError('root', { message });
      }
      toast.error('Password change failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-gray-900/50 border-white/[0.06] space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <KeyRound className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-100">Change Password</h2>
          <p className="text-sm text-gray-400">
            Update your account password. Enter your current password to verify your identity.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 pt-2">
        {errors.root && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
            <p className="text-sm text-red-400">{errors.root.message}</p>
          </div>
        )}

        <Input
          label="Current Password"
          type={showCurrent ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Enter current password"
          leftIcon={<Lock size={15} />}
          rightIcon={
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowCurrent((v) => !v)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          error={errors.currentPassword?.message}
          disabled={isSubmitting}
          {...register('currentPassword')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="New Password"
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Enter new password"
            helperText="Minimum 6 characters"
            leftIcon={<Lock size={15} />}
            rightIcon={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNew((v) => !v)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
            error={errors.newPassword?.message}
            disabled={isSubmitting}
            {...register('newPassword')}
          />

          <Input
            label="Confirm New Password"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Re-enter new password"
            leftIcon={<Lock size={15} />}
            rightIcon={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
            error={errors.confirmPassword?.message}
            disabled={isSubmitting}
            {...register('confirmPassword')}
          />
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            Update Password
          </Button>
        </div>
      </form>
    </Card>
  );
}
