import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Changes a user's home department.
 * - Admin only.
 * - Also accepts optional `name` and `phone` to allow atomic updates of profile + department from the UI.
 * - Updates Custom Claims (`homeDeptId`) and Firestore user document.
 * - Updates department employee counts (decrements old, increments new).
 */
export const changeHomeDepartment = onCall(
  {region: "asia-south1"},
  async (request) => {
    // 1. Validate Caller Authentication & Authorization
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }
    if (request.auth.token.role !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "Only Admins can change a user's home department."
      );
    }

    // 2. Validate Payload
    const {targetUid, homeDepartmentId, name, phone} = request.data;

    if (!targetUid || !homeDepartmentId) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: targetUid, homeDepartmentId."
      );
    }

    const db = admin.firestore();

    try {
      // 3. Fetch Target User Data
      const userRef = db.collection("users").doc(targetUid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new HttpsError("not-found", "Target user not found.");
      }

      const userData = userDoc.data();
      const currentHomeDeptId = userData?.homeDepartmentId;

      // If the home department isn't actually changing, we can just update the standard fields
      const isDeptChanging = currentHomeDeptId !== homeDepartmentId;

      // 4. Validate New Department (if changing)
      let targetDeptName = "";
      if (isDeptChanging) {
        const deptDoc = await db.collection("departments").doc(homeDepartmentId).get();
        if (!deptDoc.exists) {
          throw new HttpsError("not-found", "New assigned department not found.");
        }
        const deptData = deptDoc.data();
        if (deptData?.status === "archived") {
          throw new HttpsError(
            "failed-precondition",
            "Cannot assign users to an archived department."
          );
        }
        targetDeptName = deptData?.name || "";
      }

      // 5. Update Firebase Auth Custom Claims (if changing)
      if (isDeptChanging) {
        const userRecord = await admin.auth().getUser(targetUid);
        const currentClaims = userRecord.customClaims || {};
        const tempIds = userData?.temporaryDepartmentIds || [];
        const newTempIds = currentHomeDeptId && !tempIds.includes(currentHomeDeptId) ?
          [...tempIds, currentHomeDeptId] :
          tempIds;

        await admin.auth().setCustomUserClaims(targetUid, {
          ...currentClaims,
          homeDeptId: homeDepartmentId,
          tempDeptIds: newTempIds,
        });
      }

      // 6. Firestore Batch Update
      const batch = db.batch();

      // Update User Document
      const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone || null;
      if (isDeptChanging) {
        updateData.homeDepartmentId = homeDepartmentId;
        updateData.homeDepartmentName = targetDeptName;

        // The old department becomes a temporary department
        if (currentHomeDeptId) {
          const tempIds = userData?.temporaryDepartmentIds || [];
          if (!tempIds.includes(currentHomeDeptId)) {
            updateData.temporaryDepartmentIds = [...tempIds, currentHomeDeptId];
          }
        }
      }
      batch.update(userRef, updateData);

      // Update Department Counts
      if (isDeptChanging) {
        // Increment new department
        const newDeptRef = db.collection("departments").doc(homeDepartmentId);
        batch.update(newDeptRef, {
          employeeCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Decrement old department if it exists
        if (currentHomeDeptId) {
          const oldDeptRef = db.collection("departments").doc(currentHomeDeptId);
          batch.update(oldDeptRef, {
            employeeCount: admin.firestore.FieldValue.increment(-1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      await batch.commit();

      return {
        message: "User profile updated successfully.",
      };
    } catch (error: any) {
      console.error("Error in changeHomeDepartment:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError(
        "internal",
        "An error occurred while updating the user profile."
      );
    }
  }
);
