import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, Input, Select } from '@/components/ui';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import { employeeFormSchema, type EmployeeFormData } from '../validation/employeeSchema';
import type { User } from '../types/employee.types';

interface AdminUserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  isLoading: boolean;
  initialData?: User | null | undefined;
}

export function AdminUserFormDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  initialData,
}: AdminUserFormDialogProps) {
  const isEditing = Boolean(initialData);

  const { data: deptData } = useDepartments({ status: 'active', search: '' });
  const departments = deptData?.items || [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'employee',
      homeDepartmentId: 'dept_general',
      password: '',
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone || '',
        role: initialData.role,
        homeDepartmentId: initialData.homeDepartmentId || 'dept_general',
        password: '',
      });
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        role: 'employee',
        homeDepartmentId: 'dept_general',
        password: '',
      });
    }
  }, [initialData, reset, isOpen]);

  const handleFormSubmit = async (data: EmployeeFormData) => {
    const formattedData = {
      ...data,
      homeDepartmentId: data.role === 'admin' ? null : data.homeDepartmentId || 'dept_general',
    };
    await onSubmit(formattedData);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit User Profile' : 'Create User Account'}
      description={
        isEditing
          ? 'Update employee or manager contact details.'
          : 'Provision a new Admin, Manager, or Employee user with home department assignment.'
      }
      actions={[
        {
          label: 'Cancel',
          variant: 'ghost',
          onClick: onClose,
          disabled: isLoading,
        },
        {
          label: isEditing ? 'Save Changes' : 'Create User',
          variant: 'primary',
          onClick: handleSubmit(handleFormSubmit),
          isLoading,
        },
      ]}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Jane Doe"
          required
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="jane@company.com"
          required
          readOnly={isEditing}
          disabled={isLoading}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Phone Number"
          type="tel"
          placeholder="10-digit number (e.g. 9876543210)"
          error={errors.phone?.message}
          {...register('phone')}
        />

        {!isEditing && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">System Role</label>
            <Select
              value={selectedRole}
              onChange={(val) => setValue('role', val as any)}
              options={[
                { value: 'employee', label: 'Employee (Self-only)' },
                { value: 'manager', label: 'Department Manager' },
                { value: 'admin', label: 'Administrator (Full Access)' },
              ]}
            />
            {errors.role?.message && (
              <p className="text-xs text-red-400">{errors.role.message}</p>
            )}
          </div>
        )}

        {selectedRole !== 'admin' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">
              Home Department <span className="text-red-400">*</span>
            </label>
            <Select
              value={watch('homeDepartmentId') || 'dept_general'}
              onChange={(val) => setValue('homeDepartmentId', val)}
              options={departments.map((d) => ({
                value: d.id,
                label: `${d.name} (${d.code})`,
              }))}
            />
            <p className="text-xs text-gray-500">
              Permanent home department for ticket routing and manager scope.
            </p>
          </div>
        )}

        {!isEditing && (
          <Input
            label="Temporary Password"
            type="text"
            placeholder="Min. 6 characters"
            required
            helperText="The user will sign in with this temporary password."
            error={errors.password?.message}
            {...register('password')}
          />
        )}
      </form>
    </Dialog>
  );
}
