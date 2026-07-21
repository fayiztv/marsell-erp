import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

/**
 * Converts a Firestore Timestamp to a JavaScript Date.
 * Safe to call with null/undefined — returns null.
 */
export function toDate(timestamp: Timestamp | null | undefined): Date | null {
  if (!timestamp) return null;
  return timestamp.toDate();
}

/**
 * Formats a Firestore Timestamp for display.
 * Example: "21 Jul 2026"
 */
export function formatDate(timestamp: Timestamp | null | undefined): string {
  const date = toDate(timestamp);
  if (!date) return '—';
  return format(date, 'd MMM yyyy');
}

/**
 * Formats a Firestore Timestamp as relative time.
 * Example: "3 hours ago", "2 days ago"
 */
export function formatRelativeTime(timestamp: Timestamp | null | undefined): string {
  const date = toDate(timestamp);
  if (!date) return '—';

  if (isToday(date)) return formatDistanceToNow(date, { addSuffix: true });
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'd MMM yyyy');
}

/**
 * Formats a Firestore Timestamp for date input (yyyy-MM-dd).
 */
export function formatDateInput(timestamp: Timestamp | null | undefined): string {
  const date = toDate(timestamp);
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
}
