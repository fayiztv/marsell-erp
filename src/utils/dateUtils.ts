import { format, formatDistanceToNow, isToday, isYesterday, differenceInCalendarDays } from 'date-fns';
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
 * Formats a Firestore Timestamp with smart relative day + time-of-day:
 * - If TODAY: "Today, 1:00 PM"
 * - If YESTERDAY: "Yesterday, 1:00 PM"
 * - If within last 7 days: "Wed, 1:00 PM"
 * - If older than 7 days: "12 Aug 2026, 1:00 PM"
 */
export function formatSmartDateTime(timestamp: Timestamp | null | undefined): string {
  const date = toDate(timestamp);
  if (!date) return '—';

  const timeStr = format(date, 'h:mm a');
  if (isToday(date)) {
    return `Today, ${timeStr}`;
  }
  if (isYesterday(date)) {
    return `Yesterday, ${timeStr}`;
  }

  const now = new Date();
  const daysDiff = differenceInCalendarDays(now, date);
  if (daysDiff > 0 && daysDiff < 7) {
    return `${format(date, 'EEE')}, ${timeStr}`;
  }

  return `${format(date, 'd MMM yyyy')}, ${timeStr}`;
}

/**
 * Formats a Firestore Timestamp for date input (yyyy-MM-dd).
 */
export function formatDateInput(timestamp: Timestamp | null | undefined): string {
  const date = toDate(timestamp);
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
}
