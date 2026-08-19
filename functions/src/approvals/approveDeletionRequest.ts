import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {executeUserDeletion} from "../users/deleteUserAccount";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Approves a pending deletion request (Admin only).
 * Performs integrity checks and executes hard-deletion for the target entity.
 */
export const approveDeletionRequest = onCall(
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
        "Only Admins can approve deletion requests."
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
    const authAdmin = admin.auth();

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

      // 4. Branch on Entity Type
      if (entityType === "ticket") {
        const ticketDoc = await db.collection("tickets").doc(entityId).get();
        if (ticketDoc.exists) {
          const ticketData = ticketDoc.data();
          const deptId = ticketData?.departmentId;

          const batch = db.batch();
          batch.delete(db.collection("tickets").doc(entityId));

          if (deptId) {
            batch.update(db.collection("departments").doc(deptId), {
              ticketCount: admin.firestore.FieldValue.increment(-1),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }

          batch.update(requestRef, {
            status: "approved",
            reviewedByUid: request.auth.uid,
            reviewedByName: adminName,
            reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          await batch.commit();
        } else {
          // If ticket already gone, just mark approved
          await requestRef.update({
            status: "approved",
            reviewedByUid: request.auth.uid,
            reviewedByName: adminName,
            reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      } else if (entityType === "client") {
        // Guard: Verify client still exists to prevent ghost approvals on mismatched IDs
        const clientDoc = await db.collection("clients").doc(entityId).get();
        if (!clientDoc.exists) {
          throw new HttpsError("not-found", "The client targeted by this request does not exist or has already been deleted.");
        }

        // Guard: Check for ANY ticket referencing this clientId
        const ticketSnap = await db
          .collection("tickets")
          .where("clientId", "==", entityId)
          .limit(1)
          .get();

        if (!ticketSnap.empty) {
          throw new HttpsError(
            "failed-precondition",
            "This client cannot be deleted because 1 or more tickets reference them. Please reassign or delete those tickets first."
          );
        }

        const batch = db.batch();
        batch.delete(db.collection("clients").doc(entityId));
        batch.update(requestRef, {
          status: "approved",
          reviewedByUid: request.auth.uid,
          reviewedByName: adminName,
          reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await batch.commit();
      } else if (entityType === "employee") {
        const batch = db.batch();
        // Guard & Execution: executeUserDeletion checks active tickets, deletes Auth + Firestore doc, and decrements department employeeCount
        await executeUserDeletion(entityId, db, authAdmin, batch);

        batch.update(requestRef, {
          status: "approved",
          reviewedByUid: request.auth.uid,
          reviewedByName: adminName,
          reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await batch.commit();
      }

      return {
        message: `Deletion request for ${entityType} approved successfully.`,
      };
    } catch (error: any) {
      console.error("Error approving deletion request:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError(
        "internal",
        "An error occurred while approving the deletion request."
      );
    }
  }
);
