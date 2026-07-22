import { SearchBar } from '@/components/ui';
import { useUIStore } from '@/app/stores/uiStore';

export function ClientFilters() {
  const filters = useUIStore((s) => s.clientFilters);
  const setFilters = useUIStore((s) => s.setClientFilters);

  return (
    <div className="flex w-full items-center">
      <div className="w-full sm:w-80">
        <SearchBar
          value={filters.search}
          onChange={(v) => setFilters({ search: v })}
          placeholder="Search by company, contact, or email..."
        />
      </div>
    </div>
  );
}
