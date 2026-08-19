import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Deletes a ticket document.
 * Callable by Admin (or Manager for backward compatibility).
 */
export const deleteTicket = onCall(
  {region: "asia-south1"},
  async (request) => {
    // 1. Validate Caller
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be logged in to delete tickets."
      );
    }

    const callerRole = request.auth.token.role;
    if (callerRole !== "manager" && callerRole !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "Only managers or admins can delete tickets."
      );
    }

    const {ticketId} = request.data;
    if (!ticketId) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required field: ticketId."
      );
    }

    const db = admin.firestore();

    try {
      // 2. Fetch Ticket & Ownership Check
      const ticketDoc = await db.collection("tickets").doc(ticketId).get();
      if (!ticketDoc.exists) {
        throw new HttpsError("not-found", "Ticket not found.");
      }

      const ticketData = ticketDoc.data();
      const assignedById = ticketData?.assignedById;

      if (callerRole === "manager" && assignedById && assignedById !== request.auth.uid) {
        // Fetch creator's status
        const creatorDoc = await db.collection("users").doc(assignedById).get();
        if (creatorDoc.exists) {
          const creatorStatus = creatorDoc.data()?.status;
          if (creatorStatus === "active") {
            const creatorName =
              creatorDoc.data()?.name || "the original creating manager";
            throw new HttpsError(
              "permission-denied",
              `Only ${creatorName} can delete this ticket.`
            );
          }
        }
      }

      // 3. Delete Ticket Document & Decrement Department Ticket Count
      const deptId = ticketData?.departmentId;
      const batch = db.batch();
      batch.delete(db.collection("tickets").doc(ticketId));

      if (deptId) {
        batch.update(db.collection("departments").doc(deptId), {
          ticketCount: admin.firestore.FieldValue.increment(-1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();

      return {
        message: "Ticket deleted successfully.",
      };
    } catch (error: unknown) {
      console.error("Error deleting ticket:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError(
        "internal",
        "An error occurred while deleting the ticket."
      );
    }
  }
);
