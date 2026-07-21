import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/firestore';
import { useAuthStore } from '@/app/stores/authStore';
import { COLLECTIONS } from '@/constants';
import type { UserStatus, UserRole } from '@/types';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider
 *
 * Sets up the Firebase onAuthStateChanged listener exactly once.
 * On auth state change:
 *   1. Extracts `role` from custom claims (JWT — no Firestore read required)
 *   2. Reads `status` from Firestore users doc (to detect blocked users)
 *   3. Populates the Zustand authStore
 *   4. If the user is blocked, signs them out immediately
 *
 * This component renders nothing — it is a pure side-effect provider.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { setFirebaseUser, setRole, setStatus, setLoading, setInitialized, clearAuth } =
    useAuthStore.getState();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        clearAuth();
        setInitialized(true);
        return;
      }

      try {
        setLoading(true);

        // Extract role from custom claims (no Firestore read needed)
        const idTokenResult = await firebaseUser.getIdTokenResult();
        const role = (idTokenResult.claims['role'] as UserRole) ?? null;

        // Read user status from Firestore (to enforce blocked state)
        const userDocRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        const status = userDoc.exists()
          ? (userDoc.data()['status'] as UserStatus)
          : null;

        // If blocked, sign out and clear state immediately
        if (status === 'blocked') {
          await auth.signOut();
          clearAuth();
          setInitialized(true);
          return;
        }

        setFirebaseUser(firebaseUser);
        setRole(role);
        setStatus(status);
      } catch {
        // If anything fails during auth resolution, sign out for safety
        await auth.signOut();
        clearAuth();
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    });

    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
