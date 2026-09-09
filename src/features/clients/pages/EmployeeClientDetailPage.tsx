import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Mail, Phone, AlignLeft, Calendar, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useClient } from '../hooks/useClients';
import { useTickets } from '@/features/tickets/hooks/useTickets';
import { TicketCard } from '@/features/tickets/components/TicketCard';
import { Pagination, LoadingSkeleton, Button, Badge } from '@/components/ui';
import { formatDate } from '@/utils/dateUtils';
import { listStaggerVariants, listItemVariants } from '@/utils/animations';
import { usePagination } from '@/hooks/usePagination';
import { PAGE_SIZE, ROUTES } from '@/constants';
import { useMemo } from 'react';
import type { Ticket } from '@/features/tickets/types/ticket.types';

export function EmployeeClientDetailPage() {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();

  const { data: client, isLoading: isLoadingClient, isError: isErrorClient } = useClient(clientId || '');

  const {
    currentPage,
    currentCursor,
    nextPage,
    previousPage,
  } = usePagination();

  const filters = useMemo(() => ({
    status: null,
    priority: null,
    clientId: clientId || null,
    assignedToId: firebaseUser?.uid || null,
    departmentId: null,
    search: '',
  }), [clientId, firebaseUser?.uid]);

  const { data: ticketsData, isLoading: isLoadingTickets } = useTickets(filters, currentCursor, undefined, PAGE_SIZE);

  if (isErrorClient) {
    return (
      <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
        Failed to load client details. Please go back and try again.
      </div>
    );
  }

  if (isLoadingClient) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!client) return null;

  const isActive = client.status === 'active';
  const tickets = ticketsData?.items || [];
  const hasMore = ticketsData?.hasMore || false;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <Button variant="ghost" onClick={() => navigate(ROUTES.EMPLOYEE.CLIENTS)} className="mb-2 -ml-2 text-gray-400">
        <ArrowLeft className="size-4 mr-2" />
        Back
      </Button>

      {/* Profile Header */}
      <div className="bg-gray-900/50 border border-white/[0.06] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/2"></div>
        
        <div className="flex items-center gap-6">
          <div className="size-20 md:size-24 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10 shrink-0">
            <Building2 size={40} className="md:size-[48px]" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{client.companyName}</h1>
              <Badge variant={isActive ? 'success' : 'muted'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <div className="font-medium text-gray-300">
                Contact: {client.contactPerson}
              </div>
              <span className="hidden sm:inline text-gray-600">•</span>
              <div className="flex items-center gap-1.5">
                <Mail size={14} className="text-gray-500" />
                <span>{client.email}</span>
              </div>
              {client.phone && (
                <>
                  <span className="hidden sm:inline text-gray-600">•</span>
                  <div className="flex items-center gap-1.5">
                    <Phone size={14} className="text-gray-500" />
                    <span>{client.phone}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-500" />
                <span>Added {formatDate(client.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {client.address && (
        <div className="bg-gray-900/40 p-4 rounded-xl border border-white/[0.04]">
          <div className="flex gap-2 text-sm text-gray-400">
            <AlignLeft size={16} className="shrink-0 mt-0.5 text-gray-500" />
            <div>
              <strong className="text-gray-300 block mb-1">Address & Notes</strong>
              {client.address && <p>{client.address}</p>}
              {client.notes && <p className="mt-2 text-gray-500 whitespace-pre-line">{client.notes}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Relevant Tickets */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-semibold text-gray-200 border-t border-white/[0.06] pt-8">
          Your Tickets for this Client
        </h2>
        {isLoadingTickets ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-[180px] rounded-xl" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center bg-gray-900/30 rounded-xl border border-white/[0.06]">
            <p className="text-sm text-gray-400">No tickets found.</p>
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
                {tickets.map((ticket: Ticket) => (
                  <motion.div key={ticket.id} layout variants={listItemVariants}>
                    <TicketCard 
                      ticket={ticket} 
                      onClick={() => navigate(ROUTES.EMPLOYEE.TICKET_DETAIL(ticket.id))} 
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            <Pagination
              currentPage={currentPage}
              hasMore={hasMore}
              onNext={() => ticketsData?.lastDoc && nextPage(ticketsData.lastDoc)}
              onPrevious={previousPage}
              pageSize={PAGE_SIZE}
              itemCount={tickets.length}
            />
          </div>
        )}
      </div>
    </div>
  );
}
