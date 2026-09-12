import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";

// Note: employeeCount adjustments for department reassignment are handled HERE ONLY
// (in syncUserName's trigger), not in changeHomeDepartment or any other function that
// changes homeDepartmentId. If you ever add an onDocumentCreated or onDocumentDeleted
// handler to this or a related trigger, DO NOT duplicate counter logic there too —
// this exact bug (double-counting from two systems reacting to the same event) has
// happened once already.
export const syncUserName = onDocumentUpdated(
  "users/{userId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    const userId = event.params.userId;
    const db = getFirestore();

    try {
      // 1. Sync User Name & Role Across Tickets if name or role changed
      if (before.name !== after.name || before.role !== after.role) {
        const newName = after.name;
        const newRole = after.role;

        const [assignedToArraySnap, assignedToLegacySnap, assignedBySnap] = await Promise.all([
          db.collection("tickets").where("assignedToIds", "array-contains", userId).get(),
          db.collection("tickets").where("assignedToId", "==", userId).get(),
          db.collection("tickets").where("assignedById", "==", userId).get(),
        ]);

        const ticketUpdates = new Map<string, { ref: FirebaseFirestore.DocumentReference; data: any }>();

        // Process assignees
        [...assignedToArraySnap.docs, ...assignedToLegacySnap.docs].forEach((docSnap) => {
          const tData = docSnap.data();
          const docUpdate: any = {};

          if (before.name !== after.name) {
            docUpdate.assignedToName = newName;
          }

          if (Array.isArray(tData.assignees)) {
            docUpdate.assignees = tData.assignees.map((a: any) =>
              a.uid === userId ? { ...a, name: newName, role: newRole || a.role } : a
            );
          }

          ticketUpdates.set(docSnap.id, { ref: docSnap.ref, data: docUpdate });
        });

        // Process assignedBy (creator)
        if (before.name !== after.name) {
          assignedBySnap.docs.forEach((docSnap) => {
            const existing = ticketUpdates.get(docSnap.id);
            if (existing) {
              existing.data.assignedByName = newName;
            } else {
              ticketUpdates.set(docSnap.id, { ref: docSnap.ref, data: { assignedByName: newName } });
            }
          });
        }

        // Commit in batches of 400
        const allUpdates = Array.from(ticketUpdates.values());
        const BATCH_SIZE = 400;
        for (let i = 0; i < allUpdates.length; i += BATCH_SIZE) {
          const batch = db.batch();
          const chunk = allUpdates.slice(i, i + BATCH_SIZE);
          chunk.forEach(({ ref, data }) => batch.update(ref, data));
          await batch.commit();
        }

        if (allUpdates.length > 0) {
          console.log(`Synced user profile update (name: '${newName}', role: '${newRole}') to ${allUpdates.length} tickets.`);
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
