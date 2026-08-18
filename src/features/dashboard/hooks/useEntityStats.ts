import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { useAuth } from '@/hooks/useAuth';

export function useUserTicketStats(uid?: string, isTargetManager: boolean = false) {
  const { role, accessibleDepartmentIds } = useAuth();
  // Only managers need their query scoped by department access. Admins have global access.
  const viewerDeptIds = role === 'manager' ? accessibleDepartmentIds : undefined;

  return useQuery({
    queryKey: ['user-ticket-stats', uid, isTargetManager, viewerDeptIds],
    queryFn: () => {
      if (!uid) throw new Error('User ID is required');
      return dashboardService.getUserTicketStats(uid, isTargetManager, viewerDeptIds);
    },
    enabled: !!uid && (role !== 'manager' || accessibleDepartmentIds.length > 0),
    staleTime: 1000 * 60 * 5,
  });
}

export function useClientTicketStats(clientId?: string) {
  return useQuery({
    queryKey: ['client-ticket-stats', clientId],
    queryFn: () => {
      if (!clientId) throw new Error('Client ID is required');
      return dashboardService.getClientTicketStats(clientId);
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
  });
}
