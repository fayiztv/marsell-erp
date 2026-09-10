import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  PlusCircle,
  ArrowRightLeft,
  Pencil,
  AlertCircle,
} from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui';
import { useTicketHistory } from '../hooks/useTicketHistory';
import { formatRelativeTime } from '@/utils/dateUtils';

interface TicketHistorySectionProps {
  ticketId: string;
}

function actionIcon(action: string) {
  switch (action) {
    case 'ticket_created': return <PlusCircle size={13} className="text-emerald-400 shrink-0" />;
    case 'reassigned':     return <ArrowRightLeft size={13} className="text-blue-400 shrink-0" />;
    case 'field_updated':  return <Pencil size={13} className="text-amber-400 shrink-0" />;
    default:               return <AlertCircle size={13} className="text-gray-500 shrink-0" />;
  }
}

export function TicketHistorySection({ ticketId }: TicketHistorySectionProps) {
  const { entries, isLoading, error } = useTicketHistory(ticketId);

  return (
    <div className="pb-4">
      {/* Section header */}
      <h2 className="text-sm font-semibold text-gray-300 border-t border-white/[0.06] pt-6 mb-3 flex items-center gap-1.5">
        <History size={14} className="text-blue-400" />
        History
        {!isLoading && (
          <span className="font-normal text-gray-600 ml-0.5">({entries.length})</span>
        )}
      </h2>

      {/* Scrollable timeline — max-height constrains the container, overflow-y-auto enables internal scroll */}
      <div className="max-h-72 overflow-y-auto pr-1 space-y-0 scrollbar-thin">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-8 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="py-4 text-center text-xs text-red-400">
            Unable to load history. Please try again.
          </div>
        ) : entries.length === 0 ? (
          <div className="py-5 text-center text-xs text-gray-600 bg-gray-900/20 rounded-lg border border-white/[0.04]">
            No history yet.
          </div>
        ) : (
          /* Vertical timeline: left border acts as the "spine" */
          <div className="relative border-l border-white/[0.06] ml-1.5 pl-4 space-y-0">
            <AnimatePresence initial={false}>
              {entries.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="relative py-2 group"
                >
                  {/* Timeline dot — sits on the left border spine */}
                  <span className="absolute -left-[21px] top-3 flex items-center justify-center size-4 rounded-full bg-gray-950 border border-white/[0.08]">
                    {actionIcon(entry.action)}
                  </span>

                  {/* Content */}
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {entry.details}
                      </p>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        by {entry.actorName}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-600 shrink-0 pt-0.5">
                      {entry.timestamp ? formatRelativeTime(entry.timestamp) : '…'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
