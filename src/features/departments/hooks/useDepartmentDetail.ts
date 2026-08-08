import { useQuery } from '@tanstack/react-query';
import { departmentService } from '../services/departmentService';
import { QUERY_KEYS } from '@/constants';

export function useDepartmentDetail(departmentId?: string) {
  const departmentQuery = useQuery({
    queryKey: QUERY_KEYS.departments.detail(departmentId || ''),
    queryFn: () => (departmentId ? departmentService.fetchDepartmentById(departmentId) : null),
    enabled: Boolean(departmentId),
  });

  const membersQuery = useQuery({
    queryKey: [...QUERY_KEYS.departments.detail(departmentId || ''), 'members'],
    queryFn: () => (departmentId ? departmentService.fetchDepartmentMembers(departmentId) : null),
    enabled: Boolean(departmentId),
  });

  const ticketsQuery = useQuery({
    queryKey: [...QUERY_KEYS.departments.detail(departmentId || ''), 'tickets'],
    queryFn: () => (departmentId ? departmentService.fetchDepartmentTickets(departmentId) : []),
    enabled: Boolean(departmentId),
  });

  return {
    department: departmentQuery.data,
    isLoadingDepartment: departmentQuery.isLoading,
    departmentError: departmentQuery.error,

    members: membersQuery.data,
    isLoadingMembers: membersQuery.isLoading,

    tickets: ticketsQuery.data || [],
    isLoadingTickets: ticketsQuery.isLoading,

    isLoadingAll: departmentQuery.isLoading || membersQuery.isLoading || ticketsQuery.isLoading,
  };
}
