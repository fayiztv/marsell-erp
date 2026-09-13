import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import clsx from 'clsx';
import type { DateRangePeriod, DateRangeFilterProps } from './types';
import { PERIOD_OPTIONS, computeDateRange } from './dateRangeUtils';

export function DateRangeFilter({
  value,
  startDate,
  endDate,
  defaultValue = 'all_time',
  onChange,
  className,
  label,
}: DateRangeFilterProps) {
  const [internalPeriod, setInternalPeriod] = useState<DateRangePeriod>(defaultValue);
  const activePeriod = value ?? internalPeriod;

  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);
  const [tempCustomRange, setTempCustomRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [customRangeError, setCustomRangeError] = useState('');

  useEffect(() => {
    if (startDate === null && endDate === null && value === undefined) {
      setInternalPeriod('all_time');
      setCustomRange(null);
      setTempCustomRange({ from: '', to: '' });
      setCustomRangeError('');
    }
  }, [startDate, endDate, value]);

  const handlePeriodChange = (newPeriod: DateRangePeriod) => {
    if (value === undefined) {
      setInternalPeriod(newPeriod);
    }
    if (newPeriod !== 'custom') {
      const computed = computeDateRange(newPeriod);
      onChange(computed, newPeriod);
    } else if (customRange?.from && customRange?.to) {
      const computed = computeDateRange('custom', customRange);
      onChange(computed, 'custom');
    }
  };

  const handleApplyCustom = () => {
    if (!tempCustomRange.from || !tempCustomRange.to) {
      setCustomRangeError('Both dates are required.');
      return;
    }
    if (new Date(tempCustomRange.to) < new Date(tempCustomRange.from)) {
      setCustomRangeError('"To" date cannot be before "From" date.');
      return;
    }
    setCustomRangeError('');
    setCustomRange(tempCustomRange);
    const computed = computeDateRange('custom', tempCustomRange);
    onChange(computed, 'custom');
  };

  return (
    <div className={clsx('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {label && <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">{label}</span>}
        <div className="flex flex-wrap items-center gap-1 bg-gray-950/60 p-1 rounded-lg border border-white/[0.06]">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => handlePeriodChange(p.value)}
              className={clsx(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                activePeriod === p.value
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {activePeriod === 'custom' && (
        <div className="pt-2 flex flex-wrap items-end gap-3 bg-gray-950/40 p-3 rounded-lg border border-white/[0.04]">
          <Input
            type="date"
            label="From Date"
            value={tempCustomRange.from}
            onChange={(e) => setTempCustomRange((prev) => ({ ...prev, from: e.target.value }))}
            className="w-40"
          />
          <Input
            type="date"
            label="To Date"
            value={tempCustomRange.to}
            onChange={(e) => setTempCustomRange((prev) => ({ ...prev, to: e.target.value }))}
            className="w-40"
          />
          <Button onClick={handleApplyCustom} variant="primary" size="sm" className="h-[38px]">
            Apply
          </Button>
          {customRangeError && <span className="text-xs text-red-400 self-center">{customRangeError}</span>}
          {customRange?.from && customRange?.to && !customRangeError && (
            <div className="text-xs text-gray-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 self-center">
              <Calendar size={12} className="text-blue-400" />
              <span>
                {new Date(customRange.from).toLocaleDateString()} – {new Date(customRange.to).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
