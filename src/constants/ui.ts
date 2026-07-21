/**
 * UI configuration constants.
 * Centralised so product decisions (page size, timings) are changed in one place.
 */

/** Number of items shown per page on all list views */
export const PAGE_SIZE = 10;

/** Toast auto-dismiss durations in milliseconds */
export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000,
} as const;

/** Debounce delay for search inputs in milliseconds */
export const SEARCH_DEBOUNCE_MS = 300;

/** TanStack Query stale time for list views (30 seconds) */
export const LIST_STALE_TIME_MS = 30 * 1000;

/** TanStack Query stale time for detail views (10 seconds) */
export const DETAIL_STALE_TIME_MS = 10 * 1000;

/** Sidebar width in pixels (expanded) */
export const SIDEBAR_WIDTH = 256;

/** Sidebar width in pixels (collapsed) */
export const SIDEBAR_COLLAPSED_WIDTH = 68;

/** Priority display labels */
export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

/** Ticket status display labels */
export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
};
