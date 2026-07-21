import { Badge } from '@/components/ui/Badge';
import type { Priority } from '@/types';
import type { BadgeVariant } from '@/components/ui/Badge';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const priorityConfig: Record<Priority, { label: string; variant: BadgeVariant }> = {
  low: { label: 'Low', variant: 'muted' },
  medium: { label: 'Medium', variant: 'info' },
  high: { label: 'High', variant: 'warning' },
  urgent: { label: 'Urgent', variant: 'danger' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const { label, variant } = priorityConfig[priority];
  return (
    <Badge variant={variant} dot className={className}>
      {label}
    </Badge>
  );
}
