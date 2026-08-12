import { create } from 'zustand';
import type { UserRole, UserStatus } from '@/types';
import type { FirebaseUser } from '@/types';

interface AuthStore {
  // State
  firebaseUser: FirebaseUser | null;
  role: UserRole | null;
  status: UserStatus | null;
  homeDepartmentId: string | null;
  temporaryDepartmentIds: string[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setRole: (role: UserRole | null) => void;
  setStatus: (status: UserStatus | null) => void;
  setDepartments: (homeId: string | null, tempIds: string[]) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  // Initial state
  firebaseUser: null,
  role: null,
  status: null,
  homeDepartmentId: null,
  temporaryDepartmentIds: [],
  isLoading: true,
  isInitialized: false,

  // Actions
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setRole: (role) => set({ role }),
  setStatus: (status) => set({ status }),
  setDepartments: (homeId, tempIds) => set({ homeDepartmentId: homeId, temporaryDepartmentIds: tempIds }),
  setLoading: (loading) => set({ isLoading: loading }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  clearAuth: () =>
    set({
      firebaseUser: null,
      role: null,
      status: null,
      homeDepartmentId: null,
      temporaryDepartmentIds: [],
      isLoading: false,
    }),
}));
