import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";

export const syncUserName = onDocumentUpdated(
  "users/{userId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    const userId = event.params.userId;
    const db = getFirestore();

    try {
      // 1. Sync User Name Across Tickets if name changed
      if (before.name !== after.name) {
        const newName = after.name;
        const batch = db.batch();

        const assignedToSnapshot = await db
          .collection("tickets")
          .where("assignedToId", "==", userId)
          .get();

        assignedToSnapshot.docs.forEach((doc) => {
          batch.update(doc.ref, {assignedToName: newName});
        });

        const assignedBySnapshot = await db
          .collection("tickets")
          .where("assignedById", "==", userId)
          .get();

        assignedBySnapshot.docs.forEach((doc) => {
          batch.update(doc.ref, {assignedByName: newName});
        });

        const totalUpdated = assignedToSnapshot.size + assignedBySnapshot.size;
        if (totalUpdated > 0) {
          await batch.commit();
          console.log(`Synced new user name '${newName}' to ${totalUpdated} tickets.`);
        }
      }

      // 2. Adjust Department Employee Counters if homeDepartmentId changed
      if (before.homeDepartmentId !== after.homeDepartmentId) {
        const oldDeptId = before.homeDepartmentId;
        const newDeptId = after.homeDepartmentId;
        const batch = db.batch();

        if (oldDeptId) {
          const oldDeptRef = db.collection("departments").doc(oldDeptId);
          batch.update(oldDeptRef, {
            employeeCount: FieldValue.increment(-1),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        if (newDeptId) {
          const newDeptRef = db.collection("departments").doc(newDeptId);
          batch.update(newDeptRef, {
            employeeCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        await batch.commit();
        console.log(`Updated employeeCount: moved user ${userId} from '${oldDeptId}' to '${newDeptId}'.`);

        // Refresh Custom Claims homeDeptId
        try {
          const auth = getAuth();
          const authUser = await auth.getUser(userId);
          const existingClaims = authUser.customClaims || {};
          await auth.setCustomUserClaims(userId, {
            ...existingClaims,
            homeDeptId: newDeptId || null,
          });
        } catch (authErr) {
          console.error(`Error syncing claims for user ${userId}:`, authErr);
        }
      }
    } catch (error) {
      console.error(`Error in syncUserName trigger for ${userId}:`, error);
    }
  }
);
