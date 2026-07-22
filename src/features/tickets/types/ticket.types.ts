import type { Timestamp } from 'firebase/firestore';
import type { TicketStatus, Priority } from '@/types';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  
  // Relations
  clientId: string;
  assignedToId: string;
  assignedById: string;

  // Denormalized fields (updated via Cloud Functions)
  clientName: string;
  assignedToName: string;
  assignedByName: string;

  status: TicketStatus;
  priority: Priority;
  dueDate: Timestamp | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
