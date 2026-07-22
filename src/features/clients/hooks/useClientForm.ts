import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientFormSchema, type ClientFormData } from '../validation/clientSchema';
import { useCreateClient, useUpdateClient } from './useClients';
import { useUIStore } from '@/app/stores/uiStore';

export function useClientForm(defaultValues?: Partial<ClientFormData>, editId?: string) {
  const isEditing = !!editId;
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const closeDialog = useUIStore((s) => s.closeDialog);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      companyName: defaultValues?.companyName || '',
      contactPerson: defaultValues?.contactPerson || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      address: defaultValues?.address || '',
      notes: defaultValues?.notes || '',
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: editId, data });
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
