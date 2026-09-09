import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/constants';
import type { TicketComment } from '../types/comment.types';

const commentsSubcollection = (ticketId: string) =>
  collection(db, COLLECTIONS.TICKETS, ticketId, 'comments');

export const commentService = {
  /**
   * Add a comment to a ticket.
   */
  async addComment(
    ticketId: string,
    text: string,
    author: { uid: string; name: string; role: 'admin' | 'manager' | 'employee' }
  ): Promise<void> {
    await addDoc(commentsSubcollection(ticketId), {
      text,
      authorUid: author.uid,
      authorName: author.name,
      authorRole: author.role,
      createdAt: serverTimestamp(),
    });
  },

  /**
   * Subscribe to real-time comment updates for a ticket.
   * Returns an unsubscribe function — call it in a useEffect cleanup.
   */
  subscribeToComments(
    ticketId: string,
    onUpdate: (comments: TicketComment[]) => void,
    onError: (err: Error) => void
  ): Unsubscribe {
    const q = query(commentsSubcollection(ticketId), orderBy('createdAt', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const comments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TicketComment[];
        onUpdate(comments);
      },
      onError
    );
  },
};
