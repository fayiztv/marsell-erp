import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Deletes a ticket document.
 * Restricted to authenticated users with the 'manager' role claim.
 * Enforces business rules: only the creating manager
 * (or any manager if creator is inactive) can delete.
 */
export const deleteTicket = functions.https.onCall(
  async (data, context) => {
    // 1. Validate Caller
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to delete tickets."
      );
    }

    const callerRole = context.auth.token.role;
    if (callerRole !== "manager") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only managers can delete tickets."
      );
    }

    const {ticketId} = data;
    if (!ticketId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required field: ticketId."
      );
    }

    const db = admin.firestore();

    try {
      // 2. Fetch Ticket & Ownership Check
      const ticketDoc = await db.collection("tickets").doc(ticketId).get();
      if (!ticketDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Ticket not found.");
      }

      const ticketData = ticketDoc.data();
      const assignedById = ticketData?.assignedById;

      if (assignedById && assignedById !== context.auth.uid) {
        // Fetch creator's status
        const creatorDoc = await db.collection("users").doc(assignedById).get();
        if (creatorDoc.exists) {
          const creatorStatus = creatorDoc.data()?.status;
          if (creatorStatus === "active") {
            const creatorName =
              creatorDoc.data()?.name || "the original creating manager";
            throw new functions.https.HttpsError(
              "permission-denied",
              `Only ${creatorName} can delete this ticket.`
            );
          }
        }
      }

      // 3. Delete Ticket Document
      await db.collection("tickets").doc(ticketId).delete();

      return {
        message: "Ticket deleted successfully.",
      };
    } catch (error: unknown) {
      console.error("Error deleting ticket:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "An error occurred while deleting the ticket."
      );
    }
  }
);
