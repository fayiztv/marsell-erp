import { forwardRef, useId } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  wrapperClassName?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      error,
      helperText,
      id: providedId,
      className,
      wrapperClassName,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const hasError = Boolean(error);

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'text-sm font-medium',
              hasError ? 'text-red-400' : 'text-gray-300',
              disabled && 'opacity-50',
            )}
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <Calendar
            size={16}
            className="absolute left-3 text-gray-500 pointer-events-none z-10"
          />
          <input
            ref={ref}
            id={id}
            type="date"
            disabled={disabled}
            aria-invalid={hasError}
            className={cn(
              'w-full h-10 pl-9 pr-3 rounded-lg text-sm',
              'bg-white/[0.04] border border-white/[0.08]',
              'text-gray-100',
              // Style the date picker chrome
              '[color-scheme:dark]',
              'transition-all duration-150 ease-out',
              'focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06]',
              'focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              hasError &&
                'border-red-500/50 focus:border-red-500/70 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]',
              className,
            )}
            {...props}
          />
        </div>

        {hasError && <p className="text-xs text-red-400">{error}</p>}
        {!hasError && helperText && <p className="text-xs text-gray-500">{helperText}</p>}
      </div>
    );
  },
);

DatePicker.displayName = 'DatePicker';
