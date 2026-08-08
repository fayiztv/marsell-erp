import { useAuthStore } from '@/app/stores/authStore';

/**
 * Convenience hook for consuming auth state from the store.
 * Components should use this instead of accessing the store directly.
 */
export function useAuth() {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const role = useAuthStore((s) => s.role);
  const status = useAuthStore((s) => s.status);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  return {
    firebaseUser,
    role,
    status,
    isLoading,
    isInitialized,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isEmployee: role === 'employee',
    isAuthenticated: firebaseUser !== null,
    isBlocked: status === 'blocked',
  };
}
