import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Ticket as TicketIcon, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  Input,
  Select,
  Dialog,
  LoadingSkeleton,
  EmptyState,
  Pagination,
} from '@/components/ui';
import { useTickets } from '../hooks/useTickets';
import { TicketCard } from '../components/TicketCard';
import { TicketForm } from '../components/TicketForm';
import { DirectDeleteDialog } from '@/features/approvals/components/DirectDeleteDialog';
import { useApprovals } from '@/features/approvals/hooks/useApprovals';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import { useClients } from '@/features/clients/hooks/useClients';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import { usePagination } from '@/hooks/usePagination';
import { ROUTES, PAGE_SIZE } from '@/constants';
import type { Ticket } from '../types/ticket.types';
import type { Priority, TicketStatus } from '@/types';
import { listStaggerVariants, listItemVariants } from '@/utils/animations';

export function AdminTicketListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [clientFilter, setClientFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const { data: deptData } = useDepartments({ status: 'active', search: '' });
  const { data: clientsData } = useClients({ status: 'active', search: '' }, null);
  const { data: employeesData } = useEmployees({ role: null, status: 'active', search: '' }, null, false, true);

  const { currentPage, currentCursor, nextPage, previousPage } = usePagination();

  const { data, isLoading, isError } = useTickets(
    {
      status: (statusFilter || null) as any,
      priority: (priorityFilter || null) as any,
      clientId: clientFilter || null,
      assignedToId: userFilter || null,
      search,
      departmentId: departmentFilter || undefined,
    } as any,
    currentCursor
  );

  const { directDelete, isDirectDeleting } = useApprovals();

  // Dialogs state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    ticket: Ticket | null;
  }>({
    isOpen: false,
    ticket: null,
  });

  const handleCardClick = (ticket: Ticket) => {
    navigate(ROUTES.ADMIN.TICKET_DETAIL(ticket.id));
  };

  const handleOpenDelete = (ticket: Ticket) => {
    setDeleteDialog({ isOpen: true, ticket });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.ticket) return;
    await directDelete({
      entityType: 'ticket',
      entityId: deleteDialog.ticket.id,
    });
    setDeleteDialog({ isOpen: false, ticket: null });
  };

  const departments = deptData?.items || [];
  const clients = clientsData?.items || [];
  const employees = employeesData?.items || [];
  const tickets = data?.items || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Support Tickets</h1>
          <p className="text-sm text-gray-400 mt-1">
            System-wide ticket tracker across all corporate departments and clients.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-xl bg-gray-900/40 border border-white/[0.06] space-y-3">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets by title, description, client, or assignee..."
            className="pl-9 bg-gray-950/60 border-white/[0.08]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Department Filter */}
          <Select
            value={departmentFilter}
            onChange={(val) => setDepartmentFilter(val)}
            options={[
              { value: '', label: 'All Departments' },
              ...departments.map((d) => ({
                value: d.id,
                label: `${d.name} (${d.code})`,
              })),
            ]}
          />

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as any)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'on_hold', label: 'On Hold' },
              { value: 'completed', label: 'Completed' },
            ]}
          />

          {/* Priority Filter */}
          <Select
            value={priorityFilter}
            onChange={(val) => setPriorityFilter(val as any)}
            options={[
              { value: '', label: 'All Priorities' },
              { value: 'low', label: 'Low Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'high', label: 'High Priority' },
            ]}
          />

          {/* Client Filter */}
          <Select
            value={clientFilter}
            onChange={(val) => setClientFilter(val)}
            options={[
              { value: '', label: 'All Clients' },
              ...clients.map((c) => ({
                value: c.id,
                label: c.companyName,
              })),
            ]}
          />

          {/* User Filter */}
          <Select
            value={userFilter}
            onChange={(val) => setUserFilter(val)}
            options={[
              { value: '', label: 'All Users' },
              ...employees.map((e) => ({
                value: e.uid,
                label: e.name,
              })),
            ]}
          />
        </div>
      </div>

      {/* Content */}
      {isError ? (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
          Failed to load tickets. Please refresh the page.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={<TicketIcon size={24} />}
          title="No tickets found"
          description={
            search || departmentFilter || statusFilter || priorityFilter || clientFilter
              ? 'No tickets match your filter criteria.'
              : 'Create your first ticket to begin tracking tasks.'
          }
          action={
            search || departmentFilter ? undefined : (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="size-4 mr-2" />
                Create Ticket
              </Button>
            )
          }
        />
      ) : (
        <motion.div
          variants={listStaggerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {tickets.map((ticket) => (
              <motion.div key={ticket.id} layout variants={listItemVariants}>
                <TicketCard
                  ticket={ticket}
                  onClick={handleCardClick}
                  onDelete={handleOpenDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {tickets.length > 0 && (
        <Pagination
          currentPage={currentPage}
          hasMore={data?.hasMore || false}
          onNext={() => data?.lastDoc && nextPage(data.lastDoc)}
          onPrevious={previousPage}
          pageSize={PAGE_SIZE}
          itemCount={tickets.length}
        />
      )}

      {/* Create Ticket Dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Ticket"
        description="Provision a ticket and assign it to an employee or manager."
      >
        <TicketForm
          onCancel={() => setIsCreateOpen(false)}
          onSuccess={() => setIsCreateOpen(false)}
        />
      </Dialog>

      {/* Direct Delete Dialog */}
      <DirectDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, ticket: null })}
        onConfirm={handleConfirmDelete}
        entityType="ticket"
        entityName={deleteDialog.ticket?.title || 'Ticket'}
        isLoading={isDirectDeleting}
      />
    </div>
  );
}
