import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ticketFormSchema, type TicketFormData } from '../validation/ticketSchema';
import { useCreateTicket, useUpdateTicket } from './useTickets';
import { useUIStore } from '@/app/stores/uiStore';

export function useTicketForm(defaultValues?: Partial<TicketFormData>, editId?: string) {
  const isEditing = !!editId;
  const createMutation = useCreateTicket();
  const updateMutation = useUpdateTicket();
  const closeDialog = useUIStore((s) => s.closeDialog);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      clientId: defaultValues?.clientId || '',
      assignedToId: defaultValues?.assignedToId || '',
      priority: defaultValues?.priority || 'medium',
      dueDate: defaultValues?.dueDate || undefined,
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
