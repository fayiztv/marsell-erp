/**
 * Core domain enums and shared primitive types.
 * These are used across all features — never duplicate them inside feature folders.
 */

// ─── User Domain ────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'manager' | 'employee';

export type UserStatus = 'active' | 'blocked';

// ─── Ticket Domain ───────────────────────────────────────────────────────────

export type TicketStatus = 'pending' | 'in_progress' | 'on_hold' | 'completed';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// ─── Client Domain ───────────────────────────────────────────────────────────

export type ClientStatus = 'active' | 'inactive';

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  lastDoc: import('firebase/firestore').DocumentSnapshot | null;
  hasMore: boolean;
}

export interface PaginationState {
  cursors: Array<import('firebase/firestore').DocumentSnapshot | null>;
  currentPage: number;
  hasMore: boolean;
}

// ─── API / Error ─────────────────────────────────────────────────────────────

export type AppErrorCode =
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'ALREADY_EXISTS'
  | 'UNAUTHENTICATED'
  | 'UNKNOWN';

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface TicketFilters {
  status: TicketStatus | null;
  priority: Priority | null;
  clientId: string | null;
  assignedToId: string | null;
  departmentId?: string | null;
  search: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface EmployeeFilters {
  role: UserRole | null;
  status: UserStatus | null;
  departmentId?: string | null;
  search: string;
}

export interface ClientFilters {
  status: ClientStatus | null;
  search: string;
}

// ─── Dialog ──────────────────────────────────────────────────────────────────

export type DialogType =
  | 'create-employee'
  | 'edit-employee'
  | 'create-client'
  | 'edit-client'
  | 'create-ticket'
  | 'edit-ticket'
  | 'confirm-delete'
  | 'view-ticket'
  | null;
