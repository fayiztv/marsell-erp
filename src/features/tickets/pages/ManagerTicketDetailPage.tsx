import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Trash2 } from 'lucide-react';
import { Button, Dialog, LoadingSkeleton, Select } from '@/components/ui';
import { useTicketSubscription, useDeleteTicket, useUpdateTicketStatus } from '../hooks/useTickets';
import { TicketForm } from '../components/TicketForm';
import { useUIStore } from '@/app/stores/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES, STATUS_LABELS } from '@/constants';
import { TicketDetailLayout } from '../components/TicketDetailLayout';
import type { TicketStatus } from '@/types';

export function ManagerTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ticket, isLoading, error } = useTicketSubscription(id);
  
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
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        <LoadingSkeleton className="h-8 w-48 rounded-lg" />
        <LoadingSkeleton className="h-64 rounded-xl" />
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
        <Button variant="ghost" onClick={() => navigate(ROUTES.MANAGER.TICKETS)} className="mt-4">
          Return to Tickets
        </Button>
      </div>
    );
  }

  const isSelfAssigned =
    (ticket.assignedToIds && ticket.assignedToIds.includes(firebaseUser?.uid || '')) ||
    ticket.assignedToId === firebaseUser?.uid;

  const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <>
      <TicketDetailLayout
        ticket={ticket}
        clientDetailUrl={ticket.clientId ? ROUTES.MANAGER.CLIENT_DETAIL(ticket.clientId) : undefined}
        historyUrl={ROUTES.MANAGER.TICKET_HISTORY(ticket.id)}
        backUrl={ROUTES.MANAGER.TICKETS}
        canComment={true}
        statusControl={
          isSelfAssigned ? (
            <Select
              value={ticket.status}
              onChange={(value) => handleStatusChange(value as TicketStatus)}
              options={statusOptions}
              disabled={updateStatusMutation.isPending}
            />
          ) : undefined
        }
        headerActions={
          <>
            {ticket.status !== 'completed' && !(ticket.createdByRole === 'admin' && isSelfAssigned) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openDialog('edit-ticket')}
              >
                <Edit2 className="size-4 mr-1.5" />
                Edit
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={() => openDialog('confirm-delete')}
            >
              <Trash2 className="size-4 mr-1.5" />
              Delete Ticket
            </Button>
          </>
        }
      />

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
            departmentIds: ticket.departmentIds && ticket.departmentIds.length > 0
              ? ticket.departmentIds
              : (ticket.departmentId ? [ticket.departmentId] : []),
            assignedToIds: ticket.assignedToIds && ticket.assignedToIds.length > 0
              ? ticket.assignedToIds
              : (ticket.assignedToId ? [ticket.assignedToId] : []),
            clientIds: ticket.clientIds && ticket.clientIds.length > 0
              ? ticket.clientIds
              : (ticket.clientId ? [ticket.clientId] : []),
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
    </>
  );
}
