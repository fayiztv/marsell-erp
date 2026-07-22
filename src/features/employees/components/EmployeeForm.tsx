import { Mail, Phone, User, Shield, Lock } from 'lucide-react';
import { Input, Select, Button } from '@/components/ui';
import { useEmployeeForm } from '../hooks/useEmployeeForm';
import type { EmployeeFormData } from '../validation/employeeSchema';

interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeFormData>;
  editUid?: string;
  onCancel: () => void;
}

export function EmployeeForm({ defaultValues, editUid, onCancel }: EmployeeFormProps) {
  const { form, onSubmit, isSubmitting, isEditing } = useEmployeeForm(defaultValues, editUid);
  const {
    register,
    formState: { errors },
  } = form;

  const roleOptions = [
    { value: 'employee', label: 'Employee' },
    { value: 'manager', label: 'Manager' },
  ];

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {errors.root && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
          <p className="text-sm text-red-400">{errors.root.message}</p>
        </div>
      )}

      <Input
        label="Full Name"
        type="text"
        placeholder="Jane Doe"
        leftIcon={<User size={15} />}
        error={errors.name?.message}
        disabled={isSubmitting}
        {...register('name')}
      />

      <Input
        label="Email Address"
        type="email"
        placeholder="jane@company.com"
        leftIcon={<Mail size={15} />}
        error={errors.email?.message}
        disabled={isEditing || isSubmitting} // Cannot edit email after creation
        {...register('email')}
      />

      <Input
        label="Phone Number (Optional)"
        type="tel"
        placeholder="+1 (555) 000-0000"
        leftIcon={<Phone size={15} />}
        error={errors.phone?.message}
        disabled={isSubmitting}
        {...register('phone')}
      />

      {!isEditing && (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Role</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 flex items-center text-gray-500 pointer-events-none">
                <Shield size={15} />
              </span>
              <Select
                options={roleOptions}
                disabled={isSubmitting}
                className="pl-9"
                {...register('role')}
              />
            </div>
            {errors.role?.message && (
              <p className="text-xs text-red-400">{errors.role.message}</p>
            )}
          </div>

          <Input
            label="Temporary Password"
            type="text"
            placeholder="Min 6 characters"
            leftIcon={<Lock size={15} />}
            error={errors.password?.message}
            disabled={isSubmitting}
            helperText="The user will log in with this password."
            {...register('password')}
          />
        </>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.04]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditing ? 'Save Changes' : 'Create Employee'}
        </Button>
      </div>
    </form>
  );
}
