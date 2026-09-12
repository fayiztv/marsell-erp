import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  History,
  AlertCircle,
} from 'lucide-react';
import {
  Button,
  Pagination,
  LoadingSkeleton,
  StatusBadge,
} from '@/components/ui';
import { useTicketSubscription } from '../hooks/useTickets';
import { usePaginatedTicketHistory } from '../hooks/useTicketHistory';
import { getHistoryActionIcon } from '../utils/historyIcons';
import { usePagination } from '@/hooks/usePagination';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';
import { formatSmartDateTime } from '@/utils/dateUtils';

const PAGE_SIZE = 10;

export function TicketHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();

  const { ticket, isLoading: isTicketLoading, error: ticketError } = useTicketSubscription(id);

  const {
    currentPage,
    currentCursor,
    nextPage,
    previousPage,
  } = usePagination();

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
  } = usePaginatedTicketHistory(id, PAGE_SIZE, currentCursor);

  const getBackUrl = () => {
    if (!id) return '/';
    if (role === 'admin') return ROUTES.ADMIN.TICKET_DETAIL(id);
    if (role === 'manager') return ROUTES.MANAGER.TICKET_DETAIL(id);
    return ROUTES.EMPLOYEE.TICKET_DETAIL(id);
  };

  if (isTicketLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-10">
        <LoadingSkeleton className="h-8 w-32 rounded-lg" />
        <LoadingSkeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (ticketError || !ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-100">Ticket not found</h2>
        <p className="text-sm text-gray-400 mt-2">
          This ticket doesn't exist or you don't have access to its history.
        </p>
        <Button variant="ghost" onClick={() => navigate(getBackUrl())} className="mt-4">
          Return to Ticket
        </Button>
      </div>
    );
  }

  const entries = historyData?.items ?? [];
  const hasMore = historyData?.hasMore ?? false;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Back button */}
      <button
        onClick={() => navigate(getBackUrl())}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Ticket
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-white/[0.06]">
              #{ticket.id}
            </span>
            <StatusBadge status={ticket.status} />
          </div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <History size={22} className="text-blue-400" />
            Audit History
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Complete event log for <span className="text-gray-200 font-medium">"{ticket.title}"</span>
          </p>
        </div>

        <div className="text-right text-xs text-gray-500">
          Created on <span className="text-gray-400">{formatSmartDateTime(ticket.createdAt)}</span>
        </div>
      </div>

      {/* Timeline Card */}
      <div className="p-6 rounded-xl border border-white/[0.06] bg-gray-900/50 space-y-6">
        {isHistoryLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : historyError ? (
          <div className="py-8 text-center text-sm text-red-400 bg-red-500/5 rounded-lg border border-red-500/10 flex flex-col items-center gap-2">
            <AlertCircle size={20} />
            <span>Unable to load ticket history. Please try again.</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500 bg-gray-950/40 rounded-lg border border-white/[0.04]">
            No history events recorded for this ticket.
          </div>
        ) : (
          <div className="relative border-l border-white/[0.3] ml-4 pl-6 space-y-2">
            <AnimatePresence initial={false}>
              {entries.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="relative py-3 group"
                >
                  {/* Timeline dot */}
                  <span className="absolute -left-[33px] top-3.5 flex items-center justify-center size-5 rounded-full bg-gray-950 border border-white/[0.12] shadow-sm">
                    {getHistoryActionIcon(entry.action, 14)}
                  </span>

                  {/* Entry content */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] group-hover:bg-white/[0.04] transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-200 leading-snug font-medium">
                        {entry.details}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Actor: <span className="text-gray-300 font-normal">{entry.actorName}</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 font-mono">
                      {entry.timestamp ? formatSmartDateTime(entry.timestamp) : '—'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination controls */}
        {!isHistoryLoading && !historyError && (
          <div className="pt-2">
            <Pagination
              currentPage={currentPage}
              hasMore={hasMore}
              onNext={() => nextPage(historyData?.lastDoc ?? null)}
              onPrevious={previousPage}
              pageSize={PAGE_SIZE}
              itemCount={entries.length}
            />
          </div>
        )}
      </div>
    </div>
  );
}
