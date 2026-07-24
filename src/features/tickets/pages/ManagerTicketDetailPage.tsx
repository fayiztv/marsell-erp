import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2 } from 'lucide-react';
import { Button, StatusBadge, PriorityBadge, Dialog, LoadingSkeleton, Select } from '@/components/ui';
import { useTicketSubscription, useDeleteTicket, useUpdateTicketStatus } from '../hooks/useTickets';
import { TicketForm } from '../components/TicketForm';
import { useUIStore } from '@/app/stores/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES, STATUS_LABELS } from '@/constants';
import type { TicketStatus } from '@/types';

export function ManagerTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ticket, isLoading } = useTicketSubscription(id);
  
  const { firebaseUser } = useAuth();
  const activeDialog = useUIStore((s) => s.activeDialog);
  const openDialog = useUIStore((s) => s.openDialog);
  const closeDialog = useUIStore((s) => s.closeDialog);

  const deleteMutation = useDeleteTicket();
  const updateStatusMutation = useUpdateTicketStatus();

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (!ticket) return;
    updateStatusMutation.mutate({ id: ticket.id, status: newStatus });
  };

  const confirmDelete = () => {
    if (ticket) {
      deleteMutation.mutate(ticket.id, {
        onSuccess: () => {
          closeDialog();
          navigate(ROUTES.MANAGER.TICKETS);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <LoadingSkeleton className="h-8 w-32 rounded-lg" />
        <LoadingSkeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-100">Ticket not found</h2>
        <Button variant="ghost" onClick={() => navigate(ROUTES.MANAGER.TICKETS)} className="mt-4">
          Return to Tickets
        </Button>
      </div>
    );
  }

  const isSelfAssigned = ticket.assignedToId === firebaseUser?.uid;

  const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(ROUTES.MANAGER.TICKETS)}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Tickets
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{ticket.title}</h1>
          <p className="text-sm text-gray-400 mt-1">
            Created by {ticket.assignedByName} • Assigned to {ticket.assignedToName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            leftIcon={<Edit2 size={16} />}
            onClick={() => openDialog('edit-ticket')}
          >
            Edit Ticket
          </Button>
          <Button
            variant="danger"
            onClick={() => openDialog('confirm-delete')}
          >
            Delete Ticket
          </Button>
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
              {isSelfAssigned ? (
                <Select
                  value={ticket.status}
                  onChange={(value) => handleStatusChange(value as TicketStatus)}
                  options={statusOptions}
                  disabled={updateStatusMutation.isPending}
                />
              ) : (
                <StatusBadge status={ticket.status} />
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Priority</p>
              <PriorityBadge priority={ticket.priority} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Client</p>
              <p className="text-sm text-gray-200">{ticket.clientName}</p>
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

      <Dialog
        isOpen={activeDialog === 'edit-ticket'}
        onClose={closeDialog}
        title="Edit Ticket"
        description="Modify the ticket details."
      >
        <TicketForm
          editId={ticket.id}
          defaultValues={{
            title: ticket.title,
            description: ticket.description,
            clientId: ticket.clientId,
            assignedToId: ticket.assignedToId,
            priority: ticket.priority,
            dueDate: ticket.dueDate ? ticket.dueDate.toDate().toISOString().split('T')[0] : undefined,
          }}
          onCancel={closeDialog}
        />
      </Dialog>

      <Dialog
        isOpen={activeDialog === 'confirm-delete'}
        onClose={closeDialog}
        title="Delete Ticket"
        description={`Are you sure you want to delete "${ticket.title}"? This action cannot be undone.`}
      >
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={closeDialog}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete} isLoading={deleteMutation.isPending}>
            Delete Ticket
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
