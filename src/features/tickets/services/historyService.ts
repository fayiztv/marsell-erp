import {
  collection,
  query,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/constants';
import type { TicketHistoryEntry } from '../types/history.types';

export const historyService = {
  /**
   * Subscribe to real-time history updates for a ticket.
   * Ordered oldest→newest (ascending) so the timeline reads top-to-bottom.
   * Returns an unsubscribe function — call it in useEffect cleanup.
   */
  subscribeToHistory(
    ticketId: string,
    onUpdate: (entries: TicketHistoryEntry[]) => void,
    onError: (err: Error) => void
  ): Unsubscribe {
    const q = query(
      collection(db, COLLECTIONS.TICKETS, ticketId, 'history'),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const entries = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TicketHistoryEntry[];
        onUpdate(entries);
      },
      onError
    );
  },
};
