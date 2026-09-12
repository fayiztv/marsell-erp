import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {getFirestore} from "firebase-admin/firestore";

export const syncDepartmentName = onDocumentUpdated(
  "departments/{departmentId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    const departmentId = event.params.departmentId;
    const db = getFirestore();

    try {
      if (before.name !== after.name) {
        const newName = after.name;

        let totalUsersUpdated = 0;
        let totalTicketsUpdated = 0;

        // Query all users where homeDepartmentId matches
        const usersSnapshot = await db
          .collection("users")
          .where("homeDepartmentId", "==", departmentId)
          .get();

        // Query all tickets where departmentId matches (checking both array and legacy field)
        const [ticketsArraySnap, ticketsLegacySnap] = await Promise.all([
          db.collection("tickets").where("departmentIds", "array-contains", departmentId).get(),
          db.collection("tickets").where("departmentId", "==", departmentId).get(),
        ]);

        const uniqueTickets = new Map<string, { ref: FirebaseFirestore.DocumentReference; update: any }>();

        [...ticketsArraySnap.docs, ...ticketsLegacySnap.docs].forEach((docSnap) => {
          const tData = docSnap.data();
          const docUpdate: any = { departmentName: newName };

          if (Array.isArray(tData.departments)) {
            docUpdate.departments = tData.departments.map((d: any) =>
              d.id === departmentId ? { ...d, name: newName } : d
            );
          }

          uniqueTickets.set(docSnap.id, { ref: docSnap.ref, update: docUpdate });
        });

        const allDocs = [
          ...usersSnapshot.docs.map((doc) => ({ ref: doc.ref, update: { homeDepartmentName: newName } })),
          ...Array.from(uniqueTickets.values()),
        ];

        // Process in batches of 400
        const BATCH_SIZE = 400;
        for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
          const batch = db.batch();
          const chunk = allDocs.slice(i, i + BATCH_SIZE);

          chunk.forEach(({ ref, update }) => {
            batch.update(ref, update);
            if ("homeDepartmentName" in update) totalUsersUpdated++;
            if ("departmentName" in update) totalTicketsUpdated++;
          });

          await batch.commit();
        }

        if (totalUsersUpdated > 0 || totalTicketsUpdated > 0) {
          console.log(`Synced new department name '${newName}' to ${totalUsersUpdated} users and ${totalTicketsUpdated} tickets.`);
        }
      }
    } catch (error) {
      console.error(`Error in syncDepartmentName trigger for ${departmentId}:`, error);
    }
  }
);
