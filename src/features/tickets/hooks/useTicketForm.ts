import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ticketFormSchema, type TicketFormData } from '../validation/ticketSchema';
import { useCreateTicket, useUpdateTicket } from './useTickets';
import { useUIStore } from '@/app/stores/uiStore';

export function useTicketForm(
  defaultValues?: Partial<TicketFormData>,
  editId?: string,
  onSuccess?: () => void
) {
  const isEditing = !!editId;
  const createMutation = useCreateTicket();
  const updateMutation = useUpdateTicket();
  const closeDialog = useUIStore((s) => s.closeDialog);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema) as any,
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      departmentIds: defaultValues?.departmentIds || [],
      assignedToIds: defaultValues?.assignedToIds || [],
      clientIds: defaultValues?.clientIds || [],
      priority: defaultValues?.priority || 'medium',
      dueDate: defaultValues?.dueDate || undefined,
    },
  });

  const deptIdsKey = defaultValues?.departmentIds?.join(',') ?? '';
  const assigneeIdsKey = defaultValues?.assignedToIds?.join(',') ?? '';
  const clientIdsKey = defaultValues?.clientIds?.join(',') ?? '';
  const title = defaultValues?.title ?? '';
  const description = defaultValues?.description ?? '';
  const priority = defaultValues?.priority ?? 'medium';
  const dueDate = defaultValues?.dueDate ?? '';

  // Re-sync form when defaultValues arrive (prevents edit pre-fill bugs)
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        title: defaultValues.title || '',
        description: defaultValues.description || '',
        departmentIds: defaultValues.departmentIds || [],
        assignedToIds: defaultValues.assignedToIds || [],
        clientIds: defaultValues.clientIds || [],
        priority: defaultValues.priority || 'medium',
        dueDate: defaultValues.dueDate || undefined,
      });
    }
  }, [
    defaultValues,
    form,
    title,
    description,
    deptIdsKey,
    assigneeIdsKey,
    clientIdsKey,
    priority,
    dueDate,
  ]);

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: editId, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      closeDialog();
      onSuccess?.();
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
