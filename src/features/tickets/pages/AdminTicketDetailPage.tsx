import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Calendar, Building2, User, Layers } from 'lucide-react';
import {
  Button,
  PriorityBadge,
  Dialog,
  LoadingSkeleton,
  StatusBadge,
} from '@/components/ui';
import { useTicketSubscription } from '../hooks/useTickets';
import { TicketForm } from '../components/TicketForm';
import { DirectDeleteDialog } from '@/features/approvals/components/DirectDeleteDialog';
import { useApprovals } from '@/features/approvals/hooks/useApprovals';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import { ROUTES } from '@/constants';

export function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ticket, isLoading } = useTicketSubscription(id);

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
      <div className="space-y-6 max-w-4xl mx-auto pb-10">
        <LoadingSkeleton className="h-8 w-32 rounded-lg" />
        <LoadingSkeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-100">Ticket not found</h2>
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
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Back link */}
      <button
        onClick={() => navigate(ROUTES.ADMIN.TICKETS)}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Tickets
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-gray-500">#{ticket.id}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {deptLabel}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-100">{ticket.title}</h1>
          <p className="text-sm text-gray-400 mt-1">
            Created by <span className="text-gray-200">{ticket.assignedByName}</span> • Assigned to{' '}
            <span className="text-gray-200">{ticket.assignedToName}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main: Description */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-xl border border-white/[0.06] bg-gray-900/50">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
              Description
            </h3>
            <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>
          </div>
        </div>

        {/* Sidebar: Details */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-white/[0.06] bg-gray-900/50 space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">
                Status
              </p>
              <StatusBadge status={ticket.status} />
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">
                Priority
              </p>
              <PriorityBadge priority={ticket.priority} />
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">
                Department
              </p>
              <div className="flex items-center gap-1.5 text-sm text-gray-200">
                <Layers size={14} className="text-blue-400" />
                <span>{deptLabel}</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">
                Client
              </p>
              <div className="flex items-center gap-1.5 text-sm text-gray-200">
                <Building2 size={14} className="text-gray-400" />
                <span>{ticket.clientName}</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">
                Assigned Employee
              </p>
              <div className="flex items-center gap-1.5 text-sm text-gray-200">
                <User size={14} className="text-gray-400" />
                <span>{ticket.assignedToName}</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">
                Due Date
              </p>
              <div className="flex items-center gap-1.5 text-sm text-gray-200">
                <Calendar size={14} className="text-gray-400" />
                <span>
                  {ticket.dueDate ? ticket.dueDate.toDate().toLocaleDateString() : 'No due date'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
            clientId: ticket.clientId,
            assignedToId: ticket.assignedToId,
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
    </div>
  );
}
