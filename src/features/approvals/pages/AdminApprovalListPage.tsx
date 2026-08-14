import { useState } from 'react';
import {
  ShieldCheck,
  XCircle,
  Search,
  User,
  Building2,
  Ticket as TicketIcon,
  Check,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApprovals } from '../hooks/useApprovals';
import {
  Button,
  Input,
  Badge,
  Card,
  ConfirmationDialog,
  LoadingSkeleton,
  EmptyState,
  Dialog,
  Textarea,
  Pagination,
} from '@/components/ui';
import { usePagination } from '@/hooks/usePagination';
import { PAGE_SIZE } from '@/constants';
import type {
  DeletionRequest,
  DeletionEntityType,
  DeletionRequestStatus,
} from '../types/approval.types';
import { formatDate } from '@/utils/dateUtils';
import { listStaggerVariants, listItemVariants } from '@/utils/animations';

export function AdminApprovalListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeletionRequestStatus | null>('pending');
  const [entityFilter, setEntityFilter] = useState<DeletionEntityType | null>(null);

  const { currentPage, currentCursor, nextPage, previousPage } = usePagination();

  const {
    data,
    isLoading,
    isError,
    approveRequest,
    isApproving,
    rejectRequest,
    isRejecting,
  } = useApprovals({
    status: statusFilter,
    entityType: entityFilter,
    search,
  }, currentCursor);

  // Action Dialogs
  const [approveDialog, setApproveDialog] = useState<{
    isOpen: boolean;
    request: DeletionRequest | null;
  }>({
    isOpen: false,
    request: null,
  });

  const [rejectDialog, setRejectDialog] = useState<{
    isOpen: boolean;
    request: DeletionRequest | null;
    reason: string;
  }>({
    isOpen: false,
    request: null,
    reason: '',
  });

  const handleOpenApprove = (req: DeletionRequest) => {
    setApproveDialog({ isOpen: true, request: req });
  };

  const handleConfirmApprove = async () => {
    if (!approveDialog.request) return;
    await approveRequest(approveDialog.request.id);
    setApproveDialog({ isOpen: false, request: null });
  };

  const handleOpenReject = (req: DeletionRequest) => {
    setRejectDialog({ isOpen: true, request: req, reason: '' });
  };

  const handleConfirmReject = async () => {
    if (!rejectDialog.request) return;
    const reasonText = rejectDialog.reason.trim();
    await rejectRequest({
      requestId: rejectDialog.request.id,
      ...(reasonText ? { reason: reasonText } : {}),
    });
    setRejectDialog({ isOpen: false, request: null, reason: '' });
  };

  const requests = data?.items || [];

  const getEntityIcon = (type: DeletionEntityType) => {
    switch (type) {
      case 'employee':
        return <User size={16} className="text-emerald-400" />;
      case 'client':
        return <Building2 size={16} className="text-indigo-400" />;
      case 'ticket':
        return <TicketIcon size={16} className="text-amber-400" />;
    }
  };

  const getEntityBadge = (type: DeletionEntityType) => {
    switch (type) {
      case 'employee':
        return (
          <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            Employee
          </span>
        );
      case 'client':
        return (
          <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
            Client
          </span>
        );
      case 'ticket':
        return (
          <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
            Ticket
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Deletion Approvals Queue</h1>
        <p className="text-sm text-gray-400 mt-1">
          Review and decide on permanent deletion requests submitted by department managers.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-900/40 p-4 rounded-xl border border-white/[0.06]">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search request summary, requester..."
            className="pl-9 bg-gray-950/60 border-white/[0.08]"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Entity Type Filter */}
          <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-lg border border-white/[0.06]">
            <button
              onClick={() => setEntityFilter(null)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                entityFilter === null
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setEntityFilter('employee')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                entityFilter === 'employee'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Employees
            </button>
            <button
              onClick={() => setEntityFilter('client')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                entityFilter === 'client'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Clients
            </button>
            <button
              onClick={() => setEntityFilter('ticket')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                entityFilter === 'ticket'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Tickets
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-lg border border-white/[0.06]">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                statusFilter === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                statusFilter === 'approved'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                statusFilter === 'rejected'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Rejected
            </button>
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                statusFilter === null
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Requests List */}
      {isError ? (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
          Failed to load deletion requests.
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={24} />}
          title={statusFilter === 'pending' ? 'No pending approvals' : 'No requests found'}
          description={
            statusFilter === 'pending'
              ? 'The deletion queue is clear. All manager requests have been processed.'
              : 'No deletion requests match the selected filters.'
          }
        />
      ) : (
        <motion.div
          variants={listStaggerVariants}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {requests.map((req) => {
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'approved';

            return (
              <motion.div key={req.id} variants={listItemVariants}>
                <Card className="p-5 bg-gray-900/50 border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Column: Entity Details */}
                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-xl bg-gray-950 border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                      {getEntityIcon(req.entityType)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getEntityBadge(req.entityType)}
                        <h3 className="text-base font-semibold text-gray-100">
                          {req.entitySummary?.title || 'Unknown Entity'}
                        </h3>
                      </div>

                      <p className="text-xs text-gray-400">
                        {req.entitySummary?.subtitle || 'No details available'}
                      </p>

                      {req.reason && (
                        <div className="mt-2 p-2 rounded-lg bg-gray-950/60 border border-white/[0.04] text-xs text-gray-300 max-w-xl">
                          <span className="font-semibold text-gray-400">Reason: </span>
                          {req.reason}
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-gray-500">
                        <span>
                          Requested by <strong className="text-gray-400">{req.requestedByName}</strong>
                        </span>
                        <span>•</span>
                        <span>{req.requestedAt ? formatDate(req.requestedAt) : 'Recently'}</span>
                        {req.reviewedByName && (
                          <>
                            <span>•</span>
                            <span>
                              Reviewed by <strong className="text-gray-400">{req.reviewedByName}</strong>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status & Action Buttons */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20"
                          onClick={() => handleOpenReject(req)}
                          disabled={isApproving || isRejecting}
                        >
                          <X className="size-4 mr-1.5" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                          onClick={() => handleOpenApprove(req)}
                          disabled={isApproving || isRejecting}
                        >
                          <Check className="size-4 mr-1.5" />
                          Approve & Delete
                        </Button>
                      </div>
                    ) : isApproved ? (
                      <Badge variant="success" className="px-3 py-1 text-xs">
                        <ShieldCheck className="size-3.5 mr-1" />
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="danger" className="px-3 py-1 text-xs">
                        <XCircle className="size-3.5 mr-1" />
                        Rejected
                      </Badge>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {requests.length > 0 && (
        <Pagination
          currentPage={currentPage}
          hasMore={data?.hasMore || false}
          onNext={() => data?.lastDoc && nextPage(data.lastDoc)}
          onPrevious={previousPage}
          pageSize={PAGE_SIZE}
          itemCount={requests.length}
        />
      )}

      {/* Confirmation Dialog: Approve */}
      <ConfirmationDialog
        isOpen={approveDialog.isOpen}
        onClose={() => setApproveDialog({ isOpen: false, request: null })}
        onConfirm={handleConfirmApprove}
        title="Approve Permanent Deletion?"
        description={`Approving this request will permanently delete "${approveDialog.request?.entitySummary?.title}" and clean up all associated records. This action cannot be reversed.`}
        confirmLabel="Approve & Hard Delete"
        variant="danger"
        isLoading={isApproving}
      />

      {/* Dialog: Reject with Optional Reason */}
      <Dialog
        isOpen={rejectDialog.isOpen}
        onClose={() => setRejectDialog({ isOpen: false, request: null, reason: '' })}
        title="Reject Deletion Request"
        description="Provide an optional explanation for rejecting this request."
        actions={[
          {
            label: 'Cancel',
            variant: 'ghost',
            onClick: () => setRejectDialog({ isOpen: false, request: null, reason: '' }),
            disabled: isRejecting,
          },
          {
            label: 'Reject Request',
            variant: 'danger',
            onClick: handleConfirmReject,
            isLoading: isRejecting,
          },
        ]}
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            Entity: <strong className="text-gray-200">{rejectDialog.request?.entitySummary?.title}</strong> (
            {rejectDialog.request?.entityType})
          </p>
          <Textarea
            label="Rejection Reason (Optional)"
            placeholder="e.g. Please reassign open client projects before requesting deletion..."
            rows={3}
            value={rejectDialog.reason}
            onChange={(e) =>
              setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))
            }
          />
        </div>
      </Dialog>
    </div>
  );
}
