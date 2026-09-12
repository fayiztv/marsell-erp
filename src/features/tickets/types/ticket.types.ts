import type { Timestamp } from 'firebase/firestore';
import type { TicketStatus, Priority } from '@/types';

export interface TicketAssignee {
  uid: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  homeDepartmentId?: string;
}

export interface TicketClient {
  id: string;
  name: string;
}

export interface TicketDepartment {
  id: string;
  name: string;
  code?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  
  // Primary Multi-Entity ID Arrays (For Queries & Security Rules)
  assignedToIds?: string[];
  clientIds?: string[];
  departmentIds?: string[];

  // Primary Multi-Entity Object Arrays (For Instant UI Rendering)
  assignees?: TicketAssignee[];
  clients?: TicketClient[];
  departments?: TicketDepartment[];

  // Physically Retained Legacy Fields (Safety Net / Backward Compatibility)
  departmentId?: string;
  departmentName?: string;
  clientId?: string | null;
  clientName?: string | null;
  assignedToId?: string;
  assignedToName?: string;
  assignedById?: string;
  assignedByName?: string;

  status: TicketStatus;
  priority: Priority;
  dueDate: Timestamp | null;

  // Creator metadata
  createdBy?: string;
  createdByRole?: 'admin' | 'manager' | 'employee';

  // Last updater metadata (for history attribution)
  lastUpdatedByUid?: string;
  lastUpdatedByName?: string;

  // Deletion approval lock
  isPendingDeletion?: boolean;
  deletionRequestId?: string | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
