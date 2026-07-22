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
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
