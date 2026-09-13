import type { DateRangePeriod, DateRangeValue } from './types';

export const PERIOD_OPTIONS: { value: DateRangePeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
  { value: 'all_time', label: 'All Time' },
];

export function computeDateRange(
  period: DateRangePeriod,
  customRange?: { from: string; to: string }
): DateRangeValue | null {
  const now = new Date();

  if (period === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      start,
      end,
    };
  }

  if (period === 'this_week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      start,
      end,
    };
  }

  if (period === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      start,
      end,
    };
  }

  if (period === 'custom' && customRange?.from && customRange?.to) {
    const start = new Date(customRange.from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customRange.to);
    end.setHours(23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      start,
      end,
    };
  }

  return null;
}
