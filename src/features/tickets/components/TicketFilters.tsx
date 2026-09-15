import { SearchBar, Select, DateRangeFilter } from '@/components/ui';
import { useUIStore } from '@/app/stores/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { useClients } from '@/features/clients/hooks/useClients';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import type { TicketStatus, Priority } from '@/types';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/constants';

export function TicketFilters() {
  const { role, firebaseUser, accessibleDepartmentIds, isAdmin } = useAuth();
  const filters = useUIStore((s) => s.ticketFilters);
  const setFilters = useUIStore((s) => s.setTicketFilters);

  // Fetch departments, clients and employees
  const { data: deptData } = useDepartments({ status: 'active', search: '' });
  const { data: clientsData } = useClients({ status: null, search: '' }, null);
  const { data: employeesData } = useEmployees(
    { role: null, status: 'active', search: '' }, 
    null, 
    false, 
    true, 
    isAdmin ? undefined : accessibleDepartmentIds
  );

  const accessibleDepts =
    deptData?.items.filter(
      (d) => isAdmin || (accessibleDepartmentIds && accessibleDepartmentIds.includes(d.id))
    ) || [];

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...accessibleDepts.map((d) => ({
      value: d.id,
      label: `${d.name} (${d.code})`,
    })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    ...Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const clientOptions = [
    { value: '', label: 'All Clients' },
    { value: 'none', label: 'Internal / No Client' },
    ...(clientsData?.items.map((c) => ({ value: c.id, label: c.companyName })) || []),
  ];

  const employeeOptions = [
    { value: '', label: 'All Employees' },
  ];
  
  if (employeesData?.items) {
    const currentUserId = firebaseUser?.uid;
    const currentUser = employeesData.items.find(e => e.uid === currentUserId);
    const otherUsers = employeesData.items.filter(e => e.uid !== currentUserId);
    
    if (currentUser) {
      employeeOptions.push({ value: currentUser.uid, label: 'My Tickets' });
    }
    otherUsers.forEach(e => {
      employeeOptions.push({ value: e.uid, label: e.name });
    });
  }

  const showDepartmentFilter = isAdmin || (accessibleDepartmentIds && accessibleDepartmentIds.length > 1);

  if (role === 'employee') {
    return (
      <div className="flex flex-col gap-3.5 w-full bg-gray-900/40 p-4 rounded-xl border border-white/[0.06]">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between w-full">
          {/* Left group: Search, Status, Priority */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto flex-1">
            <div className="w-full sm:w-64 shrink-0">
              <SearchBar
                value={filters.search}
                onChange={(v) => setFilters({ search: v })}
                placeholder="Search tickets..."
              />
            </div>
            <Select
              value={filters.status || ''}
              onChange={(value) => setFilters({ status: (value as TicketStatus) || null })}
              options={statusOptions}
              aria-label="Filter by status"
              className="w-36"
            />
            <Select
              value={filters.priority || ''}
              onChange={(value) => setFilters({ priority: (value as Priority) || null })}
              options={priorityOptions}
              aria-label="Filter by priority"
              className="w-36"
            />
          </div>

          {/* Right group: Date Range Filter */}
          <div className="shrink-0 w-full lg:w-auto flex justify-start lg:justify-end">
            <DateRangeFilter
              startDate={filters.startDate}
              endDate={filters.endDate}
              onChange={(range) => {
                setFilters({
                  startDate: range?.startDate ?? null,
                  endDate: range?.endDate ?? null,
                });
              }}
              defaultValue="all_time"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 w-full bg-gray-900/40 p-4 rounded-xl border border-white/[0.06]">
      <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center w-full">
        <div className="w-full xl:w-64 shrink-0">
          <SearchBar
            value={filters.search}
            onChange={(v) => setFilters({ search: v })}
            placeholder="Search tickets..."
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full">
          {showDepartmentFilter && (
            <Select
              value={filters.departmentId || ''}
              onChange={(value) => setFilters({ departmentId: value || null })}
              options={departmentOptions}
              aria-label="Filter by department"
              className="w-48"
            />
          )}
          <Select
            value={filters.status || ''}
            onChange={(value) => setFilters({ status: (value as TicketStatus) || null })}
            options={statusOptions}
            aria-label="Filter by status"
            className="w-36"
          />
          <Select
            value={filters.priority || ''}
            onChange={(value) => setFilters({ priority: (value as Priority) || null })}
            options={priorityOptions}
            aria-label="Filter by priority"
            className="w-36"
          />
          <Select
            value={filters.clientId || ''}
            onChange={(value) => setFilters({ clientId: value || null })}
            options={clientOptions}
            aria-label="Filter by client"
            className="w-48"
          />
          <Select
            value={filters.assignedToId || ''}
            onChange={(value) => setFilters({ assignedToId: value || null })}
            options={employeeOptions}
            aria-label="Filter by assigned employee"
            className="w-48"
          />
        </div>
      </div>

      <div className="pt-2.5 border-t border-white/[0.04]">
        <DateRangeFilter
          startDate={filters.startDate}
          endDate={filters.endDate}
          onChange={(range) => {
            setFilters({
              startDate: range?.startDate ?? null,
              endDate: range?.endDate ?? null,
            });
          }}
          defaultValue="all_time"
          label="Created Date"
        />
      </div>
    </div>
  );
}
