import { SearchBar, Select } from '@/components/ui';
import { useUIStore } from '@/app/stores/uiStore';
import type { UserRole, UserStatus } from '@/types';

export function EmployeeFilters() {
  const filters = useUIStore((s) => s.employeeFilters);
  const setFilters = useUIStore((s) => s.setEmployeeFilters);

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'manager', label: 'Manager' },
    { value: 'employee', label: 'Employee' },
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'blocked', label: 'Blocked' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
      <div className="w-full sm:w-64 shrink-0">
        <SearchBar
          value={filters.search}
          onChange={(v) => setFilters({ search: v })}
          placeholder="Search employees..."
        />
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Select
          value={filters.role || ''}
          onChange={(value) => setFilters({ role: (value as UserRole) || null })}
          options={roleOptions}
          aria-label="Filter by role"
        />
        <Select
          value={filters.status || ''}
          onChange={(value) => setFilters({ status: (value as UserStatus) || null })}
          options={statusOptions}
          aria-label="Filter by status"
        />
      </div>
    </div>
  );
}
