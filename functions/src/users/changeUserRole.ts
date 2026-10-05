import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Changes a user's role (Admin, Manager, Employee).
 *
 * Rules:
 * - Admin can change any role (Employee <-> Manager <-> Admin).
 * - Manager can ONLY change Employee <-> Manager (never touches Admin).
 * - Manager must either:
 *   1. Be the original creator of the target user (createdBy == callerUid).
 *   2. Or, if the original creator is inactive (status != 'active') or deleted, have department access to this user (home or temp overlap).
 * - Updates Firestore users/{targetUid}.role
 * - Updates Firebase Auth custom claims
 * - Revokes refresh tokens via admin.auth().revokeRefreshTokens(targetUid)
 */
export const changeUserRole = onCall(
  {region: "asia-south1"},
  async (request) => {
    // 1. Validate Caller Authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be logged in to change user roles.");
    }

    const callerUid = request.auth.uid;
    const callerRole = request.auth.token.role;

    if (callerRole !== "admin" && callerRole !== "manager") {
      throw new HttpsError(
        "permission-denied",
        "You do not have permission to change user roles."
      );
    }

    // 2. Validate Payload
    const {targetUid, newRole} = request.data;
    if (!targetUid || !newRole) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: targetUid, newRole."
      );
    }

    if (!["employee", "manager", "admin"].includes(newRole)) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid role. Must be 'employee', 'manager', or 'admin'."
      );
    }

    const db = admin.firestore();

    try {
      // 3. Fetch Caller Data for Verification
      const callerDoc = await db.collection("users").doc(callerUid).get();
      if (!callerDoc.exists || callerDoc.data()?.status !== "active") {
        throw new HttpsError("permission-denied", "Your account is not active.");
      }
      const callerData = callerDoc.data();
      const allowedDeptIds = [
        callerData?.homeDepartmentId,
        ...(callerData?.temporaryDepartmentIds || []),
      ].filter(Boolean);

      // 4. Fetch Target User Data
      const userRef = db.collection("users").doc(targetUid);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "Target user not found.");
      }

      const userData = userDoc.data();
      const currentRole = userData?.role;

      if (currentRole === newRole) {
        return {
          message: `User is already a ${newRole}.`,
        };
      }

      // 5. Enforce Manager Boundaries
      if (callerRole === "manager") {
        if (newRole === "admin") {
          throw new HttpsError(
            "permission-denied",
            "Managers are not permitted to grant the Admin role."
          );
        }

        if (currentRole === "admin") {
          throw new HttpsError(
            "permission-denied",
            "Managers cannot modify Administrator accounts."
          );
        }

        const isCreator = userData?.createdBy === callerUid;

        let creatorIsInactive = false;
        if (!isCreator && userData?.createdBy) {
          const creatorDoc = await db.collection("users").doc(userData.createdBy).get();
          if (!creatorDoc.exists || creatorDoc.data()?.status !== "active") {
            creatorIsInactive = true;
          }
        } else if (!isCreator && !userData?.createdBy) {
          creatorIsInactive = true;
        }

        const targetDeptIds = [
          userData?.homeDepartmentId,
          ...(userData?.temporaryDepartmentIds || []),
        ].filter(Boolean);

        const hasDeptIntersection = targetDeptIds.some((id) => allowedDeptIds.includes(id));

        if (!isCreator && (!creatorIsInactive || !hasDeptIntersection)) {
          throw new HttpsError(
            "permission-denied",
            "You do not have permission to change this user's role."
          );
        }
      }

      // 6. Update Firebase Auth Custom Claims
      const userRecord = await admin.auth().getUser(targetUid);
      const currentClaims = userRecord.customClaims || {};

      await admin.auth().setCustomUserClaims(targetUid, {
        ...currentClaims,
        role: newRole,
      });

      // 7. Revoke Refresh Tokens for Instant Reactive Refresh
      await admin.auth().revokeRefreshTokens(targetUid);

      // 8. Update Firestore Document
      await userRef.update({
        role: newRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: `User role successfully updated from ${currentRole} to ${newRole}.`,
      };
    } catch (error: any) {
      console.error("Error changing user role:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError(
        "internal",
        "An error occurred while updating the user role."
      );
    }
  }
);
