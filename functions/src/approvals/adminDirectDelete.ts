import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {executeUserDeletion} from "../users/deleteUserAccount";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Direct hard-delete for Admin, bypassing the deletion requests queue.
 * Applies the same relational integrity guards for Clients (no tickets) and Employees (no active tickets).
 */
export const adminDirectDelete = onCall(
  {region: "asia-south1"},
  async (request) => {
    // 1. Validate Admin Caller
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be logged in to delete entities."
      );
    }

    if (request.auth.token.role !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "Direct deletion is restricted to Admins only."
      );
    }

    const {entityType, entityId} = request.data;
    if (!entityType || !entityId) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: entityType, entityId."
      );
    }

    if (!["employee", "ticket", "client"].includes(entityType)) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid entityType provided."
      );
    }

    const db = admin.firestore();
    const authAdmin = admin.auth();

    try {
      if (entityType === "ticket") {
        const ticketDoc = await db.collection("tickets").doc(entityId).get();
        if (!ticketDoc.exists) {
          throw new HttpsError("not-found", "Ticket not found.");
        }

        const ticketData = ticketDoc.data();
        const deptId = ticketData?.departmentId;
        const deletionRequestId = ticketData?.deletionRequestId;

        const batch = db.batch();
        batch.delete(db.collection("tickets").doc(entityId));

        if (deptId) {
          batch.update(db.collection("departments").doc(deptId), {
            ticketCount: admin.firestore.FieldValue.increment(-1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Clean up linked deletion request if one existed
        if (deletionRequestId) {
          batch.update(db.collection("deletionRequests").doc(deletionRequestId), {
            status: "approved",
            reviewedByUid: request.auth.uid,
            reviewedByName: "Admin",
            reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        await batch.commit();
      } else if (entityType === "client") {
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

        const clientDoc = await db.collection("clients").doc(entityId).get();
        const clientData = clientDoc.data();
        const deletionRequestId = clientData?.deletionRequestId;

        const batch = db.batch();
        batch.delete(db.collection("clients").doc(entityId));

        if (deletionRequestId) {
          batch.update(db.collection("deletionRequests").doc(deletionRequestId), {
            status: "approved",
            reviewedByUid: request.auth.uid,
            reviewedByName: "Admin",
            reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        await batch.commit();
      } else if (entityType === "employee") {
        if (entityId === request.auth.uid) {
          throw new HttpsError(
            "permission-denied",
            "You cannot delete your own account."
          );
        }

        const userDoc = await db.collection("users").doc(entityId).get();
        const userData = userDoc.data();
        const deletionRequestId = userData?.deletionRequestId;

        // Guard & Execution: executeUserDeletion checks active tickets, deletes Auth + Firestore doc, and decrements department employeeCount
        const batch = db.batch();
        await executeUserDeletion(entityId, db, authAdmin, batch);

        if (deletionRequestId) {
          batch.update(db.collection("deletionRequests").doc(deletionRequestId), {
            status: "approved",
            reviewedByUid: request.auth.uid,
            reviewedByName: "Admin",
            reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        await batch.commit();
      }

      return {
        message: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} deleted successfully.`,
      };
    } catch (error: any) {
      console.error("Error during admin direct delete:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError(
        "internal",
        "An error occurred during direct deletion."
      );
    }
  }
);
