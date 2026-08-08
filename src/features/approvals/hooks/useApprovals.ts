import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalService } from '../services/approvalService';
import type {
  DeletionRequestFilters,
  DeletionEntityType,
} from '../types/approval.types';
import { QUERY_KEYS } from '@/constants';
import { useToast } from '@/hooks/useToast';

export function useApprovals(
  filters: DeletionRequestFilters = { status: 'pending', entityType: null, search: '' }
) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: QUERY_KEYS.approvals.list(filters as unknown as Record<string, unknown>),
    queryFn: () => approvalService.fetchDeletionRequests(filters),
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => approvalService.approveRequest(requestId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.approvals.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.adminStats });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
      toast.success('Deletion Approved', data.message || 'Entity has been permanently removed.');
    },
    onError: (err: any) => {
      // Show descriptive server error (e.g. "This client cannot be deleted because 1 or more tickets reference them")
      toast.error('Cannot Approve Deletion', err.message || 'An error occurred during approval.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      approvalService.rejectRequest(requestId, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.approvals.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.adminStats });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets.all });
      toast.info('Deletion Rejected', data.message || 'The deletion request has been rejected.');
    },
    onError: (err: any) => {
      toast.error('Rejection Failed', err.message || 'An error occurred.');
    },
  });

  const directDeleteMutation = useMutation({
    mutationFn: ({
      entityType,
      entityId,
    }: {
      entityType: DeletionEntityType;
      entityId: string;
    }) => approvalService.directDelete(entityType, entityId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.approvals.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.adminStats });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
      toast.success('Entity Deleted', data.message || 'The entity was deleted successfully.');
    },
    onError: (err: any) => {
      toast.error('Direct Deletion Failed', err.message || 'Failed to delete entity.');
    },
  });

  return {
    ...query,
    approveRequest: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    rejectRequest: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isPending,
    directDelete: directDeleteMutation.mutateAsync,
    isDirectDeleting: directDeleteMutation.isPending,
  };
}
