import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
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
 * Sets up the Firebase onAuthStateChanged listener.
 * Maintains a reactive onSnapshot listener on the user's Firestore document.
 * Automatically refreshes the Firebase ID Token when access-related fields
 * (role, homeDepartmentId, temporaryDepartmentIds) change in Firestore.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const isRefreshingToken = useRef(false);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      const { setFirebaseUser, setRole, setStatus, setDepartments, setLoading, setInitialized, clearAuth } =
        useAuthStore.getState();

      // Clear existing snapshot listener if user changes/logs out
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!firebaseUser) {
        clearAuth();
        setInitialized(true);
        return;
      }

      try {
        setLoading(true);

        // Extract initial role and departments from custom claims
        // Use true for first load just to be absolutely sure we have fresh claims if a function just ran
        const idTokenResult = await firebaseUser.getIdTokenResult(true);
        const role = (idTokenResult.claims['role'] as UserRole) ?? null;
        const homeDepartmentId = (idTokenResult.claims['homeDeptId'] as string) ?? null;
        const temporaryDepartmentIds = (idTokenResult.claims['tempDeptIds'] as string[]) ?? [];

        setFirebaseUser(firebaseUser);
        setRole(role);
        setDepartments(homeDepartmentId, temporaryDepartmentIds);

        // Setup reactive Firestore listener
        const userDocRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
        
        await new Promise<void>((resolve) => {
          let isFirst = true;

          unsubscribeSnapshot = onSnapshot(userDocRef, async (snapshot) => {
            if (!snapshot.exists()) {
              await auth.signOut();
              if (isFirst) {
                isFirst = false;
                resolve();
              }
              return;
            }

            const data = snapshot.data();
            const status = data['status'] as UserStatus;
            const docRole = data['role'] as UserRole;
            const docHomeDept = data['homeDepartmentId'] as string | null;
            const docTempDepts = (data['temporaryDepartmentIds'] as string[]) || [];

            // If blocked, sign out and clear state immediately
            if (status === 'blocked') {
              await auth.signOut();
              if (isFirst) {
                isFirst = false;
                resolve();
              }
              return;
            }

            setStatus(status);

            // Check if access-related claims differ from the currently stored authStore claims
            const currentStore = useAuthStore.getState();
            const sortedDocTempDepts = [...docTempDepts].sort().join(',');
            const sortedStoreTempDepts = [...currentStore.temporaryDepartmentIds].sort().join(',');

            const hasAccessChanged =
              docRole !== currentStore.role ||
              docHomeDept !== currentStore.homeDepartmentId ||
              sortedDocTempDepts !== sortedStoreTempDepts;

            // Guard against re-entry loops with isRefreshingToken
            if (hasAccessChanged && !isRefreshingToken.current) {
              isRefreshingToken.current = true;
              try {
                // Force token refresh to sync custom claims with backend
                const freshTokenResult = await firebaseUser.getIdTokenResult(true);
                
                setRole((freshTokenResult.claims['role'] as UserRole) ?? null);
                setDepartments(
                  (freshTokenResult.claims['homeDeptId'] as string) ?? null,
                  (freshTokenResult.claims['tempDeptIds'] as string[]) ?? []
                );
              } catch (err) {
                console.error('Failed to refresh token during reactive update:', err);
              } finally {
                isRefreshingToken.current = false;
              }
            }
            
            if (isFirst) {
              isFirst = false;
              resolve();
            }
          }, async (error) => {
            console.error('Firestore user snapshot error:', error);
            await auth.signOut();
            if (isFirst) {
              isFirst = false;
              resolve();
            }
          });
        });
      } catch (err) {
        console.error('Auth initialization error:', err);
        await auth.signOut();
        useAuthStore.getState().clearAuth();
      } finally {
        useAuthStore.getState().setLoading(false);
        useAuthStore.getState().setInitialized(true);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
