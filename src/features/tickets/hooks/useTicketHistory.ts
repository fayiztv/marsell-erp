import { useState, useEffect } from 'react';
import { historyService } from '../services/historyService';
import type { TicketHistoryEntry } from '../types/history.types';

/**
 * Live subscription to a ticket's history via onSnapshot.
 * Consistent with project pattern: onSnapshot for bounded single-ticket subcollections.
 */
export function useTicketHistory(ticketId: string | undefined) {
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
      }
    );

    return () => unsubscribe();
  }, [ticketId]);

  return { entries, isLoading, error };
}
