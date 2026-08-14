import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '../services/departmentService';
import type { DepartmentFilters, DepartmentStatus } from '../types/department.types';
import type { DepartmentFormData } from '../validation/departmentSchema';
import { QUERY_KEYS, PAGE_SIZE, LIST_STALE_TIME_MS } from '@/constants';
import type { DocumentSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

export function useDepartments(
  filters: DepartmentFilters = { status: null, search: '' },
  cursor: DocumentSnapshot | null = null,
  pageSize: number = PAGE_SIZE
) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { firebaseUser } = useAuth();

  const query = useQuery({
    queryKey: [...QUERY_KEYS.departments.lists(), filters, cursor?.id],
    queryFn: () => departmentService.fetchDepartments(filters, pageSize, cursor),
    staleTime: LIST_STALE_TIME_MS,
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (data: DepartmentFormData) =>
      departmentService.createDepartment(data, firebaseUser?.uid || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.adminStats });
      toast.success('Department created', 'The new department has been established.');
    },
    onError: (err: any) => {
      toast.error('Failed to create department', err.message || 'An error occurred.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DepartmentFormData }) =>
      departmentService.updateDepartment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.detail(id) });
      toast.success('Department updated', 'Changes have been saved.');
    },
    onError: (err: any) => {
      toast.error('Failed to update department', err.message || 'An error occurred.');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DepartmentStatus }) =>
      departmentService.toggleDepartmentStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
      toast.success(
        status === 'active' ? 'Department reactivated' : 'Department archived',
        `Department is now ${status}.`
      );
    },
    onError: (err: any) => {
      toast.error('Failed to change status', err.message || 'An error occurred.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.adminStats });
      toast.success('Department deleted', 'The department was successfully removed.');
    },
    onError: (err: any) => {
      toast.error('Cannot delete department', err.message || 'An error occurred.');
    },
  });

  return {
    ...query,
    createDepartment: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateDepartment: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    toggleStatus: toggleStatusMutation.mutateAsync,
    isTogglingStatus: toggleStatusMutation.isPending,
    deleteDepartment: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
