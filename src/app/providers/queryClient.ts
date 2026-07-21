import { QueryClient } from '@tanstack/react-query';
import { LIST_STALE_TIME_MS } from '@/constants';

/**
 * TanStack Query client singleton.
 * Exported separately to avoid the fast-refresh warning from co-exporting
 * a non-component value in a component file.
 *
 * Use this instance for manual cache invalidation in services/hooks:
 * import { queryClient } from '@/app/providers/queryClient';
 * queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets.all });
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: LIST_STALE_TIME_MS,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
