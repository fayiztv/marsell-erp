import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Pagination, LoadingSkeleton } from '@/components/ui';
import { Ticket as TicketIcon } from 'lucide-react';
import { useTickets } from '@/features/tickets/hooks/useTickets';
import { TicketCard } from '@/features/tickets/components/TicketCard';
import { usePagination } from '@/hooks/usePagination';
import { listStaggerVariants, listItemVariants } from '@/utils/animations';
import { PAGE_SIZE, ROUTES } from '@/constants';
import type { Ticket } from '@/features/tickets/types/ticket.types';
import { useAuth } from '@/hooks/useAuth';

export function UserAssignedTickets({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const { role, accessibleDepartmentIds } = useAuth();
  
  const {
    currentPage,
    currentCursor,
    nextPage,
    previousPage,
  } = usePagination();

  const filters = useMemo(() => ({
    status: null,
    priority: null,
    clientId: null,
    assignedToId: userId,
    departmentId: null,
    search: '',
  }), [userId]);

  const { data, isLoading, isError } = useTickets(
    filters, 
    currentCursor, 
    role === 'manager' ? accessibleDepartmentIds : undefined, 
    PAGE_SIZE
  );

  const handleCardClick = (ticket: Ticket) => {
    if (role === 'admin') {
      navigate(ROUTES.ADMIN.TICKET_DETAIL(ticket.id));
    } else if (role === 'manager') {
      navigate(ROUTES.MANAGER.TICKET_DETAIL(ticket.id));
    } else {
      navigate(ROUTES.EMPLOYEE.TICKET_DETAIL(ticket.id));
    }
  };

  const tickets = data?.items || [];
  const hasMore = data?.hasMore || false;

  return (
    <div className="space-y-4 pt-8">
      <h2 className="text-lg font-semibold text-gray-200 border-t border-white/[0.06] pt-8">
        Assigned Tickets
      </h2>
      
      {isError ? (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
          Failed to load assigned tickets.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-8 text-center bg-gray-900/30 rounded-xl border border-white/[0.06]">
          <TicketIcon className="size-8 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No tickets currently assigned.</p>
        </div>
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
