import { Badge } from '@/components/ui/Badge';
import type { TicketStatus } from '@/types';
import type { BadgeVariant } from '@/components/ui/Badge';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const statusConfig: Record<TicketStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pending', variant: 'muted' },
  in_progress: { label: 'In Progress', variant: 'info' },
  on_hold: { label: 'On Hold', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, variant } = statusConfig[status];
  return (
    <Badge variant={variant} dot className={className}>
      {label}
    </Badge>
  );
}
