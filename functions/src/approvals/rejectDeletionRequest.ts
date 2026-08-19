import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Rejects a pending deletion request (Admin only).
 * Unlocks the target entity and marks the request as rejected.
 */
export const rejectDeletionRequest = onCall(
  {region: "asia-south1"},
  async (request) => {
    // 1. Validate Admin Caller
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be logged in to review deletion requests."
      );
    }

    if (request.auth.token.role !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "Only Admins can reject deletion requests."
      );
    }

    const {requestId} = request.data;
    if (!requestId) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required field: requestId."
      );
    }

    const db = admin.firestore();

    try {
      // 2. Fetch Deletion Request
      const requestRef = db.collection("deletionRequests").doc(requestId);
      const requestDoc = await requestRef.get();
      if (!requestDoc.exists) {
        throw new HttpsError("not-found", "Deletion request not found.");
      }

      const requestData = requestDoc.data();
      if (requestData?.status !== "pending") {
        throw new HttpsError(
          "failed-precondition",
          `This request has already been ${requestData?.status}.`
        );
      }

      const {entityType, entityId} = requestData;

      // 3. Admin Profile for Audit Log
      const adminDoc = await db.collection("users").doc(request.auth.uid).get();
      const adminName = adminDoc.data()?.name || request.auth.token.name || request.auth.token.email || "Admin";

      // 4. Unlock Target Entity Collection
      let collectionName = "tickets";
      if (entityType === "employee") {
        collectionName = "users";
      } else if (entityType === "client") {
        collectionName = "clients";
      }

      const targetDocRef = db.collection(collectionName).doc(entityId);
      const targetDoc = await targetDocRef.get();

      const batch = db.batch();

      if (targetDoc.exists) {
        batch.update(targetDocRef, {
          isPendingDeletion: false,
          deletionRequestId: null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      batch.update(requestRef, {
        status: "rejected",
        reviewedByUid: request.auth.uid,
        reviewedByName: adminName,
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      return {
        message: `Deletion request for ${entityType} rejected. Entity unlocked.`,
      };
    } catch (error: any) {
      console.error("Error rejecting deletion request:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError(
        "internal",
        "An error occurred while rejecting the deletion request."
      );
    }
  }
);
