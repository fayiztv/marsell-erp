import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  /** Adds hover border/shadow lift effect */
  hoverable?: boolean;
  /** Adds a blue glow on hover (for stat cards, featured items) */
  glowOnHover?: boolean;
  /** Renders as a motion.div for layout animations */
  animated?: boolean;
}

// ─── Style maps ──────────────────────────────────────────────────────────────

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Card({
  padding = 'md',
  hoverable = false,
  glowOnHover = false,
  animated = false,
  children,
  className,
  ...props
}: CardProps) {
  const baseClasses = cn(
    // Base card styles
    'rounded-xl bg-gray-900/80 border border-white/[0.06]',
    'shadow-[0_1px_3px_rgba(0,0,0,0.4)]',
    'transition-all duration-200 ease-out',
    // Padding
    paddingStyles[padding],
    // Hover effects
    hoverable && [
      'cursor-pointer',
      'hover:border-white/[0.11] hover:bg-gray-900',
      'hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]',
    ],
    glowOnHover && 'hover:shadow-[0_4px_20px_rgba(0,0,0,0.5),0_0_24px_rgba(59,130,246,0.07)]',
    className,
  );

  if (animated) {
    return (
      <motion.div
        layout
        className={baseClasses}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.div>)}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses} {...props}>
      {children}
    </div>
  );
}
