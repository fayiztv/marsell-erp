import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Trash2 } from 'lucide-react';
import {
  Button,
  Dialog,
  LoadingSkeleton,
} from '@/components/ui';
import { useTicketSubscription } from '../hooks/useTickets';
import { TicketForm } from '../components/TicketForm';
import { DirectDeleteDialog } from '@/features/approvals/components/DirectDeleteDialog';
import { useApprovals } from '@/features/approvals/hooks/useApprovals';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import { ROUTES } from '@/constants';
import { TicketDetailLayout } from '../components/TicketDetailLayout';

export function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ticket, isLoading, error } = useTicketSubscription(id);

  const { data: deptData } = useDepartments({ status: 'active', search: '' });
  const allDepts = deptData?.items || [];

  const { directDelete, isDirectDeleting } = useApprovals();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleConfirmDelete = async () => {
    if (!ticket) return;
    await directDelete({
      entityType: 'ticket',
      entityId: ticket.id,
    });
    setIsDeleteOpen(false);
    navigate(ROUTES.ADMIN.TICKETS);
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
        <Button
          variant="ghost"
          onClick={() => navigate(ROUTES.ADMIN.TICKETS)}
          className="mt-4"
        >
          Return to Tickets
        </Button>
      </div>
    );
  }

  const deptObj = allDepts.find((d) => d.id === ticket.departmentId);
  const deptLabel = deptObj ? `${deptObj.name} (${deptObj.code})` : ticket.departmentId || 'General';

  return (
    <>
      <TicketDetailLayout
        ticket={ticket}
        deptLabel={deptLabel}
        clientDetailUrl={ticket.clientId ? ROUTES.ADMIN.CLIENT_DETAIL(ticket.clientId) : undefined}
        historyUrl={ROUTES.ADMIN.TICKET_HISTORY(ticket.id)}
        backUrl={ROUTES.ADMIN.TICKETS}
        canComment={true}
        headerActions={
          <>
            {ticket.status !== 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
              >
                <Edit2 className="size-4 mr-1.5" />
                Edit
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="size-4 mr-1.5" />
              Delete Ticket
            </Button>
          </>
        }
      />

      {/* Edit Dialog */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Ticket"
        description="Modify ticket details or reassignment."
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
          onCancel={() => setIsEditOpen(false)}
          onSuccess={() => setIsEditOpen(false)}
        />
      </Dialog>

      {/* Direct Delete Dialog */}
      <DirectDeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        entityType="ticket"
        entityName={ticket.title}
        isLoading={isDirectDeleting}
      />
    </>
  );
}
