import { useState, useEffect, useRef } from 'react';
import { Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../Button';
import { Input } from '../Input';
import clsx from 'clsx';
import { dropdownVariants } from '@/utils/animations';
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

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);
  const [tempCustomRange, setTempCustomRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [customRangeError, setCustomRangeError] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (startDate === null && endDate === null && value === undefined) {
      setInternalPeriod('all_time');
      setCustomRange(null);
      setTempCustomRange({ from: '', to: '' });
      setCustomRangeError('');
      setIsPopoverOpen(false);
    }
  }, [startDate, endDate, value]);

  // Close on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPopoverOpen(false);
      }
    }
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isPopoverOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsPopoverOpen(false);
      }
    }
    if (isPopoverOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPopoverOpen]);

  const handlePeriodChange = (newPeriod: DateRangePeriod) => {
    if (newPeriod === 'custom') {
      if (customRange) {
        setTempCustomRange(customRange);
      }
      setCustomRangeError('');
      setIsPopoverOpen((prev) => !prev);
      return;
    }

    setIsPopoverOpen(false);
    if (value === undefined) {
      setInternalPeriod(newPeriod);
    }
    const computed = computeDateRange(newPeriod);
    onChange(computed, newPeriod);
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
    if (value === undefined) {
      setInternalPeriod('custom');
    }
    const computed = computeDateRange('custom', tempCustomRange);
    onChange(computed, 'custom');
    setIsPopoverOpen(false);
  };

  const formatDateLabel = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={clsx('relative inline-flex flex-wrap items-center gap-2', className)} ref={containerRef}>
      {label && <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">{label}</span>}
      
      <div className="relative flex flex-wrap items-center gap-1 bg-gray-950/60 p-1 rounded-lg border border-white/[0.06]">
        {PERIOD_OPTIONS.map((p) => {
          const isSelected = activePeriod === p.value;

          return (
            <button
              key={p.value}
              type="button"
              onClick={() => handlePeriodChange(p.value)}
              className={clsx(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                isSelected
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
              )}
            >
              {p.label}
            </button>
          );
        })}

        {/* Custom Range Floating Popover */}
        <AnimatePresence>
          {isPopoverOpen && (
            <motion.div
              variants={dropdownVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={clsx(
                'absolute z-50 top-[calc(100%+6px)] right-0',
                'w-[300px] sm:w-[320px] max-w-[calc(100vw-2rem)]',
                'bg-gray-900/95 backdrop-blur-md border border-white/[0.12] rounded-xl',
                'shadow-[0_20px_60px_rgba(0,0,0,0.8)]',
                'p-4 flex flex-col gap-3.5 origin-top'
              )}
            >
              <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-gray-200 font-semibold text-xs">
                  <Calendar size={13} className="text-blue-400" />
                  <span>Custom Date Range</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPopoverOpen(false)}
                  className="text-gray-500 hover:text-gray-300 transition-colors p-0.5"
                  aria-label="Close custom date range popover"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <Input
                  type="date"
                  label="From Date"
                  value={tempCustomRange.from}
                  onChange={(e) => setTempCustomRange((prev) => ({ ...prev, from: e.target.value }))}
                  className="w-full text-xs"
                />
                <Input
                  type="date"
                  label="To Date"
                  value={tempCustomRange.to}
                  onChange={(e) => setTempCustomRange((prev) => ({ ...prev, to: e.target.value }))}
                  className="w-full text-xs"
                />
              </div>

              {customRangeError && (
                <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded">
                  {customRangeError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/[0.04]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPopoverOpen(false)}
                  className="text-xs h-8 px-2.5"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleApplyCustom}
                  className="text-xs h-8 px-3"
                >
                  Apply
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Applied Custom Range Display Badge */}
      {activePeriod === 'custom' && customRange?.from && customRange?.to && (
        <button
          type="button"
          onClick={() => {
            setTempCustomRange(customRange);
            setIsPopoverOpen(true);
          }}
          className="text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Click to edit custom date range"
        >
          <Calendar size={12} className="text-blue-400 shrink-0" />
          <span>
            {formatDateLabel(customRange.from)} – {formatDateLabel(customRange.to)}
          </span>
        </button>
      )}
    </div>
  );
}
