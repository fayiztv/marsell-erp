import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pagination, EmptyState, LoadingSkeleton } from '@/components/ui';
import { useUIStore } from '@/app/stores/uiStore';
import { useClients } from '../hooks/useClients';
import { ClientCard } from '../components/ClientCard';
import { ClientFilters } from '../components/ClientFilters';
import { usePagination } from '@/hooks/usePagination';
import type { Client } from '../types/client.types';
import { listStaggerVariants, listItemVariants } from '@/utils/animations';
import { PAGE_SIZE, ROUTES } from '@/constants';

export function EmployeeClientListPage() {
  const filters = useUIStore((s) => s.clientFilters);
  const navigate = useNavigate();

  const {
    currentPage,
    currentCursor,
    nextPage,
    previousPage,
  } = usePagination();

  const { data, isLoading, isError } = useClients(filters, currentCursor);

  const handleCardClick = (client: Client) => {
    navigate(ROUTES.EMPLOYEE.CLIENT_DETAIL(client.id));
  };

  const clients = data?.items || [];
  const hasMore = data?.hasMore || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Clients</h1>
          <p className="text-sm text-gray-400 mt-1">Directory of external companies and contacts.</p>
        </div>
      </div>

      {/* Filters */}
      <ClientFilters />

      {/* Content */}
      {isError ? (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
          Failed to load clients. Please try again.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-[140px] rounded-xl" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<Building2 size={24} />}
          title="No clients found"
          description="Try adjusting your search query."
          action={
            <button
              onClick={() => useUIStore.getState().setClientFilters({ search: '' })}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          <motion.div
            variants={listStaggerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {clients.map((client) => (
                <motion.div key={client.id} layout variants={listItemVariants}>
                  <ClientCard
                    client={client}
                    onClick={handleCardClick}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onToggleStatus={() => {}}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          <Pagination
            currentPage={currentPage}
            hasMore={hasMore}
            onNext={() => data?.lastDoc && nextPage(data.lastDoc)}
            onPrevious={previousPage}
            pageSize={PAGE_SIZE}
            itemCount={clients.length}
          />
        </div>
      )}
    </div>
  );
}
