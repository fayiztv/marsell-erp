import { forwardRef, useId } from 'react';
import { cn } from '@/utils/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string | undefined;
  error?: string | undefined;
  helperText?: string | undefined;
  /** Show a character count when maxLength is provided */
  showCharCount?: boolean;
  wrapperClassName?: string | undefined;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      showCharCount = false,
      id: providedId,
      className,
      wrapperClassName,
      disabled,
      maxLength,
      value,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const hasError = Boolean(error);
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {/* Label row */}
        {(label ?? (showCharCount && maxLength)) && (
          <div className="flex items-center justify-between">
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
            {showCharCount && maxLength && (
              <span
                className={cn(
                  'text-xs tabular-nums',
                  charCount > maxLength * 0.9 ? 'text-amber-400' : 'text-gray-600',
                )}
              >
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          id={id}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
          className={cn(
            'w-full rounded-lg bg-white/[0.04] text-sm text-gray-100',
            'border border-white/[0.08]',
            'px-3 py-2.5 min-h-[96px]',
            'placeholder:text-gray-600',
            'resize-y',
            'transition-all duration-150 ease-out',
            'focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06]',
            'focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:resize-none',
            hasError &&
              'border-red-500/50 focus:border-red-500/70 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]',
            className,
          )}
          {...props}
        />

        {hasError && (
          <p id={`${id}-error`} className="text-xs text-red-400">
            {error}
          </p>
        )}
        {!hasError && helperText && (
          <p id={`${id}-helper`} className="text-xs text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
