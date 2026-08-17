import { Calendar, Building2, Lock } from 'lucide-react';
import { Card, StatusBadge, PriorityBadge, Avatar, DropdownMenu, Badge } from '@/components/ui';
import type { Ticket } from '../types/ticket.types';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
  onDelete?: (ticket: Ticket) => void;
}

export function TicketCard({ ticket, onClick, onDelete }: TicketCardProps) {
  // Format dates. If dueDate is a Timestamp, we convert it to Date, else assume Date/null.
  // Actually due date is stored as a Timestamp or null in firestore, so we'll just parse it safely.
  const dueDate = ticket.dueDate ? ticket.dueDate.toDate().toLocaleDateString() : 'No due date';
  const isPendingDeletion = ticket.isPendingDeletion;

  const menuItems = (onDelete && !isPendingDeletion) ? [
    { label: 'Delete Ticket', onClick: () => onDelete(ticket), variant: 'danger' as const },
  ] : [];

  return (
    <Card 
      padding="md" 
      hoverable={!!onClick && !isPendingDeletion}
      onClick={() => onClick && !isPendingDeletion && onClick(ticket)}
      className={`group flex flex-col h-full gap-4 ${isPendingDeletion ? 'opacity-75 relative overflow-hidden cursor-not-allowed' : ''}`}
    >
      {isPendingDeletion && (
        <div className="absolute inset-0 bg-red-950/10 pointer-events-none z-0 border border-red-500/20 rounded-xl" />
      )}
      
      <div className="flex justify-between items-start gap-4 relative z-10">
        <div className="space-y-1 pr-6 flex-1">
          <h3 className="text-sm font-medium text-gray-100 line-clamp-1">{ticket.title}</h3>
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {ticket.description}
          </p>
        </div>
        {menuItems.length > 0 && (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu
              items={menuItems}
              className="opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100"
            />
          </div>
        )}
        {isPendingDeletion && (
          <Badge variant="danger" className="shrink-0 flex items-center gap-1 opacity-80 mt-0.5">
            <Lock size={12} />
            <span className="text-[10px] uppercase font-bold tracking-wider">Locked</span>
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 mt-auto">
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
      </div>

      <div className="flex flex-col gap-2 pt-4 border-t border-white/[0.04] text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <Building2 size={12} className="text-gray-500 shrink-0" />
            <span className="truncate">{ticket.clientName || 'Internal / No Client'}</span>
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
