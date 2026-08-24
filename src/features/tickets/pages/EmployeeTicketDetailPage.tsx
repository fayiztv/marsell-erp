import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button, PriorityBadge, Select, LoadingSkeleton } from '@/components/ui';
import { useTicketSubscription, useUpdateTicketStatus } from '../hooks/useTickets';
import { ROUTES, STATUS_LABELS } from '@/constants';
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
      <div className="space-y-6 max-w-4xl mx-auto">
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(ROUTES.EMPLOYEE.TICKETS)}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Tickets
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{ticket.title}</h1>
          <p className="text-sm text-gray-400 mt-1">
            Created by {ticket.assignedByName} • Assigned to you
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-xl border border-white/[0.06] bg-gray-900/50">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Description</h3>
            <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-white/[0.06] bg-gray-900/50 space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
                <Select
                  value={ticket.status}
                  onChange={(value) => handleStatusChange(value as TicketStatus)}
                  options={statusOptions}
                  disabled={updateStatusMutation.isPending}
                />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Priority</p>
              <PriorityBadge priority={ticket.priority} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Client</p>
              <p className="text-sm text-gray-200">{ticket.clientName || 'Internal / No Client'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Due Date</p>
              <p className="text-sm text-gray-200">
                {ticket.dueDate ? ticket.dueDate.toDate().toLocaleDateString() : 'None'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
