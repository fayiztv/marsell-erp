import {onDocumentCreated, onDocumentUpdated, onDocumentDeleted} from "firebase-functions/v2/firestore";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

function extractDepartmentIds(data: any): string[] {
  if (!data) return [];
  if (Array.isArray(data.departmentIds) && data.departmentIds.length > 0) {
    return data.departmentIds;
  }
  if (data.departmentId) {
    return [data.departmentId];
  }
  return [];
}

/**
 * Trigger when a ticket is created.
 * Increments ticketCount for ALL assigned departments.
 */
export const onTicketCreated = onDocumentCreated(
  "tickets/{ticketId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const deptIds = extractDepartmentIds(data);
    if (deptIds.length === 0) return;

    const db = getFirestore();
    const batch = db.batch();

    deptIds.forEach((deptId) => {
      const deptRef = db.collection("departments").doc(deptId);
      batch.update(deptRef, {
        ticketCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    try {
      await batch.commit();
      console.log(`Incremented ticketCount for departments [${deptIds.join(", ")}] on ticket creation.`);
    } catch (error) {
      console.error(`Error incrementing ticketCount for departments [${deptIds.join(", ")}]:`, error);
    }
  }
);

/**
 * Trigger when a ticket is updated.
 * Diffs departmentIds and adjusts ticketCount on removed and added departments.
 */
export const onTicketDepartmentUpdated = onDocumentUpdated(
  "tickets/{ticketId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    const beforeDepts = extractDepartmentIds(before);
    const afterDepts = extractDepartmentIds(after);

    const removedDepts = beforeDepts.filter((id) => !afterDepts.includes(id));
    const addedDepts = afterDepts.filter((id) => !beforeDepts.includes(id));

    if (removedDepts.length === 0 && addedDepts.length === 0) return;

    const db = getFirestore();
    const batch = db.batch();

    removedDepts.forEach((deptId) => {
      const deptRef = db.collection("departments").doc(deptId);
      batch.update(deptRef, {
        ticketCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    addedDepts.forEach((deptId) => {
      const deptRef = db.collection("departments").doc(deptId);
      batch.update(deptRef, {
        ticketCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    try {
      await batch.commit();
      console.log(`Updated ticketCounts for ticket ${event.params.ticketId}: removed [${removedDepts.join(", ")}], added [${addedDepts.join(", ")}].`);
    } catch (error) {
      console.error("Error updating ticketCounts on ticket department update:", error);
    }
  }
);

/**
 * Trigger when a ticket is deleted.
 * Decrements ticketCount for ALL assigned departments.
 * This is the SINGLE AUTHORITATIVE mechanism for deletion decrements.
 */
export const onTicketDeleted = onDocumentDeleted(
  "tickets/{ticketId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const deptIds = extractDepartmentIds(data);
    if (deptIds.length === 0) return;

    const db = getFirestore();
    const batch = db.batch();

    deptIds.forEach((deptId) => {
      const deptRef = db.collection("departments").doc(deptId);
      batch.update(deptRef, {
        ticketCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    try {
      await batch.commit();
      console.log(`Decremented ticketCount for departments [${deptIds.join(", ")}] on ticket ${event.params.ticketId} deletion.`);
    } catch (error) {
      console.error(`Error decrementing ticketCount for departments [${deptIds.join(", ")}]:`, error);
    }
  }
);
