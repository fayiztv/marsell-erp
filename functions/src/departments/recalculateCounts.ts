import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Admin-only callable function to manually recalculate department employee and ticket counts.
 * Queries actual users and tickets assigned to each department and updates the counters.
 */
export const recalculateCounts = onCall(
  {region: "asia-south1", timeoutSeconds: 300},
  async (request) => {
    // 1. Validate Caller Authentication & Admin Role
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be logged in to recalculate counts."
      );
    }

    const callerRole = request.auth.token.role;
    if (callerRole !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "Only Admins can perform bulk reconciliation tasks."
      );
    }

    const db = admin.firestore();

    try {
      const deptsSnapshot = await db.collection("departments").get();

      if (deptsSnapshot.empty) {
        return {message: "No departments found."};
      }

      let totalUpdated = 0;
      const batch = db.batch();
      let batchCount = 0;

      for (const deptDoc of deptsSnapshot.docs) {
        const deptId = deptDoc.id;
        const deptData = deptDoc.data();

        // Compute actual employee count
        const usersSnap = await db.collection("users")
          .where("homeDepartmentId", "==", deptId)
          .get();

        // Compute actual ticket count
        const ticketsSnap = await db.collection("tickets")
          .where("departmentId", "==", deptId)
          .get();

        const actualEmployeeCount = usersSnap.size;
        const actualTicketCount = ticketsSnap.size;

        const oldEmployeeCount = deptData.employeeCount || 0;
        const oldTicketCount = deptData.ticketCount || 0;

        let needsUpdate = false;
        const updates: any = {};

        if (actualEmployeeCount !== oldEmployeeCount) {
          updates.employeeCount = actualEmployeeCount;
          needsUpdate = true;
        }

        if (actualTicketCount !== oldTicketCount) {
          updates.ticketCount = actualTicketCount;
          needsUpdate = true;
        }

        if (needsUpdate) {
          updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
          batch.update(deptDoc.ref, updates);
          totalUpdated++;
          batchCount++;

          // Commit if approaching Firestore batch limit (500)
          if (batchCount === 400) {
            await batch.commit();
            batchCount = 0;
          }
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      return {
        message: `Reconciliation complete. Updated ${totalUpdated} department(s).`,
        totalUpdated,
      };
    } catch (error: any) {
      console.error("Error recalculating counts:", error);
      throw new HttpsError(
        "internal",
        "An error occurred while recalculating department counts."
      );
    }
  }
);
