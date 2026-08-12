import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Grants temporary department access to a user (Admin only).
 * Updates Firestore user doc and synchronizes custom claims (tempDeptIds).
 */
export const grantTemporaryDepartmentAccess = onCall(
  { region: "asia-south1" },
  async (request) => {
    // 1. Validate Admin Caller
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be logged in to grant department access."
      );
    }

    if (request.auth.token.role !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "Only Admins can grant temporary department access."
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
      // 2. Verify Department Exists & Is Active
      const deptDoc = await db.collection("departments").doc(departmentId).get();
      if (!deptDoc.exists) {
        throw new HttpsError("not-found", "Department not found.");
      }

      const deptData = deptDoc.data();
      if (deptData?.status === "archived") {
        throw new HttpsError(
          "failed-precondition",
          "Cannot grant access to an archived department."
        );
      }

      // 3. Fetch Target User
      const userDoc = await db.collection("users").doc(targetUid).get();
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "Target user not found.");
      }

      const userData = userDoc.data();
      const currentTempDepts: string[] = userData?.temporaryDepartmentIds || [];

      // Avoid duplicate department ID in array
      const updatedTempDepts = Array.from(new Set([...currentTempDepts, departmentId]));

      // 4. Update Firestore Document
      await db.collection("users").doc(targetUid).update({
        temporaryDepartmentIds: updatedTempDepts,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 5. Refresh Target User's Custom Claims
      const authUser = await authAdmin.getUser(targetUid);
      const existingClaims = authUser.customClaims || {};

      await authAdmin.setCustomUserClaims(targetUid, {
        ...existingClaims,
        role: existingClaims.role || userData?.role || "employee",
        homeDeptId: existingClaims.homeDeptId || userData?.homeDepartmentId || null,
        tempDeptIds: updatedTempDepts,
      });

      // 6. Revoke refresh tokens to force immediate client-side token refresh (with onSnapshot listener)
      await authAdmin.revokeRefreshTokens(targetUid);

      return {
        message: `Granted temporary access to department '${deptData?.name || departmentId}'.`,
        temporaryDepartmentIds: updatedTempDepts,
      };
    } catch (error: any) {
      console.error("Error granting temporary department access:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError(
        "internal",
        "An error occurred while granting department access."
      );
    }
  }
);
