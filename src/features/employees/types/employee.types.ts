import type { Timestamp } from 'firebase/firestore';
import type { UserRole, UserStatus } from '@/types';

export interface Employee {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
