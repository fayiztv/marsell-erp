import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Ticket as TicketIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  Dialog,
  LoadingSkeleton,
  EmptyState,
  Pagination,
} from '@/components/ui';
import { useTickets } from '../hooks/useTickets';
import { TicketCard } from '../components/TicketCard';
import { TicketFilters } from '../components/TicketFilters';
import { TicketForm } from '../components/TicketForm';
import { DirectDeleteDialog } from '@/features/approvals/components/DirectDeleteDialog';
import { useApprovals } from '@/features/approvals/hooks/useApprovals';
import { useUIStore } from '@/app/stores/uiStore';
import { usePagination } from '@/hooks/usePagination';
import { ROUTES, PAGE_SIZE } from '@/constants';
import type { Ticket } from '../types/ticket.types';
import { listStaggerVariants, listItemVariants } from '@/utils/animations';

export function AdminTicketListPage() {
  const navigate = useNavigate();
  const filters = useUIStore((s) => s.ticketFilters);

  const { currentPage, currentCursor, nextPage, previousPage } = usePagination();

  const { data, isLoading, isError } = useTickets(filters, currentCursor);

  const { directDelete, isDirectDeleting } = useApprovals();

  // Dialogs state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    ticket: Ticket | null;
  }>({
    isOpen: false,
    ticket: null,
  });

  const handleCardClick = (ticket: Ticket) => {
    navigate(ROUTES.ADMIN.TICKET_DETAIL(ticket.id));
  };

  const handleOpenDelete = (ticket: Ticket) => {
    setDeleteDialog({ isOpen: true, ticket });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.ticket) return;
    await directDelete({
      entityType: 'ticket',
      entityId: deleteDialog.ticket.id,
    });
    setDeleteDialog({ isOpen: false, ticket: null });
  };

  const tickets = data?.items || [];
  const hasMore = data?.hasMore || false;
  const hasActiveFilters = Boolean(
    filters.search ||
    filters.departmentId ||
    filters.status ||
    filters.priority ||
    filters.clientId ||
    filters.assignedToId
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Support Tickets</h1>
          <p className="text-sm text-gray-400 mt-1">
            System-wide ticket tracker across all corporate departments and clients.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Filters Bar */}
      <TicketFilters />

      {/* Content */}
      {isError ? (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
          Failed to load tickets. Please refresh the page.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={<TicketIcon size={24} />}
          title="No tickets found"
          description={
            hasActiveFilters
              ? 'No tickets match your filter criteria.'
              : 'Create your first ticket to begin tracking tasks.'
          }
          action={
            hasActiveFilters ? undefined : (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="size-4 mr-2" />
                Create Ticket
              </Button>
            )
          }
        />
      ) : (
        <motion.div
          variants={listStaggerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {tickets.map((ticket) => (
              <motion.div key={ticket.id} layout variants={listItemVariants}>
                <TicketCard
                  ticket={ticket}
                  onClick={handleCardClick}
                  onDelete={handleOpenDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {tickets.length > 0 && (
        <Pagination
          currentPage={currentPage}
          hasMore={hasMore}
          onNext={() => data?.lastDoc && nextPage(data.lastDoc)}
          onPrevious={previousPage}
          pageSize={PAGE_SIZE}
          itemCount={tickets.length}
        />
      )}

      {/* Create Ticket Dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Ticket"
        description="Provision a ticket and assign it to an employee or manager."
      >
        <TicketForm
          onCancel={() => setIsCreateOpen(false)}
          onSuccess={() => setIsCreateOpen(false)}
        />
      </Dialog>

      {/* Direct Delete Dialog */}
      <DirectDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, ticket: null })}
        onConfirm={handleConfirmDelete}
        entityType="ticket"
        entityName={deleteDialog.ticket?.title || 'Ticket'}
        isLoading={isDirectDeleting}
      />
    </div>
  );
}
