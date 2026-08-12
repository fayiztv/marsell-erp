import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { fadeUpVariants } from '@/utils/animations';
import { Button } from '@/components/ui/Button';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  icon?: React.ReactNode | undefined;
  title: string;
  description?: string | undefined;
  action?: React.ReactNode | undefined;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
  className?: string | undefined;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="initial"
      animate="animate"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-16 px-6 gap-4',
        className,
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="size-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-gray-600">
          {icon}
        </div>
      )}

      {/* Text */}
      <div className="space-y-1.5 max-w-xs">
        <p className="text-base font-semibold text-gray-300">{title}</p>
        {description && (
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        )}
      </div>

      {/* Action */}
      {action ? (
        <div className="mt-1">{action}</div>
      ) : actionLabel && onAction ? (
        <div className="mt-1">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </motion.div>
  );
}
