import type { AppErrorCode } from '@/types';

/**
 * Typed application error class.
 * All services must throw AppError — never raw Firestore or JS errors.
 * Consumers can switch on `code` for specific handling.
 */
export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly originalError?: unknown;

  constructor(message: string, code: AppErrorCode, originalError?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.originalError = originalError;

    // Preserves prototype chain in transpiled environments
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Maps a raw Firebase error code to a typed AppErrorCode.
 * Centralised so every service gets the same mapping.
 */
export function mapFirebaseError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const err = error as { code?: string; message?: string };
  const message = err.message ?? 'An unexpected error occurred';

  switch (err.code) {
    case 'auth/user-not-found':
    case 'not-found':
      return new AppError('Resource not found.', 'NOT_FOUND', error);

    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return new AppError('Invalid email or password.', 'UNAUTHENTICATED', error);

    case 'auth/email-already-in-use':
    case 'already-exists':
      return new AppError('This email is already in use.', 'ALREADY_EXISTS', error);

    case 'permission-denied':
    case 'auth/unauthorized':
      return new AppError('You do not have permission to perform this action.', 'PERMISSION_DENIED', error);

    case 'unauthenticated':
      return new AppError('You must be logged in to perform this action.', 'UNAUTHENTICATED', error);

    case 'unavailable':
    case 'auth/network-request-failed':
      return new AppError('Network error. Please check your connection.', 'NETWORK_ERROR', error);

    default:
      return new AppError(message, 'UNKNOWN', error);
  }
}
