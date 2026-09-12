import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  ArrowRight,
} from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui';
import { useTicketHistory } from '../hooks/useTicketHistory';
import { getHistoryActionIcon } from '../utils/historyIcons';
import { formatSmartDateTime } from '@/utils/dateUtils';

interface TicketHistorySectionProps {
  ticketId: string;
  viewAllUrl?: string;
  maxEntries?: number;
}

export function TicketHistorySection({
  ticketId,
  viewAllUrl,
  maxEntries = 5,
}: TicketHistorySectionProps) {
  const { entries, isLoading, error } = useTicketHistory(ticketId, maxEntries);

  return (
    <div className="p-6 rounded-xl border border-white/[0.06] bg-gray-900/50 space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <History size={14} className="text-blue-400" />
          History
          {!isLoading && (
            <span className="font-normal text-gray-500 lowercase">({entries.length})</span>
          )}
        </h3>

        {viewAllUrl && (
          <Link
            to={viewAllUrl}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors"
          >
            View All History
            <ArrowRight size={13} />
          </Link>
        )}
      </div>

      {/* Timeline container */}
      <div>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="py-4 text-center text-xs text-red-400 bg-red-500/5 rounded-lg border border-red-500/10">
            Unable to load history. Please try again.
          </div>
        ) : entries.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500 bg-gray-950/40 rounded-lg border border-white/[0.04]">
            No history recorded yet.
          </div>
        ) : (
          /* Vertical timeline: left border acts as the spine */
          <div className="relative border-l border-white/[0.3] ml-3.5 pl-4 space-y-0.5">
            <AnimatePresence initial={false}>
              {entries.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="relative py-2.5 group"
                >
                  {/* Timeline dot — sits on the left border spine */}
                  <span className="absolute -left-[25px] top-3.5 flex items-center justify-center size-4 rounded-full bg-gray-950 border border-white/[0.08]">
                    {getHistoryActionIcon(entry.action, 13)}
                  </span>

                  {/* Content */}
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-200 leading-relaxed font-normal">
                        {entry.details}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        by <span className="text-gray-400">{entry.actorName}</span>
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-500 shrink-0 pt-0.5 whitespace-nowrap">
                      {entry.timestamp ? formatSmartDateTime(entry.timestamp) : '…'}
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
