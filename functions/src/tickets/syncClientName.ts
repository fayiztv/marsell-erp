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
    // Find all tickets for this client
      const ticketsSnapshot = await db
        .collection("tickets")
        .where("clientId", "==", clientId)
        .get();

      if (ticketsSnapshot.empty) return;

      // Batch update to ensure atomicity
      const batch = db.batch();

      ticketsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {clientName: newCompanyName});
      });

      await batch.commit();
      console.log(
        `Synced new client name '${newCompanyName}' ` +
      `to ${ticketsSnapshot.size} tickets.`
      );
    } catch (error) {
      console.error(`Error syncing client name for ${clientId}:`, error);
    }
  });
