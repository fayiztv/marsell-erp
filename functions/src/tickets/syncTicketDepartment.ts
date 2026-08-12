import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

/**
 * Trigger when a ticket is created.
 * Increments the assigned department's ticketCount.
 */
export const onTicketCreated = onDocumentCreated(
  "tickets/{ticketId}",
  async (event) => {
    const data = event.data?.data();
    if (!data || !data.departmentId) return;

    const db = getFirestore();
    const deptRef = db.collection("departments").doc(data.departmentId);

    try {
      await deptRef.update({
        ticketCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`Incremented ticketCount for department '${data.departmentId}' on ticket creation.`);
    } catch (error) {
      console.error(`Error incrementing ticketCount for department '${data.departmentId}':`, error);
    }
  }
);

/**
 * Trigger when a ticket is updated.
 * If departmentId has changed, adjusts ticketCount on both old and new departments.
 */
export const onTicketDepartmentUpdated = onDocumentUpdated(
  "tickets/{ticketId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    if (before.departmentId === after.departmentId) return;

    const oldDeptId = before.departmentId;
    const newDeptId = after.departmentId;
    const db = getFirestore();
    const batch = db.batch();

    try {
      if (oldDeptId) {
        const oldDeptRef = db.collection("departments").doc(oldDeptId);
        batch.update(oldDeptRef, {
          ticketCount: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      if (newDeptId) {
        const newDeptRef = db.collection("departments").doc(newDeptId);
        batch.update(newDeptRef, {
          ticketCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
      console.log(`Reassigned ticket ${event.params.ticketId}: decremented '${oldDeptId}', incremented '${newDeptId}'.`);
    } catch (error) {
      console.error(`Error updating ticketCounts on ticket reassignment:`, error);
    }
  }
);
