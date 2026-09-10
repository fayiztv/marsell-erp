import type { Timestamp } from 'firebase/firestore';

export interface TicketHistoryEntry {
  id: string;
  /** Machine-readable action type: 'ticket_created' | 'reassigned' | 'field_updated' */
  action: string;
  actorUid: string;
  actorName: string;
  /** Human-readable sentence describing what changed */
  details: string;
  timestamp: Timestamp;
}
