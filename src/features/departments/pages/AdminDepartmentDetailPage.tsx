import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Ticket as TicketIcon,
  Edit2,
  Archive,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { useDepartmentDetail } from '../hooks/useDepartmentDetail';
import { useDepartments } from '../hooks/useDepartments';
import { DepartmentFormDialog } from '../components/DepartmentFormDialog';
import {
  Button,
  Badge,
  Card,
  Avatar,
  StatusBadge,
  PriorityBadge,
  LoadingSkeleton,
  ConfirmationDialog,
} from '@/components/ui';
import type { DepartmentStatus } from '../types/department.types';
import type { DepartmentFormData } from '../validation/departmentSchema';
import { ROUTES } from '@/constants';

export function AdminDepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    department,
    isLoadingDepartment,
    departmentError,
    members,
    isLoadingMembers,
    tickets,
    isLoadingTickets,
  } = useDepartmentDetail(id);

  const { updateDepartment, isUpdating, toggleStatus } = useDepartments();

  const [activeTab, setActiveTab] = useState<'members' | 'tickets'>('members');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

  if (isLoadingDepartment) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <LoadingSkeleton className="h-10 w-48 rounded-lg" />
        <LoadingSkeleton className="h-44 rounded-xl" />
        <LoadingSkeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (departmentError || !department) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center">
        <div className="size-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-lg font-semibold text-gray-100">Department Not Found</h2>
        <p className="text-sm text-gray-400 mt-1 mb-6">
          The requested department does not exist or has been removed.
        </p>
        <Button onClick={() => navigate(ROUTES.ADMIN.DEPARTMENTS)}>
          <ArrowLeft className="size-4 mr-2" />
          Back to Departments
        </Button>
      </div>
    );
  }

  const isArchived = department.status === 'archived';
  const homeMembers = members?.homeMembers || [];
  const tempMembers = members?.tempMembers || [];
  const totalMembers = homeMembers.length + tempMembers.length;

  const handleUpdate = async (formData: DepartmentFormData) => {
    if (!id) return;
    await updateDepartment({ id, data: formData });
  };

  const handleToggleStatus = async () => {
    if (!id) return;
    const nextStatus: DepartmentStatus = isArchived ? 'active' : 'archived';
    await toggleStatus({ id, status: nextStatus });
    setIsArchiveDialogOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Back button */}
      <button
        onClick={() => navigate(ROUTES.ADMIN.DEPARTMENTS)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Departments
      </button>

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gray-900/70 border border-white/[0.08] backdrop-blur-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {department.code}
              </span>
              <Badge variant={isArchived ? 'muted' : 'success'}>
                {isArchived ? 'Archived' : 'Active'}
              </Badge>
              {department.id === 'dept_general' && (
                <span className="text-[10px] uppercase font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Default Department
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-100">{department.name}</h1>
            <p className="text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">
              {department.description || 'No description provided for this department.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
            >
              <Edit2 className="size-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              variant={isArchived ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setIsArchiveDialogOpen(true)}
            >
              {isArchived ? (
                <>
                  <RotateCcw className="size-3.5 mr-1.5 text-blue-400" />
                  Reactivate
                </>
              ) : (
                <>
                  <Archive className="size-3.5 mr-1.5 text-amber-400" />
                  Archive
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/[0.06]">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Members</span>
            <p className="text-xl font-bold text-gray-100 mt-1">{totalMembers}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Home Department</span>
            <p className="text-xl font-bold text-blue-400 mt-1">{homeMembers.length}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Temporary Access</span>
            <p className="text-xl font-bold text-purple-400 mt-1">{tempMembers.length}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Department Tickets</span>
            <p className="text-xl font-bold text-amber-400 mt-1">{tickets.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'members'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Users size={16} />
          Department Members ({totalMembers})
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'tickets'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <TicketIcon size={16} />
          Department Tickets ({tickets.length})
        </button>
      </div>

      {/* Tab: Members */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {isLoadingMembers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : totalMembers === 0 ? (
            <div className="p-8 text-center bg-gray-900/40 border border-white/[0.06] rounded-xl">
              <p className="text-sm text-gray-400">No members are currently assigned to this department.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home Members */}
              {homeMembers.map((user) => (
                <Card
                  key={user.uid}
                  className="p-4 bg-gray-900/50 border-white/[0.06] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={user.name} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-200 truncate">{user.name}</p>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant="info">Home Dept</Badge>
                </Card>
              ))}

              {/* Temp Access Members */}
              {tempMembers.map((user) => (
                <Card
                  key={user.uid}
                  className="p-4 bg-gray-900/50 border-purple-500/20 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={user.name} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-200 truncate">{user.name}</p>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant="warning">Temp Access</Badge>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Tickets */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {isLoadingTickets ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center bg-gray-900/40 border border-white/[0.06] rounded-xl">
              <p className="text-sm text-gray-400">No tickets found in this department.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <Card
                  key={t.id}
                  onClick={() => navigate(ROUTES.ADMIN.TICKET_DETAIL(t.id))}
                  className="p-4 bg-gray-900/50 hover:bg-gray-900/80 border-white/[0.06] hover:border-blue-500/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-500">#{t.id.slice(0, 6)}</span>
                      <h4 className="text-sm font-semibold text-gray-100 hover:text-blue-300">
                        {t.title}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-400">
                      Client: <span className="text-gray-200">{t.clientName}</span> • Assigned to:{' '}
                      <span className="text-gray-200">{t.assignedToName}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <DepartmentFormDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        isLoading={isUpdating}
        initialData={department}
      />

      {/* Archive / Reactivate Dialog */}
      <ConfirmationDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => setIsArchiveDialogOpen(false)}
        onConfirm={handleToggleStatus}
        title={isArchived ? 'Reactivate Department?' : 'Archive Department?'}
        description={
          isArchived
            ? `Reactivating "${department.name}" will make it available again for tickets and users.`
            : `Archiving "${department.name}" will prevent new tickets or users from being assigned to it.`
        }
        confirmLabel={isArchived ? 'Reactivate' : 'Archive'}
        variant={isArchived ? 'warning' : 'danger'}
      />
    </div>
  );
}
