import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

const db = getFirestore();

/**
 * Fields that are internal/noisy and should NOT generate history entries.
 * updatedAt changes on every write; denormalized name fields are system-synced.
 */
const SKIP_FIELDS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "createdBy",
  "assignedToName",
  "assignedByName",
  "clientName",
  "departmentName",
  "assignees",
  "clients",
  "departments",
  "isPendingDeletion",
  "deletionRequestId",
  "lastUpdatedByUid",
  "lastUpdatedByName",
  "createdByRole",
]);

/** Human-readable labels for changed field keys */
const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  status: "Status",
  priority: "Priority",
  assignedToId: "Assigned To",
  assignedToIds: "Assignees",
  departmentId: "Department",
  departmentIds: "Departments",
  clientId: "Client",
  clientIds: "Clients",
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

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDateValue(val: unknown): string {
  if (val === null || val === undefined || val === "") return "None";
  let date: Date | null = null;
  if (val instanceof Date) {
    date = val;
  } else if (
    typeof val === "object" &&
    val !== null &&
    "toDate" in val &&
    typeof (val as {toDate: () => unknown}).toDate === "function"
  ) {
    const d = (val as {toDate: () => unknown}).toDate();
    if (d instanceof Date) {
      date = d;
    }
  } else if (
    typeof val === "object" &&
    val !== null &&
    "toMillis" in val &&
    typeof (val as {toMillis: () => unknown}).toMillis === "function"
  ) {
    const ms = (val as {toMillis: () => unknown}).toMillis();
    if (typeof ms === "number") {
      date = new Date(ms);
    }
  } else if (
    typeof val === "object" &&
    val !== null &&
    "_seconds" in val &&
    typeof (val as {_seconds: unknown})._seconds === "number"
  ) {
    date = new Date((val as {_seconds: number})._seconds * 1000);
  } else if (
    typeof val === "object" &&
    val !== null &&
    "seconds" in val &&
    typeof (val as {seconds: unknown}).seconds === "number"
  ) {
    date = new Date((val as {seconds: number}).seconds * 1000);
  } else if (typeof val === "string" || typeof val === "number") {
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      date = parsed;
    }
  }

  if (!date || isNaN(date.getTime())) return "None";
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "None";
  if (field === "status" && typeof value === "string") {
    return STATUS_LABELS[value] ?? value;
  }
  if (field === "priority" && typeof value === "string") {
    return PRIORITY_LABELS[value] ?? value;
  }
  if (
    field === "dueDate" ||
    field === "createdAt" ||
    value instanceof Date ||
    (typeof value === "object" &&
      value !== null &&
      ("toDate" in value || "toMillis" in value || "_seconds" in value || "seconds" in value))
  ) {
    return formatDateValue(value);
  }
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.join(", ");
  return JSON.stringify(value);
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

    const assigneeSummary = Array.isArray(data.assignees) && data.assignees.length > 0
      ? data.assignees.map((a: any) => a.name).join(", ")
      : (data.assignedToName ?? "Unknown");

    try {
      await writeHistoryEntry(ticketId, {
        action: "ticket_created",
        actorUid,
        actorName,
        details: `Ticket created and assigned to ${assigneeSummary}.`,
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

    // Determine who made the change.
    // 1. Check if client stamped lastUpdatedByUid / lastUpdatedByName on the ticket document.
    // 2. If missing, and it was a status change, fall back to assignedToName/assignedToId (the employee assignee).
    // 3. Otherwise, fall back to assignedById / assignedByName (the manager/admin creator) as best available proxy.
    let actorUid: string = after.lastUpdatedByUid ?? "unknown";
    let actorName: string = after.lastUpdatedByName ?? "Unknown";

    if (!after.lastUpdatedByName || actorName === "Unknown") {
      const isStatusOnly =
        before.status !== after.status &&
        Object.keys(after).every((key) => {
          if (SKIP_FIELDS.has(key)) return true;
          if (key === "status") return true;
          return before[key] === after[key];
        });

      if (isStatusOnly) {
        actorUid = after.assignedToId ?? (after.assignedToIds?.[0] ?? actorUid);
        actorName = after.assignedToName ?? (after.assignees?.[0]?.name ?? actorName);
      } else {
        actorUid = after.assignedById ?? actorUid;
        actorName = after.assignedByName ?? actorName;
      }
    }

    const entries: { action: string; details: string }[] = [];

    // Array field changes
    const arrayKeys = ["assignedToIds", "departmentIds", "clientIds"];
    for (const key of arrayKeys) {
      if (key in after || key in before) {
        const beforeArr = Array.isArray(before[key]) ? before[key] : [];
        const afterArr = Array.isArray(after[key]) ? after[key] : [];
        const isDifferent =
          beforeArr.length !== afterArr.length ||
          beforeArr.some((id: string) => !afterArr.includes(id));

        if (isDifferent) {
          if (key === "assignedToIds") {
            const names = Array.isArray(after.assignees)
              ? after.assignees.map((a: any) => a.name).join(", ")
              : afterArr.join(", ");
            entries.push({
              action: "reassigned",
              details: `Assignees updated: ${names || "None"}.`,
            });
          } else if (key === "departmentIds") {
            const names = Array.isArray(after.departments)
              ? after.departments.map((d: any) => d.name).join(", ")
              : afterArr.join(", ");
            entries.push({
              action: "field_updated",
              details: `Departments updated: ${names || "None"}.`,
            });
          } else if (key === "clientIds") {
            const names = Array.isArray(after.clients)
              ? after.clients.map((c: any) => c.name).join(", ")
              : afterArr.join(", ");
            entries.push({
              action: "field_updated",
              details: `Clients updated: ${names || "None"}.`,
            });
          }
        }
      }
    }

    // Scalar field changes
    const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
    for (const key of allKeys) {
      if (SKIP_FIELDS.has(key) || arrayKeys.includes(key)) continue;
      // Skip redundant legacy scalar fields if array fields changed
      if ((key === "assignedToId" && ("assignedToIds" in after)) ||
          (key === "departmentId" && ("departmentIds" in after)) ||
          (key === "clientId" && ("clientIds" in after))) {
        continue;
      }

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

      if (key === "dueDate") {
        console.log(`[ticketHistory diff] dueDate before:`, typeof before[key], before[key], `-> formatted: "${oldVal}"`);
        console.log(`[ticketHistory diff] dueDate after:`, typeof after[key], after[key], `-> formatted: "${newVal}"`);
      }

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
