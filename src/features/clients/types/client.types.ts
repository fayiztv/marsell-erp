import type { Timestamp } from 'firebase/firestore';
import type { ClientStatus } from '@/types';

export interface Client {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  status: ClientStatus;
  
  // Ownership
  createdBy: string;

  // Deletion approval lock
  isPendingDeletion?: boolean;
  deletionRequestId?: string | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
