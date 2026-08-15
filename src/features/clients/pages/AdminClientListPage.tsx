import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Search, Edit2, Power, Trash2, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useClients, useUpdateClientStatus } from '../hooks/useClients';
import { ClientForm } from '../components/ClientForm';
import { DirectDeleteDialog } from '@/features/approvals/components/DirectDeleteDialog';
import { useApprovals } from '@/features/approvals/hooks/useApprovals';
import { usePagination } from '@/hooks/usePagination';
import { PAGE_SIZE, ROUTES } from '@/constants';
import {
  Button,
  Input,
  Badge,
  Card,
  Dialog,
  LoadingSkeleton,
  EmptyState,
  Pagination,
} from '@/components/ui';
import type { Client } from '../types/client.types';
import type { ClientStatus } from '@/types';
import { listStaggerVariants, listItemVariants } from '@/utils/animations';

export function AdminClientListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | null>(null);
  const navigate = useNavigate();

  const { currentPage, currentCursor, nextPage, previousPage } = usePagination();

  const { data, isLoading, isError } = useClients(
    { status: statusFilter, search },
    currentCursor
  );

  const updateStatusMutation = useUpdateClientStatus();
  const { directDelete, isDirectDeleting } = useApprovals();

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    client: Client | null;
  }>({
    isOpen: false,
    client: null,
  });

  const handleOpenCreate = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleToggleStatus = (client: Client) => {
    const nextStatus: ClientStatus = client.status === 'active' ? 'inactive' : 'active';
    updateStatusMutation.mutate({ id: client.id, status: nextStatus });
  };

  const handleOpenDelete = (client: Client) => {
    setDeleteDialog({ isOpen: true, client });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.client) return;
    await directDelete({
      entityType: 'client',
      entityId: deleteDialog.client.id,
    });
    setDeleteDialog({ isOpen: false, client: null });
  };

  const clients = data?.items || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Clients Directory</h1>
          <p className="text-sm text-gray-400 mt-1">
            System-wide client organizations, accounts, and primary points of contact.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="size-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-900/40 p-4 rounded-xl border border-white/[0.06]">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name, contact, email..."
            className="pl-9 bg-gray-950/60 border-white/[0.08]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-lg border border-white/[0.06]">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              statusFilter === null
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              statusFilter === 'active'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              statusFilter === 'inactive'
                ? 'bg-red-500/20 text-red-300 border border-red-500/30 font-semibold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Clients Grid */}
      {isError ? (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
          Failed to load clients. Please refresh the page.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<Building2 size={24} />}
          title="No clients found"
          description={
            search ? 'No clients match your search query.' : 'Get started by creating your first client organization.'
          }
          actionLabel={search ? undefined : 'Add Client'}
          onAction={search ? undefined : handleOpenCreate}
        />
      ) : (
        <motion.div
          variants={listStaggerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {clients.map((client) => {
            const isInactive = client.status === 'inactive';

            return (
              <motion.div key={client.id} variants={listItemVariants}>
                <Card
                  onClick={() => navigate(ROUTES.ADMIN.CLIENT_DETAIL(client.id))}
                  className={`p-5 flex flex-col justify-between h-full bg-gray-900/50 border-white/[0.06] hover:border-blue-500/30 cursor-pointer transition-all ${
                    isInactive ? 'opacity-65 bg-gray-950/40' : ''
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-100">{client.companyName}</h3>
                          <p className="text-xs text-gray-400">{client.contactPerson}</p>
                        </div>
                      </div>
                      <Badge variant={isInactive ? 'muted' : 'success'}>
                        {isInactive ? 'Inactive' : 'Active'}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 pt-2 text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-gray-500 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-gray-500 shrink-0" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(client); }}
                      title="Edit client"
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/[0.06] transition-colors"
                    >
                      <Edit2 size={15} />
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleStatus(client); }}
                      title={isInactive ? 'Reactivate client' : 'Deactivate client'}
                      className={`p-2 rounded-lg transition-colors ${
                        isInactive
                          ? 'text-emerald-400 hover:bg-emerald-500/10'
                          : 'text-amber-400 hover:bg-amber-500/10'
                      }`}
                    >
                      <Power size={15} />
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenDelete(client); }}
                      title="Delete client"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {clients.length > 0 && (
        <Pagination
          currentPage={currentPage}
          hasMore={data?.hasMore || false}
          onNext={() => data?.lastDoc && nextPage(data.lastDoc)}
          onPrevious={previousPage}
          pageSize={PAGE_SIZE}
          itemCount={clients.length}
        />
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingClient ? 'Edit Client' : 'Add New Client'}
        description={
          editingClient
            ? 'Update company info or primary contact details.'
            : 'Enter company information to register a new client.'
        }
      >
        <ClientForm
          defaultValues={
            editingClient
              ? {
                  companyName: editingClient.companyName,
                  contactPerson: editingClient.contactPerson,
                  email: editingClient.email,
                  phone: editingClient.phone,
                  address: editingClient.address,
                  notes: editingClient.notes,
                }
              : undefined
          }
          editId={editingClient?.id}
          onCancel={() => setIsFormOpen(false)}
          onSuccess={() => setIsFormOpen(false)}
        />
      </Dialog>

      {/* Direct Delete Dialog */}
      <DirectDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, client: null })}
        onConfirm={handleConfirmDelete}
        entityType="client"
        entityName={deleteDialog.client?.companyName || 'Client'}
        isLoading={isDirectDeleting}
      />
    </div>
  );
}
