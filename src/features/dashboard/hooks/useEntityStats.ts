import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export function useUserTicketStats(uid?: string, isManager: boolean = false) {
  return useQuery({
    queryKey: ['user-ticket-stats', uid, isManager],
    queryFn: () => {
      if (!uid) throw new Error('User ID is required');
      return dashboardService.getUserTicketStats(uid, isManager);
    },
    enabled: !!uid,
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
