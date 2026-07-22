import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {getFirestore} from "firebase-admin/firestore";

export const syncUserName = onDocumentUpdated(
  "users/{userId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    // If the user name hasn't changed, we don't need to do anything
    if (before.name === after.name) return;

    const newName = after.name;
    const userId = event.params.userId;
    const db = getFirestore();

    try {
      const batch = db.batch();

      // 1. Update tickets where this user is the assigned employee
      const assignedToSnapshot = await db
        .collection("tickets")
        .where("assignedToId", "==", userId)
        .get();

      assignedToSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {assignedToName: newName});
      });

      // 2. Update tickets where this user is the one who created/assigned it
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
        console.log(
          `Synced new user name '${newName}' ` +
        `to ${totalUpdated} tickets.`
        );
      }
    } catch (error) {
      console.error(`Error syncing user name for ${userId}:`, error);
    }
  });
