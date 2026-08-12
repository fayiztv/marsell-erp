import type { Timestamp } from 'firebase/firestore';

export type DepartmentStatus = 'active' | 'archived';

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: DepartmentStatus;
  employeeCount: number;
  ticketCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface DepartmentFilters {
  status: DepartmentStatus | null;
  search: string;
}
