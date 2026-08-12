import { forwardRef, useId } from "react";
import { cn } from "@/utils/cn";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string | undefined;
  error?: string | undefined;
  helperText?: string | undefined;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Wrapper className for the outer container */
  wrapperClassName?: string | undefined;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
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
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "text-sm font-medium",
              hasError ? "text-red-400" : "text-gray-300",
              disabled && "opacity-50",
            )}
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative flex items-center">
          {/* Left icon */}
          {leftIcon && (
            <span className="absolute left-3 flex items-center text-gray-500 pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined
            }
            className={cn(
              // Base
              "w-full rounded-lg bg-white/[0.04] text-sm text-gray-100",
              "border border-white/[0.08]",
              "px-3 py-2.5 h-10",
              "placeholder:text-gray-600",
              "transition-all duration-150 ease-out",
              // Focus
              "focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06]",
              // 'focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
              // Disabled
              "disabled:opacity-40 disabled:cursor-not-allowed",
              // Error
              hasError &&
                "border-red-500/50 focus:border-red-500/70 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]",
              // Icon padding
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              className,
            )}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <span className="absolute right-3 flex items-center text-gray-500">
              {rightIcon}
            </span>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <p
            id={`${id}-error`}
            className="text-xs text-red-400 flex items-center gap-1"
          >
            {error}
          </p>
        )}

        {/* Helper text */}
        {!hasError && helperText && (
          <p id={`${id}-helper`} className="text-xs text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
