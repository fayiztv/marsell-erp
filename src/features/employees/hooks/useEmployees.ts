import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';
import type { EmployeeFormData } from '../validation/employeeSchema';
import type { EmployeeFilters, UserStatus } from '@/types';
import type { DocumentSnapshot } from 'firebase/firestore';
import { QUERY_KEYS, LIST_STALE_TIME_MS, PAGE_SIZE } from '@/constants';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

/**
 * Fetch employees / users with pagination
 */
export function useEmployees(filters: EmployeeFilters, cursor: DocumentSnapshot | null, excludeSelf: boolean = false) {
  const { firebaseUser } = useAuth();
  
  return useQuery({
    queryKey: [...QUERY_KEYS.users.lists(), filters, cursor?.id, excludeSelf ? firebaseUser?.uid : null],
    queryFn: () => employeeService.fetchEmployees(filters, PAGE_SIZE, cursor, excludeSelf ? firebaseUser?.uid : undefined),
    staleTime: LIST_STALE_TIME_MS,
    placeholderData: keepPreviousData,
  });
}

/**
 * Mutation: Create User Account
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: EmployeeFormData) => employeeService.createEmployee(data),
    onSuccess: () => {
      toast.success('User created', 'The user account has been created successfully.');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.adminStats });
    },
    onError: (error: any) => {
      toast.error('Creation failed', error.message || 'Could not create user account.');
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
      toast.success(`User ${action}`, `The user account has been ${action}.`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.adminStats });
    },
    onError: (error: any) => {
      toast.error('Status update failed', error.message || 'Could not update status.');
    },
  });
}

/**
 * Mutation: Grant Temporary Department Access
 */
export function useGrantTempAccess() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ targetUid, departmentId }: { targetUid: string; departmentId: string }) =>
      employeeService.grantTempAccess(targetUid, departmentId),
    onSuccess: (data) => {
      toast.success('Access Granted', data.message || 'Temporary department access granted.');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
    },
    onError: (error: any) => {
      toast.error('Grant Access Failed', error.message || 'Could not grant temporary access.');
    },
  });
}

/**
 * Mutation: Revoke Temporary Department Access
 */
export function useRevokeTempAccess() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ targetUid, departmentId }: { targetUid: string; departmentId: string }) =>
      employeeService.revokeTempAccess(targetUid, departmentId),
    onSuccess: (data) => {
      toast.success('Access Revoked', data.message || 'Temporary department access revoked.');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
    },
    onError: (error: any) => {
      toast.error('Revoke Access Failed', error.message || 'Could not revoke temporary access.');
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
    mutationFn: (uid: string) => 
      toast.promise(employeeService.deleteEmployee(uid), {
        loading: 'Deleting employee...',
        success: 'The employee account has been deleted.',
        error: (error: any) => error.message || 'Could not delete employee.',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.adminStats });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
    },
  });
}
