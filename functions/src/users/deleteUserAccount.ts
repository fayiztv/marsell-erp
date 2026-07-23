import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Deletes a user account (Auth + Firestore).
 * Restricted to authenticated users with the 'manager' role claim.
 * Enforces business rules: cannot delete self, cannot delete if tickets reference the user,
 * and only the creating manager (or any manager if creator is inactive) can delete.
 */
export const deleteUserAccount = functions.https.onCall(
  async (data, context) => {
    // 1. Validate Caller
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to delete users."
      );
    }

    const callerRole = context.auth.token.role;
    if (callerRole !== "manager") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only managers can delete users."
      );
    }

    const {uid} = data;
    if (!uid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required field: uid."
      );
    }

    if (uid === context.auth.uid) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You cannot delete your own account."
      );
    }

    const db = admin.firestore();

    try {
      // 2. Check Ticket History
      const assignedToSnap = await db.collection("tickets")
        .where("assignedToId", "==", uid)
        .limit(1)
        .get();

      const assignedBySnap = await db.collection("tickets")
        .where("assignedById", "==", uid)
        .limit(1)
        .get();

      if (!assignedToSnap.empty || !assignedBySnap.empty) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "This employee has ticket history."
        );
      }

      // 3. Ownership Check
      const targetUserDoc = await db.collection("users").doc(uid).get();
      if (!targetUserDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found.");
      }

      const targetUserData = targetUserDoc.data();
      const createdByUid = targetUserData?.createdBy;

      if (createdByUid && createdByUid !== context.auth.uid) {
        // Fetch creator's status
        const creatorDoc = await db.collection("users").doc(createdByUid).get();
        if (creatorDoc.exists) {
          const creatorStatus = creatorDoc.data()?.status;
          if (creatorStatus === "active") {
            const creatorName = creatorDoc.data()?.name || "the original creating manager";
            throw new functions.https.HttpsError(
              "permission-denied",
              `Only ${creatorName} can delete this employee.`
            );
          }
        }
      }

      // 4. Delete Auth User and Firestore Document
      await admin.auth().deleteUser(uid);
      await db.collection("users").doc(uid).delete();

      return {
        message: "User deleted successfully.",
      };
    } catch (error: any) {
      console.error("Error deleting user account:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "An error occurred while deleting the user account."
      );
    }
  }
);
