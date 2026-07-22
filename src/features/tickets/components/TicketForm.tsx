import { Type, Building2, User } from 'lucide-react';
import { Input, Textarea, Select, Button, DatePicker } from '@/components/ui';
import { useTicketForm } from '../hooks/useTicketForm';
import { useClients } from '@/features/clients/hooks/useClients';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import { PRIORITY_LABELS } from '@/constants';
import type { TicketFormData } from '../validation/ticketSchema';

interface TicketFormProps {
  defaultValues?: Partial<TicketFormData>;
  editId?: string;
  onCancel: () => void;
}

export function TicketForm({ defaultValues, editId, onCancel }: TicketFormProps) {
  const { form, onSubmit, isSubmitting, isEditing } = useTicketForm(defaultValues, editId);
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const dueDate = watch('dueDate');

  // Fetch clients and employees to populate dropdowns
  const { data: clientsData } = useClients({ search: '' }, null);
  const { data: employeesData } = useEmployees({ role: 'employee', status: 'active', search: '' }, null);

  const clientOptions = [
    { value: '', label: 'Select a client...' },
    ...(clientsData?.items.map((c) => ({ value: c.id, label: c.companyName })) || []),
  ];

  const employeeOptions = [
    { value: '', label: 'Select an employee...' },
    ...(employeesData?.items.map((e) => ({ value: e.uid, label: e.name })) || []),
  ];

  const priorityOptions = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {errors.root && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
          <p className="text-sm text-red-400">{errors.root.message}</p>
        </div>
      )}

      <Input
        label="Ticket Title"
        type="text"
        placeholder="Brief summary of the issue"
        leftIcon={<Type size={15} />}
        error={errors.title?.message}
        disabled={isSubmitting}
        {...register('title')}
      />

      <Textarea
        label="Description"
        placeholder="Detailed explanation of the issue, steps to reproduce, etc."
        rows={4}
        error={errors.description?.message}
        disabled={isSubmitting}
        {...register('description')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">Client</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 flex items-center text-gray-500 pointer-events-none">
              <Building2 size={15} />
            </span>
            <Select
              options={clientOptions}
              disabled={isSubmitting}
              className="pl-9"
              {...register('clientId')}
              onChange={(val) => setValue('clientId', val, { shouldValidate: true, shouldDirty: true })}
            />
          </div>
          {errors.clientId?.message && (
            <p className="text-xs text-red-400">{errors.clientId.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">Assign To</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 flex items-center text-gray-500 pointer-events-none">
              <User size={15} />
            </span>
            <Select
              options={employeeOptions}
              disabled={isSubmitting}
              className="pl-9"
              {...register('assignedToId')}
              onChange={(val) => setValue('assignedToId', val, { shouldValidate: true, shouldDirty: true })}
            />
          </div>
          {errors.assignedToId?.message && (
            <p className="text-xs text-red-400">{errors.assignedToId.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">Priority</label>
          <Select
            options={priorityOptions}
            disabled={isSubmitting}
            {...register('priority')}
            onChange={(val) => setValue('priority', val, { shouldValidate: true, shouldDirty: true })}
          />
          {errors.priority?.message && (
            <p className="text-xs text-red-400">{errors.priority.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300 flex items-center justify-between">
            Due Date
            {dueDate && (
              <button
                type="button"
                onClick={() => setValue('dueDate', undefined)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Clear
              </button>
            )}
          </label>
          <DatePicker
            selected={dueDate}
            onSelect={(date) => setValue('dueDate', date)}
            placeholder="Select a due date"
            disabled={isSubmitting}
          />
          {errors.dueDate?.message && (
            <p className="text-xs text-red-400">{errors.dueDate.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.04]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditing ? 'Save Changes' : 'Create Ticket'}
        </Button>
      </div>
    </form>
  );
}
