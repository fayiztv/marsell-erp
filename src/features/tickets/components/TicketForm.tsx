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

  const selectedDepartmentIds = useMemo(() => rawDepartmentIds || [], [rawDepartmentIds]);
  const selectedAssignedToIds = useMemo(() => rawAssignedToIds || [], [rawAssignedToIds]);
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

  // Department options filtered by creator's access
  const departmentOptions: MultiSelectOption[] = useMemo(() => {
    if (!departmentsData?.items) return [];
    return departmentsData.items
      .filter((d) => isAdmin || !accessibleDepartmentIds || accessibleDepartmentIds.includes(d.id))
      .map((d) => ({
        value: d.id,
        label: d.name,
        badge: d.code ? { text: d.code, variant: 'purple' } : undefined,
      }));
  }, [departmentsData?.items, isAdmin, accessibleDepartmentIds]);

  // Candidate pool = UNION of all Employees and Managers who have access (home or temp) to AT LEAST ONE selected department
  const assigneeOptions: MultiSelectOption[] = useMemo(() => {
    if (!employeesData?.items || selectedDepartmentIds.length === 0) {
      return [];
    }

    const currentUserId = firebaseUser?.uid;
    const depts = departmentsData?.items || [];

    // Filter by union of selected departments
    const eligible = employeesData.items.filter((emp) => {
      const isHome = emp.homeDepartmentId && selectedDepartmentIds.includes(emp.homeDepartmentId);
      const isTemp = emp.temporaryDepartmentIds?.some((id) => selectedDepartmentIds.includes(id));
      return isHome || isTemp;
    });

    const currentUser = eligible.find((e) => e.uid === currentUserId);
    const otherUsers = eligible.filter((e) => e.uid !== currentUserId);

    // Sort alphabetically by name
    otherUsers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const result: MultiSelectOption[] = [];
    if (currentUser) {
      const homeDept = depts.find((d) => d.id === currentUser.homeDepartmentId);
      result.push({
        value: currentUser.uid,
        label: 'Self Assign (You)',
        chipLabel: `${currentUser.name} (You)`,
        subLabel: homeDept ? `Home: ${homeDept.name}` : undefined,
        avatar: { name: currentUser.name },
        badge: {
          text: currentUser.role,
          variant: currentUser.role === 'manager' ? 'purple' : 'default',
        },
        isSpecial: true,
      });
    }

    otherUsers.forEach((u) => {
      const homeDept = depts.find((d) => d.id === u.homeDepartmentId);
      result.push({
        value: u.uid,
        label: u.name,
        subLabel: homeDept ? `Home: ${homeDept.name}` : undefined,
        avatar: { name: u.name },
        badge: {
          text: u.role,
          variant: u.role === 'manager' ? 'purple' : 'default',
        },
      });
    });

    return result;
  }, [employeesData?.items, selectedDepartmentIds, firebaseUser?.uid, departmentsData?.items]);

  // Prune assignees that are no longer eligible when departments change
  useEffect(() => {
    if (isLoadingEmployees || !employeesData) return;

    const currentAssigned = form.getValues('assignedToIds') || [];
    if (currentAssigned.length === 0) return;

    // If no departments selected, prune all
    if (selectedDepartmentIds.length === 0) {
      setValue('assignedToIds', [], { shouldValidate: true, shouldDirty: true });
      return;
    }

    const eligibleIds = new Set(assigneeOptions.map((c) => c.value));
    const validAssigned = currentAssigned.filter((id) => eligibleIds.has(id));

    if (validAssigned.length !== currentAssigned.length) {
      setValue('assignedToIds', validAssigned, { shouldValidate: true, shouldDirty: true });
    }
  }, [
    selectedDepartmentIds,
    assigneeOptions,
    isLoadingEmployees,
    employeesData,
    form,
    setValue,
  ]);

  // Client options
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

  const hasDepartmentsSelected = selectedDepartmentIds.length > 0;

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

      {/* Row 1: Department & Assignee Multi-Selects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MultiSelect
          label="Departments"
          required
          options={departmentOptions}
          value={selectedDepartmentIds}
          onChange={(ids) => setValue('departmentIds', ids, { shouldValidate: true, shouldDirty: true })}
          placeholder="Select departments..."
          searchPlaceholder="Search departments..."
          emptySearchMessage="No departments match your search"
          emptyOptionsMessage="No accessible departments available"
          leftIcon={<Layers size={15} />}
          chipVariant="purple"
          disabled={isSubmitting}
          error={errors.departmentIds?.message}
        />

        <MultiSelect
          label="Assign To"
          required
          options={assigneeOptions}
          value={selectedAssignedToIds}
          onChange={(ids) => setValue('assignedToIds', ids, { shouldValidate: true, shouldDirty: true })}
          placeholder={hasDepartmentsSelected ? 'Select assignees...' : 'Select department(s) first'}
          searchPlaceholder="Search assignees by name or dept..."
          emptySearchMessage="No assignees match your search"
          emptyOptionsMessage={
            hasDepartmentsSelected
              ? 'No eligible employees or managers in selected departments'
              : 'Please select department(s) above first to assign members'
          }
          leftIcon={<UserIcon size={15} />}
          chipVariant="blue"
          disabled={isSubmitting || !hasDepartmentsSelected}
          error={errors.assignedToIds?.message}
        />
      </div>

      {/* Row 2: Client Multi-Select & Priority */}
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
