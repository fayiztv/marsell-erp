import { Mail, Phone, User, Shield, Lock, Layers } from 'lucide-react';
import { Input, Select, Button } from '@/components/ui';
import { useEmployeeForm } from '../hooks/useEmployeeForm';
import { useAuth } from '@/hooks/useAuth';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
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
    watch,
  } = form;

  const { accessibleDepartmentIds } = useAuth();
  const { data: departmentsData } = useDepartments({ status: 'active', search: '' });

  const roleOptions = [
    { value: 'employee', label: 'Employee' },
    { value: 'manager', label: 'Manager' },
  ];

  const departmentOptions = [
    { value: '', label: 'Select a department...' },
    ...(departmentsData?.items
      .filter((d) => !accessibleDepartmentIds || accessibleDepartmentIds.includes(d.id))
      .map((d) => ({ value: d.id, label: d.name })) || []),
  ];

  const onSubmitHandler = (data: any) => {
    return onSubmit(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmitHandler)} noValidate className="space-y-4">
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
        readOnly={isEditing}
        disabled={isSubmitting} // Use readOnly instead of disabled for isEditing so it stays in form data
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
            <label className="text-sm font-medium text-gray-300">Department</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 flex items-center text-gray-500 pointer-events-none">
                <Layers size={15} />
              </span>
              <Select
                options={departmentOptions}
                disabled={isSubmitting}
                className="pl-9"
                value={watch('homeDepartmentId') || ''}
                {...register('homeDepartmentId')}
                onChange={(val) => form.setValue('homeDepartmentId', val, { shouldValidate: true, shouldDirty: true })}
              />
            </div>
            {errors.homeDepartmentId?.message && (
              <p className="text-xs text-red-400">{errors.homeDepartmentId.message}</p>
            )}
          </div>

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
                value={watch('role') || ''}
                {...register('role')}
                onChange={(val) => form.setValue('role', val as any, { shouldValidate: true, shouldDirty: true })}
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
