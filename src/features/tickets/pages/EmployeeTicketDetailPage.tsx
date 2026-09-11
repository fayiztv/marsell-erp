import { useParams, useNavigate } from 'react-router-dom';
import { Button, Select, LoadingSkeleton } from '@/components/ui';
import { useTicketSubscription, useUpdateTicketStatus } from '../hooks/useTickets';
import { ROUTES, STATUS_LABELS } from '@/constants';
import { TicketDetailLayout } from '../components/TicketDetailLayout';
import type { TicketStatus } from '@/types';

export function EmployeeTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ticket, isLoading, error } = useTicketSubscription(id);
  const updateStatusMutation = useUpdateTicketStatus();

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (!ticket) return;
    updateStatusMutation.mutate({ id: ticket.id, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        <LoadingSkeleton className="h-8 w-32 rounded-lg" />
        <LoadingSkeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-100">Ticket not found</h2>
        <p className="text-sm text-gray-400 mt-2">
          This ticket doesn't exist or you don't have access to it.
        </p>
        <Button variant="ghost" onClick={() => navigate(ROUTES.EMPLOYEE.TICKETS)} className="mt-4">
          Return to Tickets
        </Button>
      </div>
    );
  }

  const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <TicketDetailLayout
      ticket={ticket}
      clientDetailUrl={ticket.clientId ? ROUTES.EMPLOYEE.CLIENT_DETAIL(ticket.clientId) : undefined}
      historyUrl={ROUTES.EMPLOYEE.TICKET_HISTORY(ticket.id)}
      backUrl={ROUTES.EMPLOYEE.TICKETS}
      canComment={true}
      statusControl={
        <Select
          value={ticket.status}
          onChange={(value) => handleStatusChange(value as TicketStatus)}
          options={statusOptions}
          disabled={updateStatusMutation.isPending}
        />
      }
    />
  );
}
