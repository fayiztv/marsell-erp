import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';
import { ToastContainer } from '@/components/ui/Toast';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * AppProviders — composition root for all global providers.
 * Order matters:
 *   1. QueryProvider — must be outermost so AuthProvider can use query invalidation in future
 *   2. AuthProvider — sets up auth state, no rendering dependency
 *   3. ToastContainer — fixed position, above all content, reads from toastStore
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <ToastContainer />
      </AuthProvider>
    </QueryProvider>
  );
}
