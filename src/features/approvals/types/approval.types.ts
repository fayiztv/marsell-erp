import type { Timestamp } from 'firebase/firestore';
import type { UserRole } from '@/types';

export type DeletionEntityType = 'employee' | 'ticket' | 'client';
export type DeletionRequestStatus = 'pending' | 'approved' | 'rejected';

export interface DeletionRequest {
  id: string;
  entityType: DeletionEntityType;
  entityId: string;
  entitySummary: {
    title: string;
    subtitle: string;
    departmentId?: string | null;
  };
  reason?: string;
  status: DeletionRequestStatus;
  requestedByUid: string;
  requestedByName: string;
  requestedByRole: UserRole;
  requestedAt: Timestamp;
  reviewedByUid?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: Timestamp | null;
}

export interface DeletionRequestFilters {
  entityType: DeletionEntityType | null;
  status: DeletionRequestStatus | null;
  search: string;
}
