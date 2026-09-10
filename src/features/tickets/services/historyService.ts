import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  type Unsubscribe,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/constants';
import type { TicketHistoryEntry } from '../types/history.types';

export const historyService = {
  /**
   * Subscribe to real-time history updates for a ticket.
   * Ordered newest→oldest (descending) so the latest entries are shown first.
   * Optionally limit to the N most recent entries.
   * Returns an unsubscribe function — call it in useEffect cleanup.
   */
  subscribeToHistory(
    ticketId: string,
    onUpdate: (entries: TicketHistoryEntry[]) => void,
    onError: (err: Error) => void,
    limitCount?: number
  ): Unsubscribe {
    let q = query(
      collection(db, COLLECTIONS.TICKETS, ticketId, 'history'),
      orderBy('timestamp', 'desc')
    );
    if (limitCount && limitCount > 0) {
      q = query(q, limit(limitCount));
    }
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

  /**
   * Fetch paginated history entries for a ticket (for dedicated Full History view).
   */
  async fetchHistoryPaginated(
    ticketId: string,
    pageSize: number,
    cursor: DocumentSnapshot | null
  ) {
    let q = query(
      collection(db, COLLECTIONS.TICKETS, ticketId, 'history'),
      orderBy('timestamp', 'desc'),
      limit(pageSize)
    );
    if (cursor) {
      q = query(q, startAfter(cursor));
    }

    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TicketHistoryEntry[];

    return {
      items,
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
      hasMore: items.length === pageSize,
    };
  },
};
