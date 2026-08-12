/**
 * Firebase Auth user type extensions.
 * Wraps the Firebase User with our app-specific claims.
 */
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserRole, UserStatus } from './common.types';

/** The shape of our Firebase custom claims JWT payload */
export interface CustomClaims {
  role: UserRole;
  homeDeptId?: string | null;
  tempDeptIds?: string[];
}

/** Authenticated user stored in Zustand authStore */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/** Full auth state held by the auth store */
export interface AuthState {
  firebaseUser: FirebaseUser | null;
  authUser: AuthUser | null;
  role: UserRole | null;
  status: UserStatus | null;
  homeDepartmentId?: string | null;
  temporaryDepartmentIds?: string[];
  isLoading: boolean;
  isInitialized: boolean;
}

export type { FirebaseUser };
