import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Reusable execution helper for user deletion.
 * Validates no active non-completed tickets exist, deletes Auth + Firestore doc, and decrements department employeeCount.
 */
export async function executeUserDeletion(
  uid: string,
  db: FirebaseFirestore.Firestore,
  authAdmin: admin.auth.Auth,
  externalBatch?: FirebaseFirestore.WriteBatch
) {
  // 1. Check for Active / Non-Completed Tickets
  const assignedToSnap = await db
    .collection("tickets")
    .where("assignedToId", "==", uid)
    .get();

  const activeAssignedTickets = assignedToSnap.docs.filter(
    (d) => d.data().status !== "completed"
  );

  if (activeAssignedTickets.length > 0) {
    throw new HttpsError(
      "failed-precondition",
      "This employee has active (non-completed) tickets assigned to them. Please reassign or complete those tickets before deleting."
    );
  }

  // 2. Fetch User Document
  const targetUserDoc = await db.collection("users").doc(uid).get();
  if (!targetUserDoc.exists) {
    throw new HttpsError("not-found", "User not found.");
  }

  const targetUserData = targetUserDoc.data();
  const homeDeptId = targetUserData?.homeDepartmentId;

  // 3. Delete Auth User and Firestore Document
  try {
    await authAdmin.deleteUser(uid);
  } catch (authErr: any) {
    // If user is already deleted from Auth, continue deleting from Firestore
    if (authErr.code !== "auth/user-not-found") {
      console.error(`Error deleting Auth user ${uid}:`, authErr);
    }
  }

  const batch = externalBatch || db.batch();
  batch.delete(db.collection("users").doc(uid));

  if (homeDeptId) {
    const deptRef = db.collection("departments").doc(homeDeptId);
    batch.update(deptRef, {
      employeeCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  if (!externalBatch) {
    await batch.commit();
  }
}

/**
 * Deletes a user account (Auth + Firestore).
 * Callable ONLY by Admin directly. Managers must use requestDeletion.
 */
export const deleteUserAccount = onCall(
  {region: "asia-south1"},
  async (request) => {
    // 1. Validate Caller Authentication
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be logged in to delete users."
      );
    }

    const callerRole = request.auth.token.role;
    if (callerRole !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "Direct user deletion is restricted to Admins. Managers must submit a deletion request."
      );
    }

    const {uid} = request.data;
    if (!uid) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required field: uid."
      );
    }

    if (uid === request.auth.uid) {
      throw new HttpsError(
        "permission-denied",
        "You cannot delete your own admin account."
      );
    }

    const db = admin.firestore();
    const authAdmin = admin.auth();

    try {
      await executeUserDeletion(uid, db, authAdmin);

      return {
        message: "User deleted successfully.",
      };
    } catch (error: any) {
      console.error("Error deleting user account:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError(
        "internal",
        "An error occurred while deleting the user account."
      );
    }
  }
);
