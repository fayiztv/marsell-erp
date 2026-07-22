import { Calendar, Building2 } from 'lucide-react';
import { Card, StatusBadge, PriorityBadge, Avatar } from '@/components/ui';
import type { Ticket } from '../types/ticket.types';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  // Format dates. If dueDate is a Timestamp, we convert it to Date, else assume Date/null.
  // Actually due date is stored as a Timestamp or null in firestore, so we'll just parse it safely.
  const dueDate = ticket.dueDate ? ticket.dueDate.toDate().toLocaleDateString() : 'No due date';

  return (
    <Card 
      padding="md" 
      hoverable={!!onClick}
      onClick={() => onClick && onClick(ticket)}
      className="group flex flex-col h-full gap-4"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-gray-100 line-clamp-1">{ticket.title}</h3>
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {ticket.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-auto">
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
      </div>

      <div className="flex flex-col gap-2 pt-4 border-t border-white/[0.04] text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <Building2 size={12} className="text-gray-500 shrink-0" />
            <span className="truncate">{ticket.clientName}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar size={12} className="text-gray-500" />
            <span>{dueDate}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar name={ticket.assignedToName} size="xs" />
          <span className="truncate">{ticket.assignedToName}</span>
        </div>
      </div>
    </Card>
  );
}
