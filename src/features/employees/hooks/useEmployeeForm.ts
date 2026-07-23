import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type EmployeeFormData } from '../validation/employeeSchema';
import { useCreateEmployee, useUpdateEmployee } from './useEmployees';
import { useUIStore } from '@/app/stores/uiStore';

import { z } from 'zod';

export function useEmployeeForm(defaultValues?: Partial<EmployeeFormData>, editUid?: string) {
  const isEditing = !!editUid;
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const closeDialog = useUIStore((s) => s.closeDialog);

  const formSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(5, 'Phone number must be at least 5 characters').optional().or(z.literal('')),
    role: z.enum(['manager', 'employee']),
    password: isEditing 
      ? z.string().optional().or(z.literal('')) 
      : z.string().min(6, 'Password must be at least 6 characters'),
  });

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      role: defaultValues?.role || 'employee',
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
      // The error is already handled by the mutation and toast, but we can catch here
      // if we want to set root form errors
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
