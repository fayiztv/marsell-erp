import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {getFirestore} from "firebase-admin/firestore";

export const syncClientName = onDocumentUpdated(
  "clients/{clientId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    // If the company name hasn't changed, we don't need to do anything
    if (before.companyName === after.companyName) return;

    const newCompanyName = after.companyName;
    const clientId = event.params.clientId;
    const db = getFirestore();

    try {
      // Find all tickets for this client (checking both array and legacy field)
      const [arraySnap, legacySnap] = await Promise.all([
        db.collection("tickets").where("clientIds", "array-contains", clientId).get(),
        db.collection("tickets").where("clientId", "==", clientId).get(),
      ]);

      const uniqueDocs = new Map<string, { ref: FirebaseFirestore.DocumentReference; data: any }>();

      [...arraySnap.docs, ...legacySnap.docs].forEach((docSnap) => {
        const tData = docSnap.data();
        const docUpdate: any = { clientName: newCompanyName };

        if (Array.isArray(tData.clients)) {
          docUpdate.clients = tData.clients.map((c: any) =>
            c.id === clientId ? { ...c, name: newCompanyName } : c
          );
        }

        uniqueDocs.set(docSnap.id, { ref: docSnap.ref, data: docUpdate });
      });

      const allUpdates = Array.from(uniqueDocs.values());
      const BATCH_SIZE = 400;
      for (let i = 0; i < allUpdates.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = allUpdates.slice(i, i + BATCH_SIZE);
        chunk.forEach(({ ref, data }) => batch.update(ref, data));
        await batch.commit();
      }

      if (allUpdates.length > 0) {
        console.log(`Synced new client name '${newCompanyName}' to ${allUpdates.length} tickets.`);
      }
    } catch (error) {
      console.error(`Error syncing client name for ${clientId}:`, error);
    }
  }
);
