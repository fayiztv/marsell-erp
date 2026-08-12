import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { QUERY_KEYS } from '@/constants';

export function useAdminMetrics() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.adminStats,
    queryFn: () => dashboardService.getAdminMetrics(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
