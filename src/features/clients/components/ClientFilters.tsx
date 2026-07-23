import { SearchBar, Select } from '@/components/ui';
import { useUIStore } from '@/app/stores/uiStore';
import type { ClientStatus } from '@/types';

export function ClientFilters() {
  const filters = useUIStore((s) => s.clientFilters);
  const setFilters = useUIStore((s) => s.setClientFilters);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
      <div className="w-full sm:w-80 shrink-0">
        <SearchBar
          value={filters.search}
          onChange={(v) => setFilters({ search: v })}
          placeholder="Search by company, contact, or email..."
        />
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Select
          value={filters.status || ''}
          onChange={(value) => setFilters({ status: (value as ClientStatus) || null })}
          options={statusOptions}
          aria-label="Filter by status"
        />
      </div>
    </div>
  );
}
