import { useEffect, useMemo } from 'react';
import { Type, Layers, User as UserIcon, Building2 } from 'lucide-react';
import { Input, Textarea, Select, MultiSelect, Button, DatePicker, type MultiSelectOption } from '@/components/ui';
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
  const rawDepartmentIds = watch('departmentIds');
  const rawAssignedToIds = watch('assignedToIds');
  const rawClientIds = watch('clientIds');

  const selectedDepartmentId = rawDepartmentIds?.[0] || '';
  const selectedAssignedToId = rawAssignedToIds?.[0] || '';
  const selectedClientIds = useMemo(() => rawClientIds || [], [rawClientIds]);

  // Fetch departments, clients, and employees
  const { firebaseUser, accessibleDepartmentIds, isAdmin } = useAuth();
  const { data: departmentsData } = useDepartments({ status: 'active', search: '' }, null, 100);
  const { data: clientsData } = useClients({ status: 'active', search: '' }, null, 200);
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees(
    { role: null, status: 'active', search: '' },
    null,
    false, // excludeSelf (we need self to show "Self Assign (You)")
    true,  // excludeAdmin (admin is not in regular assignee pool)
    undefined,
    200
  );

  // Auto-fill department if user has access to exactly 1 department (Create mode only)
  useEffect(() => {
    if (!isEditing && !isAdmin && accessibleDepartmentIds?.length === 1) {
      const current = form.getValues('departmentIds') || [];
      if (current.length === 0) {
        setValue('departmentIds', [accessibleDepartmentIds[0]], {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  }, [isEditing, isAdmin, accessibleDepartmentIds, form, setValue]);

  // Department options for single-select dropdown
  const departmentOptions = useMemo(() => {
    const list = [
      { value: '', label: 'Select a department...' },
    ];
    if (departmentsData?.items) {
      const accessible = departmentsData.items
        .filter((d) => isAdmin || !accessibleDepartmentIds || accessibleDepartmentIds.includes(d.id))
        .map((d) => ({
          value: d.id,
          label: d.code ? `${d.name} (${d.code})` : d.name,
        }));
      list.push(...accessible);
    }
    return list;
  }, [departmentsData?.items, isAdmin, accessibleDepartmentIds]);

  // Assignee options scoped to single selected department
  const employeeOptions = useMemo(() => {
    if (!employeesData?.items || !selectedDepartmentId) {
      return [{ value: '', label: 'Select an employee...' }];
    }

    const currentUserId = firebaseUser?.uid;
    const eligibleEmployees = employeesData.items.filter((emp) => {
      const isHome = emp.homeDepartmentId === selectedDepartmentId;
      const isTemp = emp.temporaryDepartmentIds?.includes(selectedDepartmentId);
      return isHome || isTemp;
    });

    const currentUser = eligibleEmployees.find((e) => e.uid === currentUserId);
    const otherUsers = eligibleEmployees.filter((e) => e.uid !== currentUserId);

    otherUsers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const list = [{ value: '', label: 'Select an employee...' }];

    if (currentUser) {
      list.push({
        value: currentUser.uid,
        label: 'Self Assign (You)',
      });
    }

    otherUsers.forEach((e) => {
      const roleTag = e.role === 'manager' ? ' (Manager)' : '';
      list.push({
        value: e.uid,
        label: `${e.name}${roleTag}`,
      });
    });

    return list;
  }, [employeesData?.items, selectedDepartmentId, firebaseUser?.uid]);

  // Prune assignee if department changes and selected assignee is no longer in that department
  useEffect(() => {
    if (isLoadingEmployees || !employeesData) return;
    const currentAssignedId = form.getValues('assignedToIds')?.[0];
    if (!currentAssignedId) return;

    if (!selectedDepartmentId) {
      setValue('assignedToIds', [], { shouldValidate: true, shouldDirty: true });
      return;
    }

    const isStillValid = employeeOptions.some((opt) => opt.value === currentAssignedId);
    if (!isStillValid) {
      setValue('assignedToIds', [], { shouldValidate: true, shouldDirty: true });
    }
  }, [
    selectedDepartmentId,
    employeeOptions,
    isLoadingEmployees,
    employeesData,
    form,
    setValue,
  ]);

  // Multi-select Client options
  const clientOptions: MultiSelectOption[] = useMemo(() => {
    if (!clientsData?.items) return [];
    return clientsData.items.map((c) => ({
      value: c.id,
      label: c.companyName,
      subLabel: c.contactPerson ? `Contact: ${c.contactPerson}` : undefined,
    }));
  }, [clientsData?.items]);

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

      {/* Row 1: Single-Select Department & Single-Select Assign To */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">
            Department <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 flex items-center text-gray-500 pointer-events-none z-10">
              <Layers size={15} />
            </span>
            <Select
              options={departmentOptions}
              disabled={isSubmitting}
              className="pl-9"
              value={selectedDepartmentId}
              placeholder="Select a department..."
              onChange={(val) => {
                setValue('departmentIds', val ? [val] : [], { shouldValidate: true, shouldDirty: true });
                setValue('assignedToIds', [], { shouldValidate: true, shouldDirty: true });
              }}
            />
          </div>
          {errors.departmentIds?.message && (
            <p className="text-xs text-red-400">{errors.departmentIds.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">
            Assign To <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 flex items-center text-gray-500 pointer-events-none z-10">
              <UserIcon size={15} />
            </span>
            <Select
              options={employeeOptions}
              disabled={isSubmitting || !selectedDepartmentId}
              className="pl-9"
              value={selectedAssignedToId}
              placeholder={selectedDepartmentId ? 'Select an employee...' : 'Select a department first'}
              onChange={(val) => {
                setValue('assignedToIds', val ? [val] : [], { shouldValidate: true, shouldDirty: true });
              }}
            />
          </div>
          {errors.assignedToIds?.message && (
            <p className="text-xs text-red-400">{errors.assignedToIds.message}</p>
          )}
        </div>
      </div>

      {/* Row 2: Multi-Select Client & Single-Select Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MultiSelect
          label="Clients (Optional)"
          options={clientOptions}
          value={selectedClientIds}
          onChange={(ids) => setValue('clientIds', ids, { shouldValidate: true, shouldDirty: true })}
          placeholder="Internal / No Client"
          searchPlaceholder="Search clients by company name..."
          emptySearchMessage="No clients match your search"
          emptyOptionsMessage="No active clients available"
          leftIcon={<Building2 size={15} />}
          chipVariant="emerald"
          disabled={isSubmitting}
          error={errors.clientIds?.message}
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">Priority</label>
          <Select
            options={priorityOptions}
            disabled={isSubmitting}
            value={watch('priority') || 'medium'}
            {...register('priority')}
            onChange={(val) => setValue('priority', val as any, { shouldValidate: true, shouldDirty: true })}
          />
          {errors.priority?.message && (
            <p className="text-xs text-red-400">{errors.priority.message}</p>
          )}
        </div>
      </div>

      {/* Row 3: Due Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300 flex items-center justify-between">
            Due Date (Optional)
            {dueDate && (
              <button
                type="button"
                onClick={() => setValue('dueDate', undefined, { shouldValidate: true, shouldDirty: true })}
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

      {/* Actions */}
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
