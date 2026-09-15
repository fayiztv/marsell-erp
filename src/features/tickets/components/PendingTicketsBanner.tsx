import { Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';

export interface PendingTicketsBannerProps {
  count: number;
  role: 'manager' | 'employee';
  onClick: () => void;
  className?: string | undefined;
}

export function PendingTicketsBanner({
  count,
  role,
  onClick,
  className,
}: PendingTicketsBannerProps) {
  if (!count || count <= 0) return null;

  const isManager = role === 'manager';
  const title = isManager
    ? `${count} Pending ${count === 1 ? 'Ticket' : 'Tickets'} in Your Departments`
    : `You have ${count} pending ${count === 1 ? 'ticket' : 'tickets'}`;

  const description = isManager
    ? 'Tickets awaiting initial review or assignment across your accessible departments.'
    : 'Assigned tickets that have not yet been started.';

  const actionText = isManager ? 'View Pending Tickets' : 'Filter Pending';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-sm cursor-pointer transition-all hover:bg-amber-500/[0.14] hover:border-amber-500/40 group ${className ?? ''}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
            <Clock className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-amber-200">
              {title}
            </h3>
            <p className="text-xs text-amber-300/80 mt-0.5">
              {description}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-sm shrink-0 pointer-events-none"
        >
          {actionText}
          <ArrowRight className="size-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
