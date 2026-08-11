import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { QUERY_KEYS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

export function useDashboardMetrics() {
  const { firebaseUser, role, accessibleDepartmentIds } = useAuth();

  return useQuery({
    queryKey: [...QUERY_KEYS.dashboard.stats, { accessibleDepartmentIds }],
    queryFn: () => dashboardService.getManagerMetrics(accessibleDepartmentIds),
    // Dashboard metrics can be relatively stale to save reads, but we will
    // also invalidate this query automatically when relevant mutations occur.
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!firebaseUser && role === 'manager',
  });
}
