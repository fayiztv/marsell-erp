import type { Timestamp } from 'firebase/firestore';
import type { UserRole, UserStatus } from '@/types';

export interface Employee {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  
  // Department scoping (null only for admin)
  homeDepartmentId: string | null;
  homeDepartmentName?: string;
  temporaryDepartmentIds: string[];

  // Deletion approval lock
  isPendingDeletion?: boolean;
  deletionRequestId?: string | null;

  createdBy?: string;
  avatarUrl?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type User = Employee;
