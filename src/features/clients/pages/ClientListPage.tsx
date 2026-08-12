import { useState } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Pagination, EmptyState, LoadingSkeleton, Dialog } from '@/components/ui';
import { useUIStore } from '@/app/stores/uiStore';
import { useClients, useUpdateClientStatus } from '../hooks/useClients';
import { useApprovals } from '@/features/approvals/hooks/useApprovals';
import { ClientCard } from '../components/ClientCard';
import { ClientFilters } from '../components/ClientFilters';
import { ClientForm } from '../components/ClientForm';
import { usePagination } from '@/hooks/usePagination';
import type { Client } from '../types/client.types';
import { listStaggerVariants, listItemVariants } from '@/utils/animations';
import { PAGE_SIZE } from '@/constants';

export function ClientListPage() {
  const filters = useUIStore((s) => s.clientFilters);
  const activeDialog = useUIStore((s) => s.activeDialog);
  const dialogPayload = useUIStore((s) => s.dialogPayload) as Client | undefined;
  const openDialog = useUIStore((s) => s.openDialog);
  const closeDialog = useUIStore((s) => s.closeDialog);

  const {
    currentPage,
    currentCursor,
    nextPage,
    previousPage,
  } = usePagination();

  const { data, isLoading, isError } = useClients(filters, currentCursor);
  const updateStatusMutation = useUpdateClientStatus();
  const { requestDeletion, isRequestingDeletion } = useApprovals();
  const [deleteReason, setDeleteReason] = useState('');

  const handleToggleStatus = (client: Client) => {
    const newStatus = client.status === 'active' ? 'inactive' : 'active';
    updateStatusMutation.mutate({ id: client.id, status: newStatus });
  };

  const handleDelete = (client: Client) => {
    setDeleteReason('');
    openDialog('confirm-delete', client);
  };

  const confirmDelete = () => {
    if (dialogPayload) {
      requestDeletion(
        {
          entityType: 'client',
          entityId: dialogPayload.id,
          reason: deleteReason || 'No reason provided',
        },
        {
          onSuccess: () => {
            closeDialog();
          },
        }
      );
    }
  };

  const handleEdit = (client: Client) => {
    openDialog('edit-client', client);
  };

  const clients = data?.items || [];
  const hasMore = data?.hasMore || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Clients</h1>
          <p className="text-sm text-gray-400 mt-1">Manage external companies and contacts.</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => openDialog('create-client')}
        >
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <ClientFilters />

      {/* Content */}
      {isError ? (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
          Failed to load clients. Please try again.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-[140px] rounded-xl" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<Building2 size={24} />}
          title="No clients found"
          description="Try adjusting your search query."
          action={
            <Button variant="outline" onClick={() => useUIStore.getState().setClientFilters({ search: '' })}>
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <motion.div
            variants={listStaggerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {clients.map((client) => (
                <motion.div key={client.id} layout variants={listItemVariants}>
                  <ClientCard
                    client={client}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          <Pagination
            currentPage={currentPage}
            hasMore={hasMore}
            onNext={() => data?.lastDoc && nextPage(data.lastDoc)}
            onPrevious={previousPage}
            pageSize={PAGE_SIZE}
            itemCount={clients.length}
          />
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        isOpen={activeDialog === 'create-client'}
        onClose={closeDialog}
        title="Add New Client"
        description="Enter the details of the new client."
      >
        <ClientForm onCancel={closeDialog} />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        isOpen={activeDialog === 'edit-client' && !!dialogPayload}
        onClose={closeDialog}
        title="Edit Client"
        description="Update the details for this client."
      >
        {dialogPayload && (
          <ClientForm
            editId={dialogPayload.id}
            defaultValues={dialogPayload}
            onCancel={closeDialog}
          />
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={activeDialog === 'confirm-delete' && !!dialogPayload}
        onClose={closeDialog}
        title="Request Client Deletion"
        description={
          <>
            Are you sure you want to request deletion of {dialogPayload?.companyName}? 
            An admin must approve this request before the client is removed.
          </>
        }
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Reason for Deletion (Optional)
          </label>
          <textarea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            className="w-full bg-gray-900 border border-white/[0.04] rounded-lg p-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Why are you deleting this client?"
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.04]">
          <Button variant="ghost" onClick={closeDialog} disabled={isRequestingDeletion}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete} isLoading={isRequestingDeletion}>
            Submit Request
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
