import { useAuthStore } from '@/app/stores/authStore';

/**
 * Convenience hook for consuming auth state from the store.
 * Components should use this instead of accessing the store directly.
 */
export function useAuth() {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const role = useAuthStore((s) => s.role);
  const status = useAuthStore((s) => s.status);
  const name = useAuthStore((s) => s.name);
  const phone = useAuthStore((s) => s.phone);
  const homeDepartmentId = useAuthStore((s) => s.homeDepartmentId);
  const temporaryDepartmentIds = useAuthStore((s) => s.temporaryDepartmentIds);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  const accessibleDepartmentIds = [
    homeDepartmentId,
    ...(temporaryDepartmentIds || []),
  ].filter(Boolean) as string[];

  return {
    firebaseUser,
    role,
    status,
    name,
    phone,
    homeDepartmentId,
    temporaryDepartmentIds,
    accessibleDepartmentIds,
    isLoading,
    isInitialized,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isEmployee: role === 'employee',
    isAuthenticated: firebaseUser !== null,
    isBlocked: status === 'blocked',
  };
}
