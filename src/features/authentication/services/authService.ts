import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as firebaseUpdatePassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/constants';
import type { UserStatus } from '@/types';
import { AppError, mapFirebaseError } from '@/utils/errorUtils';

/**
 * Authentication service — wraps Firebase Auth calls with typed error handling.
 * All methods throw AppError on failure; callers should catch and display via useToast.
 */
export const authService = {
  /**
   * Sign in with email and password.
   * On success, onAuthStateChanged in AuthProvider resolves the role and writes to authStore.
   */
  async signIn(email: string, password: string): Promise<void> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check user status immediately
      const userDocRef = doc(db, COLLECTIONS.USERS, userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      const status = userDoc.exists() ? (userDoc.data()['status'] as UserStatus) : null;
      
      if (status === 'blocked') {
        await firebaseSignOut(auth);
        throw new Error('Your account has been deactivated. Contact your administrator.');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('deactivated')) {
        throw new AppError(error.message, 'PERMISSION_DENIED', error);
      }
      throw mapFirebaseError(error);
    }
  },

  /**
   * Sign the current user out and clear the session.
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw mapFirebaseError(error);
    }
  },

  /**
   * Send a password-reset email to the given address.
   * Throws AppError('NOT_FOUND') if the email is not registered.
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      const err = error as { code?: string };
      // Firebase deliberately doesn't distinguish "email not found" to prevent enumeration.
      // We surface a friendly message regardless.
      if (err.code === 'auth/user-not-found') {
        throw new AppError(
          'If an account with this email exists, a reset link has been sent.',
          'NOT_FOUND',
          error,
        );
      }
      throw mapFirebaseError(error);
    }
  },

  /**
   * Update the current user's password.
   * Performs re-authentication with the current password first to satisfy Firebase security requirements.
   */
  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      throw new AppError('You must be logged in to update your password.', 'UNAUTHENTICATED');
    }

    try {
      // 1. Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // 2. Update password
      await firebaseUpdatePassword(currentUser, newPassword);
    } catch (error: any) {
      if (
        error?.code === 'auth/wrong-password' ||
        error?.code === 'auth/invalid-credential' ||
        error?.code === 'auth/invalid-login-credentials'
      ) {
        throw new AppError('Current password is incorrect.', 'UNAUTHENTICATED', error);
      }
      if (error?.code === 'auth/weak-password') {
        throw new AppError('Password must be at least 6 characters.', 'VALIDATION_ERROR', error);
      }
      throw mapFirebaseError(error);
    }
  },
};
