import { SearchBar, Select } from '@/components/ui';
import { useUIStore } from '@/app/stores/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { useClients } from '@/features/clients/hooks/useClients';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import type { TicketStatus, Priority } from '@/types';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/constants';

export function TicketFilters() {
  const { role, firebaseUser, accessibleDepartmentIds, isAdmin } = useAuth();
  const filters = useUIStore((s) => s.ticketFilters);
  const setFilters = useUIStore((s) => s.setTicketFilters);

  // Fetch clients and employees for manager filters
  // We don't strictly need pagination here if we just want all of them, but we use the existing hooks.
  // In a real production app with 10k clients, we'd use an async autocomplete component.
  // For this MVP, we fetch the first page or let them search.
  const { data: clientsData } = useClients({ status: null, search: '' }, null);
  const { data: employeesData } = useEmployees(
    { role: null, status: 'active', search: '' }, 
    null, 
    false, 
    true, 
    isAdmin ? undefined : accessibleDepartmentIds
  );

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

  return (
    <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center w-full">
      <div className="w-full xl:w-64 shrink-0">
        <SearchBar
          value={filters.search}
          onChange={(v) => setFilters({ search: v })}
          placeholder="Search tickets..."
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 w-full">
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
        {(role === 'manager' || role === 'admin') && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
