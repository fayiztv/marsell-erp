import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

const db = getFirestore();

/**
 * Fields that are internal/noisy and should NOT generate history entries.
 * updatedAt changes on every write; denormalized name fields are system-synced.
 */
const SKIP_FIELDS = new Set([
  "updatedAt",
  "assignedToName",
  "assignedByName",
  "clientName",
  "departmentName",
  "isPendingDeletion",
  "deletionRequestId",
]);

/** Human-readable labels for changed field keys */
const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  status: "Status",
  priority: "Priority",
  assignedToId: "Assigned To",
  departmentId: "Department",
  clientId: "Client",
  dueDate: "Due Date",
};

/** Human-readable status values */
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
};

/** Human-readable priority values */
const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "None";
  if (field === "status" && typeof value === "string") {
    return STATUS_LABELS[value] ?? value;
  }
  if (field === "priority" && typeof value === "string") {
    return PRIORITY_LABELS[value] ?? value;
  }
  if (typeof value === "string") return value;
  return String(value);
}

async function writeHistoryEntry(
  ticketId: string,
  entry: {
    action: string;
    actorUid: string;
    actorName: string;
    details: string;
  }
) {
  await db
    .collection("tickets")
    .doc(ticketId)
    .collection("history")
    .add({
      ...entry,
      timestamp: FieldValue.serverTimestamp(),
    });
}

// ── Trigger 1: Ticket Created ─────────────────────────────────────────────────

export const onTicketCreatedHistory = onDocumentCreated(
  "tickets/{ticketId}",
  async (event) => {
    const ticketId = event.params.ticketId;
    const data = event.data?.data();
    if (!data) return;

    const actorUid: string = data.createdBy ?? data.assignedById ?? "unknown";
    const actorName: string = data.assignedByName ?? "Unknown";

    try {
      await writeHistoryEntry(ticketId, {
        action: "ticket_created",
        actorUid,
        actorName,
        details: `Ticket created and assigned to ${data.assignedToName ?? "Unknown"}.`,
      });
    } catch (err) {
      console.error(`[onTicketCreated] Error writing history for ${ticketId}:`, err);
    }
  }
);

// ── Trigger 2: Ticket Updated ─────────────────────────────────────────────────

export const onTicketUpdatedHistory = onDocumentUpdated(
  "tickets/{ticketId}",
  async (event) => {
    const ticketId = event.params.ticketId;
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Determine who made the change (stored in updatedAt context is not available,
    // so we rely on assignedToId for status-only updates, otherwise assignedByName
    // as a proxy for the last manager/admin who touched it).
    // For full attribution, clients write actorUid/actorName into the doc —
    // check for those optional fields first, then fall back gracefully.
    const actorUid: string = after.lastUpdatedByUid ?? after.assignedById ?? "unknown";
    const actorName: string = after.lastUpdatedByName ?? after.assignedByName ?? "Unknown";

    const entries: { action: string; details: string }[] = [];

    for (const key of Object.keys(after)) {
      if (SKIP_FIELDS.has(key)) continue;
      if (before[key] === after[key]) continue;
      // Deep equality for Timestamps
      if (
        before[key] &&
        after[key] &&
        typeof before[key].toMillis === "function" &&
        typeof after[key].toMillis === "function" &&
        before[key].toMillis() === after[key].toMillis()
      ) {
        continue;
      }

      const label = FIELD_LABELS[key] ?? key;
      const oldVal = formatValue(key, before[key]);
      const newVal = formatValue(key, after[key]);

      // For structured fields include old→new; for prose fields (title, description) just note the change.
      if (key === "title" || key === "description") {
        entries.push({
          action: `field_updated`,
          details: `${label} updated.`,
        });
      } else if (key === "assignedToId") {
        entries.push({
          action: "reassigned",
          details: `Assigned To changed from ${before.assignedToName ?? oldVal} to ${after.assignedToName ?? newVal}.`,
        });
      } else {
        entries.push({
          action: "field_updated",
          details: `${label} changed from "${oldVal}" to "${newVal}".`,
        });
      }
    }

    if (entries.length === 0) return;

    try {
      const historyRef = db.collection("tickets").doc(ticketId).collection("history");
      const batch = db.batch();
      for (const entry of entries) {
        batch.set(historyRef.doc(), {
          ...entry,
          actorUid,
          actorName,
          timestamp: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    } catch (err) {
      console.error(`[onTicketUpdated] Error writing history for ${ticketId}:`, err);
    }
  }
);
