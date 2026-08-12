import { cn } from '@/utils/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BadgeVariant =
  | 'default'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'muted'
  | 'purple';

export interface BadgeProps {
  variant?: BadgeVariant | undefined;
  children: React.ReactNode;
  dot?: boolean | undefined;
  className?: string | undefined;
}

// ─── Style maps ──────────────────────────────────────────────────────────────

const variantStyles: Record<BadgeVariant, { badge: string; dot: string }> = {
  default: {
    badge: 'bg-white/[0.08] text-gray-300 border border-white/[0.10]',
    dot: 'bg-gray-400',
  },
  info: {
    badge: 'bg-blue-500/15 text-blue-300 border border-blue-500/25',
    dot: 'bg-blue-400',
  },
  success: {
    badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
    dot: 'bg-emerald-400',
  },
  warning: {
    badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
    dot: 'bg-amber-400',
  },
  danger: {
    badge: 'bg-red-500/15 text-red-300 border border-red-500/25',
    dot: 'bg-red-400',
  },
  muted: {
    badge: 'bg-gray-800 text-gray-500 border border-white/[0.06]',
    dot: 'bg-gray-600',
  },
  purple: {
    badge: 'bg-violet-500/15 text-violet-300 border border-violet-500/25',
    dot: 'bg-violet-400',
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Badge({ variant = 'default', children, dot = false, className }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'px-2 py-0.5 rounded-full',
        'text-xs font-medium',
        'whitespace-nowrap',
        styles.badge,
        className,
      )}
    >
      {dot && (
        <span className={cn('size-1.5 rounded-full shrink-0', styles.dot)} />
      )}
      {children}
    </span>
  );
}
