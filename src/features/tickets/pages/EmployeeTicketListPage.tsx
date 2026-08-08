import { Ticket as TicketIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button, Pagination, EmptyState, LoadingSkeleton } from '@/components/ui';
import { useUIStore } from '@/app/stores/uiStore';
import { useTickets } from '../hooks/useTickets';
import { TicketCard } from '../components/TicketCard';
import { TicketFilters } from '../components/TicketFilters';
import { usePagination } from '@/hooks/usePagination';
import { listStaggerVariants, listItemVariants } from '@/utils/animations';
import { PAGE_SIZE, ROUTES } from '@/constants';
import type { Ticket } from '../types/ticket.types';

export function EmployeeTicketListPage() {
  const navigate = useNavigate();
  const filters = useUIStore((s) => s.ticketFilters);

  const {
    currentPage,
    currentCursor,
    nextPage,
    previousPage,
  } = usePagination();

  const { data, isLoading, isError } = useTickets(filters, currentCursor);

  const handleCardClick = (ticket: Ticket) => {
    navigate(ROUTES.EMPLOYEE.TICKET_DETAIL(ticket.id));
  };

  const tickets = data?.items || [];
  const hasMore = data?.hasMore || false;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100 tracking-tight">My Tickets</h1>
        <p className="text-sm text-gray-400 mt-1">View and update your assigned tasks.</p>
      </div>

      {/* Filters (Assignee/Client are hidden for employees in the component itself) */}
      <TicketFilters />

      {/* Content */}
      {isError ? (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
          Failed to load tickets. Please try again.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={<TicketIcon size={24} />}
          title="No assigned tickets"
          description="You're all caught up! Enjoy your day."
          action={
            <Button variant="outline" onClick={() => useUIStore.getState().resetTicketFilters()}>
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <motion.div
            variants={listStaggerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {tickets.map((ticket) => (
                <motion.div key={ticket.id} layout variants={listItemVariants}>
                  <TicketCard ticket={ticket} onClick={handleCardClick} />
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
            itemCount={tickets.length}
          />
        </div>
      )}
    </div>
  );
}
