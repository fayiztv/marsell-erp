import { Type, Building2, User, Layers } from 'lucide-react';
import { Input, Textarea, Select, Button, DatePicker } from '@/components/ui';
import { useTicketForm } from '../hooks/useTicketForm';
import { useClients } from '@/features/clients/hooks/useClients';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import { useAuth } from '@/hooks/useAuth';
import { PRIORITY_LABELS } from '@/constants';
import type { TicketFormData } from '../validation/ticketSchema';

export interface TicketFormProps {
  defaultValues?: Partial<TicketFormData> | undefined;
  editId?: string | undefined;
  onCancel: () => void;
  onSuccess?: (() => void) | undefined;
}

export function TicketForm({ defaultValues, editId, onCancel, onSuccess }: TicketFormProps) {
  const { form, onSubmit, isSubmitting, isEditing } = useTicketForm(defaultValues, editId, onSuccess);
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const dueDate = watch('dueDate');
  const selectedDepartmentId = watch('departmentId');

  // Fetch clients and employees to populate dropdowns
  const { firebaseUser, accessibleDepartmentIds, isAdmin } = useAuth();
  const { data: clientsData } = useClients({ status: 'active', search: '' }, null);
  const { data: departmentsData } = useDepartments({ status: 'active', search: '' });
  const { data: employeesData } = useEmployees(
    { role: null, status: 'active', search: '' },
    null,
    true,
    false,
    accessibleDepartmentIds
  );

  const clientOptions = [
    { value: '', label: 'Internal / No Client' },
    ...(clientsData?.items.map((c) => ({ value: c.id, label: c.companyName })) || []),
  ];

  const departmentOptions = [
    { value: '', label: 'Select a department...' },
    ...(departmentsData?.items
      .filter((d) => isAdmin || !accessibleDepartmentIds || accessibleDepartmentIds.includes(d.id))
      .map((d) => ({ value: d.id, label: d.name })) || []),
  ];

  const employeeOptions = [
    { value: '', label: 'Select an employee...' },
  ];
  
  if (employeesData?.items && selectedDepartmentId) {
    const currentUserId = firebaseUser?.uid;
    const eligibleEmployees = employeesData.items.filter((e) => {
      const isHome = e.homeDepartmentId === selectedDepartmentId;
      const isTemp = e.temporaryDepartmentIds?.includes(selectedDepartmentId);
      return isHome || isTemp;
    });

    const currentUser = eligibleEmployees.find(e => e.uid === currentUserId);
    const otherUsers = eligibleEmployees.filter(e => e.uid !== currentUserId);
    
    if (currentUser) {
      employeeOptions.push({ value: currentUser.uid, label: 'Self Assign (You)' });
    }
    otherUsers.forEach(e => {
      employeeOptions.push({ value: e.uid, label: e.name });
    });
  }

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
          <label className="text-sm font-medium text-gray-300">Client (Optional)</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 flex items-center text-gray-500 pointer-events-none">
              <Building2 size={15} />
            </span>
            <Select
              options={clientOptions}
              disabled={isSubmitting}
              className="pl-9"
              value={watch('clientId') || ''}
              {...register('clientId')}
              onChange={(val) => setValue('clientId', val, { shouldValidate: true, shouldDirty: true })}
            />
          </div>
          {errors.clientId?.message && (
            <p className="text-xs text-red-400">{errors.clientId.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">Department</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 flex items-center text-gray-500 pointer-events-none">
              <Layers size={15} />
            </span>
            <Select
              options={departmentOptions}
              disabled={isSubmitting || isEditing}
              className="pl-9"
              value={watch('departmentId') || ''}
              {...register('departmentId')}
              onChange={(val) => {
                setValue('departmentId', val, { shouldValidate: true, shouldDirty: true });
                setValue('assignedToId', '', { shouldValidate: true, shouldDirty: true });
              }}
            />
          </div>
          {errors.departmentId?.message && (
            <p className="text-xs text-red-400">{errors.departmentId.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">Assign To</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 flex items-center text-gray-500 pointer-events-none">
              <User size={15} />
            </span>
            <Select
              options={employeeOptions}
              disabled={isSubmitting || !selectedDepartmentId}
              className="pl-9"
              value={watch('assignedToId') || ''}
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
            value={watch('priority') || ''}
            {...register('priority')}
            onChange={(val) => setValue('priority', val as any, { shouldValidate: true, shouldDirty: true })}
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
            value={dueDate || ''}
            {...register('dueDate')}
            onChange={(e) => setValue('dueDate', e.target.value, { shouldValidate: true, shouldDirty: true })}
            placeholder="Select a due date"
            disabled={isSubmitting}
            min={new Date().toISOString().split('T')[0]}
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
