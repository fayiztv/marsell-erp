import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Revokes temporary department access from a user (Admin only).
 * Updates Firestore user doc and synchronizes custom claims (tempDeptIds).
 * Note: Per specifications, existing tickets are NOT touched.
 */
export const revokeTemporaryDepartmentAccess = onCall(
  {region: "asia-south1"},
  async (request) => {
    // 1. Validate Admin Caller
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be logged in to revoke department access."
      );
    }

    if (request.auth.token.role !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "Only Admins can revoke temporary department access."
      );
    }

    const {targetUid, departmentId} = request.data;
    if (!targetUid || !departmentId) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: targetUid, departmentId."
      );
    }

    const db = admin.firestore();
    const authAdmin = admin.auth();

    try {
      // 2. Fetch Target User
      const userDoc = await db.collection("users").doc(targetUid).get();
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "Target user not found.");
      }

      const userData = userDoc.data();
      const currentTempDepts: string[] = userData?.temporaryDepartmentIds || [];

      // Filter out the revoked department ID
      const updatedTempDepts = currentTempDepts.filter((id) => id !== departmentId);

      // 3. Update Firestore Document
      await db.collection("users").doc(targetUid).update({
        temporaryDepartmentIds: updatedTempDepts,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 4. Refresh Target User's Custom Claims
      const authUser = await authAdmin.getUser(targetUid);
      const existingClaims = authUser.customClaims || {};

      await authAdmin.setCustomUserClaims(targetUid, {
        ...existingClaims,
        role: existingClaims.role || userData?.role || "employee",
        homeDeptId: existingClaims.homeDeptId || userData?.homeDepartmentId || null,
        tempDeptIds: updatedTempDepts,
      });

      // 5. Revoke refresh tokens to force immediate client-side token refresh
      await authAdmin.revokeRefreshTokens(targetUid);

      return {
        message: `Revoked temporary access to department '${departmentId}'.`,
        temporaryDepartmentIds: updatedTempDepts,
      };
    } catch (error: any) {
      console.error("Error revoking temporary department access:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError(
        "internal",
        "An error occurred while revoking department access."
      );
    }
  }
);
