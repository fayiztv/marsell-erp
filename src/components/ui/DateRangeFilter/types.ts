export type DateRangePeriod = 'today' | 'this_week' | 'this_month' | 'custom' | 'all_time';

export interface DateRangeValue {
  startDate: string; // ISO string
  endDate: string;   // ISO string
  start: Date;
  end: Date;
}

export interface DateRangeFilterProps {
  value?: DateRangePeriod | undefined;
  startDate?: string | null | undefined;
  endDate?: string | null | undefined;
  defaultValue?: DateRangePeriod | undefined;
  onChange: (range: DateRangeValue | null, period: DateRangePeriod) => void;
  className?: string | undefined;
  label?: string | undefined;
}
