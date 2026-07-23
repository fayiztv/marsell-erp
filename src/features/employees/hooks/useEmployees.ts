import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';
import type { EmployeeFormData } from '../validation/employeeSchema';
import type { EmployeeFilters, UserStatus } from '@/types';
import type { DocumentSnapshot } from 'firebase/firestore';
import { QUERY_KEYS, LIST_STALE_TIME_MS, PAGE_SIZE } from '@/constants';
import { useToast } from '@/hooks/useToast';

/**
 * Fetch employees with pagination
 */
export function useEmployees(filters: EmployeeFilters, cursor: DocumentSnapshot | null) {
  return useQuery({
    queryKey: [...QUERY_KEYS.users.lists(), filters, cursor?.id],
    queryFn: () => employeeService.fetchEmployees(filters, PAGE_SIZE, cursor),
    staleTime: LIST_STALE_TIME_MS,
    placeholderData: keepPreviousData,
  });
}

/**
 * Mutation: Create Employee
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: EmployeeFormData) => employeeService.createEmployee(data),
    onSuccess: () => {
      toast.success('Employee created', 'The user account has been created successfully.');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats });
    },
    onError: (error: any) => {
      toast.error('Creation failed', error.message || 'Could not create employee.');
    },
  });
}

/**
 * Mutation: Update Employee Profile
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: Omit<EmployeeFormData, 'password' | 'role'> }) =>
      employeeService.updateEmployee(uid, data),
    onSuccess: () => {
      toast.success('Profile updated', 'Employee details have been saved.');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats });
    },
    onError: (error: any) => {
      toast.error('Update failed', error.message || 'Could not update employee.');
    },
  });
}

/**
 * Mutation: Update Employee Status (Block/Unblock)
 */
export function useUpdateEmployeeStatus() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ uid, status }: { uid: string; status: UserStatus }) =>
      employeeService.updateStatus(uid, status),
    onSuccess: (_, variables) => {
      const action = variables.status === 'blocked' ? 'blocked' : 'activated';
      toast.success(`User ${action}`, `The employee account has been ${action}.`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats });
    },
    onError: (error: any) => {
      toast.error('Status update failed', error.message || 'Could not update status.');
    },
  });
}

/**
 * Mutation: Delete Employee
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (uid: string) => employeeService.deleteEmployee(uid),
    onSuccess: () => {
      toast.success('Employee deleted', 'The employee account has been deleted.');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats });
    },
    onError: (error: any) => {
      // The Cloud Function will throw specific messages like "This employee has ticket history."
      toast.error('Deletion blocked', error.message || 'Could not delete employee.');
    },
  });
}
