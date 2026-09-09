import type { Timestamp } from 'firebase/firestore';

export interface TicketComment {
  id: string;
  text: string;
  authorUid: string;
  authorName: string;
  authorRole: 'admin' | 'manager' | 'employee';
  createdAt: Timestamp;
}
