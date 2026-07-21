import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * TanStack Query provider — wraps the app with the singleton QueryClient.
 * The client is defined in queryClient.ts to keep this file component-only
 * (required for React fast refresh / oxlint only-export-components rule).
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
