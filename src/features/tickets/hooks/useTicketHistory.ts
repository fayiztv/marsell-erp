import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DocumentSnapshot } from 'firebase/firestore';
import { historyService } from '../services/historyService';
import type { TicketHistoryEntry } from '../types/history.types';

/**
 * Live subscription to a ticket's recent history via onSnapshot.
 * Defaults to 5 most recent entries for inline detail view.
 */
export function useTicketHistory(ticketId: string | undefined, limitCount: number = 5) {
  const [entries, setEntries] = useState<TicketHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ticketId) return;
    setIsLoading(true);
    setError(null);

    const unsubscribe = historyService.subscribeToHistory(
      ticketId,
      (data) => {
        setEntries(data);
        setIsLoading(false);
      },
      (err) => {
        console.error('[useTicketHistory] Error subscribing to ticket history:', err);
        setError(err);
        setIsLoading(false);
      },
      limitCount
    );

    return () => unsubscribe();
  }, [ticketId, limitCount]);

  return { entries, isLoading, error };
}

/**
 * Paginated query for full ticket history view.
 */
export function usePaginatedTicketHistory(
  ticketId: string | undefined,
  pageSize: number = 10,
  cursor: DocumentSnapshot | null
) {
  return useQuery({
    queryKey: ['tickets', ticketId, 'history', 'paginated', pageSize, cursor?.id ?? 'initial'],
    queryFn: async () => {
      if (!ticketId) return { items: [], lastDoc: null, hasMore: false };
      return historyService.fetchHistoryPaginated(ticketId, pageSize, cursor);
    },
    enabled: !!ticketId,
  });
}
