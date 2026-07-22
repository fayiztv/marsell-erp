import { Plus, Ticket as TicketIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button, Pagination, EmptyState, LoadingSkeleton, Dialog } from '@/components/ui';
import { useUIStore } from '@/app/stores/uiStore';
import { useTickets } from '../hooks/useTickets';
import { TicketCard } from '../components/TicketCard';
import { TicketFilters } from '../components/TicketFilters';
import { TicketForm } from '../components/TicketForm';
import { usePagination } from '@/hooks/usePagination';
import { listStaggerVariants, listItemVariants } from '@/utils/animations';
import { ROUTES } from '@/constants';
import type { Ticket } from '../types/ticket.types';

export function ManagerTicketListPage() {
  const navigate = useNavigate();
  const filters = useUIStore((s) => s.ticketFilters);
  const activeDialog = useUIStore((s) => s.activeDialog);
  const openDialog = useUIStore((s) => s.openDialog);
  const closeDialog = useUIStore((s) => s.closeDialog);

  const {
    currentPage,
    currentCursor,
    nextPage,
    previousPage,
    isFirstPage,
  } = usePagination();

  const { data, isLoading, isError } = useTickets(filters, currentCursor);

  const handleCardClick = (ticket: Ticket) => {
    navigate(ROUTES.MANAGER.TICKET_DETAIL(ticket.id));
  };

  const tickets = data?.items || [];
  const hasMore = data?.hasMore || false;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Tickets</h1>
          <p className="text-sm text-gray-400 mt-1">Manage, assign, and track client requests.</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => openDialog('create-ticket')}
        >
          New Ticket
        </Button>
      </div>

      {/* Filters */}
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
          title="No tickets found"
          description="Try adjusting your filters or search query."
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
            hasNextPage={hasMore}
            hasPreviousPage={!isFirstPage}
            onNextPage={() => nextPage(data.lastDoc)}
            onPreviousPage={previousPage}
          />
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        isOpen={activeDialog === 'create-ticket'}
        onClose={closeDialog}
        title="Create Ticket"
        description="Open a new ticket for a client."
      >
        <TicketForm onCancel={closeDialog} />
      </Dialog>
    </div>
  );
}
