import type { User } from '../types/employee.types';
import { useAuth } from '@/hooks/useAuth';
import { useEmployee } from '../hooks/useEmployees';

/**
 * Pure helper function to check whether a viewer has permission to change a target user's role.
 *
 * Rules:
 * 1. Admin: always allowed for any user.
 * 2. Manager:
 *    - Cannot modify Admin accounts.
 *    - Allowed if they created this user (createdBy === callerUid).
 *    - Allowed if original creator is inactive/deleted AND caller has department overlap (home or temp).
 *    - Otherwise forbidden.
 * 3. Employee: never allowed.
 */
export function canChangeUserRole(
  viewer: {
    uid?: string | undefined;
    role?: string | null | undefined;
    accessibleDepartmentIds?: string[] | undefined;
  },
  targetUser?: User | null | undefined,
  creatorStatus?: string | null | undefined
): boolean {
  if (!viewer.uid || !viewer.role || !targetUser) return false;

  // 1. Admin can change any user's role
  if (viewer.role === 'admin') return true;

  // 2. Only managers can change non-admin roles
  if (viewer.role !== 'manager') return false;

  // 3. Manager cannot modify an Admin
  if (targetUser.role === 'admin') return false;

  // 4. Manager who created the user has direct permission
  if (targetUser.createdBy === viewer.uid) return true;

  // 5. Fallback: Creator is inactive or deleted, and manager has department overlap
  const isCreatorInactive = !targetUser.createdBy || creatorStatus !== 'active';
  const targetDeptIds = [
    targetUser.homeDepartmentId,
    ...(targetUser.temporaryDepartmentIds || []),
  ].filter(Boolean) as string[];

  const hasDeptOverlap = targetDeptIds.some((id) =>
    viewer.accessibleDepartmentIds?.includes(id)
  );

  return isCreatorInactive && hasDeptOverlap;
}

/**
 * React hook to evaluate role change permissions for the current viewer against a target user.
 */
export function useCanChangeRole(targetUser?: User | null) {
  const { firebaseUser, role, accessibleDepartmentIds } = useAuth();

  const creatorUid = targetUser?.createdBy;
  const isTargetCreator = creatorUid === firebaseUser?.uid;

  // Only query creator doc if a non-creator manager needs to evaluate fallback permission
  const shouldQueryCreator =
    role === 'manager' &&
    Boolean(creatorUid) &&
    !isTargetCreator &&
    targetUser?.role !== 'admin';

  const { data: creatorUser, isFetched: isCreatorFetched } = useEmployee(
    shouldQueryCreator ? (creatorUid ?? '') : ''
  );

  // If creator was queried and doesn't exist, status is 'inactive'
  const creatorStatus = isTargetCreator
    ? 'active'
    : shouldQueryCreator
    ? isCreatorFetched
      ? creatorUser?.status ?? 'inactive'
      : 'active' // wait until fetched
    : 'inactive';

  const canChangeRole = canChangeUserRole(
    { uid: firebaseUser?.uid, role, accessibleDepartmentIds },
    targetUser,
    creatorStatus
  );

  return { canChangeRole, isChecking: shouldQueryCreator && !isCreatorFetched };
}
