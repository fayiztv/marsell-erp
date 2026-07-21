import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LIST_STALE_TIME_MS } from '@/constants';

/**
 * TanStack Query client configured for our read strategy:
 * - staleTime: 30s for list views (acceptable staleness, saves reads)
 * - retry: 1 (single retry on network failure; Firestore is reliable)
 * - refetchOnWindowFocus: true (refreshes when user tabs back)
 */
const queryClient = new QueryClient({
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

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export { queryClient };
