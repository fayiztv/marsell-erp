import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeeFormSchema, type EmployeeFormData } from '../validation/employeeSchema';
import { useCreateEmployee, useUpdateEmployee } from './useEmployees';
import { useUIStore } from '@/app/stores/uiStore';

export function useEmployeeForm(defaultValues?: Partial<EmployeeFormData>, editUid?: string) {
  const isEditing = !!editUid;
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const closeDialog = useUIStore((s) => s.closeDialog);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      role: defaultValues?.role || 'employee',
      homeDepartmentId: defaultValues?.homeDepartmentId || null,
      password: '',
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      if (isEditing) {
        // Exclude password and role for updates
        const { password: _password, role: _role, ...updateData } = data;
        await updateMutation.mutateAsync({ uid: editUid, data: updateData });
      } else {
        await createMutation.mutateAsync(data);
      }
      closeDialog();
    } catch (error: any) {
      form.setError('root', { message: error.message || 'Operation failed.' });
    }
  });

  return {
    form,
    onSubmit,
    isSubmitting: isEditing ? updateMutation.isPending : createMutation.isPending,
    isEditing,
  };
}
