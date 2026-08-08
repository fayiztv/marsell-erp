import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  isLoading?: boolean | undefined;
  leftIcon?: React.ReactNode | undefined;
  rightIcon?: React.ReactNode | undefined;
}

// ─── Style maps ──────────────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-blue-600 text-white border border-blue-500/50',
    'hover:bg-blue-500 hover:border-blue-400/60',
    'shadow-[0_0_0_0_rgba(59,130,246,0)] hover:shadow-[0_0_16px_rgba(59,130,246,0.25)]',
    'active:bg-blue-700',
    'disabled:bg-blue-900 disabled:text-blue-400 disabled:border-blue-800',
  ].join(' '),

  secondary: [
    'bg-white/[0.05] text-gray-200 border border-white/[0.08]',
    'hover:bg-white/[0.09] hover:border-white/[0.14] hover:text-white',
    'active:bg-white/[0.04]',
    'disabled:opacity-40',
  ].join(' '),

  ghost: [
    'bg-transparent text-gray-300 border border-transparent',
    'hover:bg-white/[0.06] hover:text-white',
    'active:bg-white/[0.04]',
    'disabled:opacity-40',
  ].join(' '),

  danger: [
    'bg-red-600/20 text-red-400 border border-red-500/30',
    'hover:bg-red-600/30 hover:border-red-500/50 hover:text-red-300',
    'active:bg-red-700/20',
    'disabled:opacity-40',
  ].join(' '),

  outline: [
    'bg-transparent text-gray-200 border border-white/[0.14]',
    'hover:bg-white/[0.05] hover:border-white/[0.22] hover:text-white',
    'active:bg-white/[0.03]',
    'disabled:opacity-40',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
};

// ─── Component ───────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled ?? isLoading;

    return (
      <motion.button
        ref={ref}
        {...(isDisabled ? {} : { whileTap: { scale: 0.97 } })}
        transition={{ duration: 0.1 }}
        disabled={isDisabled}
        className={cn(
          // Base
          'relative inline-flex items-center justify-center font-medium',
          'select-none whitespace-nowrap',
          'transition-all duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
          'disabled:cursor-not-allowed',
          // Variant + Size
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...(props as unknown as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {/* Loading spinner overlay */}
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 16} />
          </span>
        )}

        {/* Content (invisible when loading to preserve width) */}
        <span
          className={cn(
            'inline-flex items-center gap-inherit',
            isLoading && 'invisible',
          )}
          style={{ gap: 'inherit' }}
        >
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </span>
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
