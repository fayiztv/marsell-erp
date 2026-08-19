import * as admin from "firebase-admin";

import * as path from "path";

// Initialize Firebase Admin with production service account
if (admin.apps.length === 0) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const serviceAccount = require(path.resolve(__dirname, "../../serviceAccountKey.json"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

async function reconcileCounts() {
  console.log("Starting Department Counters Reconciliation...\n");

  const deptsSnapshot = await db.collection("departments").get();

  if (deptsSnapshot.empty) {
    console.log("No departments found.");
    process.exit(0);
  }

  let totalUpdated = 0;
  const batch = db.batch();

  for (const deptDoc of deptsSnapshot.docs) {
    const deptId = deptDoc.id;
    const deptData = deptDoc.data();

    // Compute actual employee count
    const usersSnap = await db.collection("users")
      .where("homeDepartmentId", "==", deptId)
      .get();

    // Compute actual ticket count
    const ticketsSnap = await db.collection("tickets")
      .where("departmentId", "==", deptId)
      .get();

    const actualEmployeeCount = usersSnap.size;
    const actualTicketCount = ticketsSnap.size;

    const oldEmployeeCount = deptData.employeeCount || 0;
    const oldTicketCount = deptData.ticketCount || 0;

    let needsUpdate = false;
    const updates: any = {};

    if (actualEmployeeCount !== oldEmployeeCount) {
      updates.employeeCount = actualEmployeeCount;
      needsUpdate = true;
    }

    if (actualTicketCount !== oldTicketCount) {
      updates.ticketCount = actualTicketCount;
      needsUpdate = true;
    }

    if (needsUpdate) {
      updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      batch.update(deptDoc.ref, updates);
      totalUpdated++;

      console.log(`[${deptData.name || deptId}] Discrepancy Found!`);
      if (actualEmployeeCount !== oldEmployeeCount) {
        console.log(`  Employees: ${oldEmployeeCount} -> ${actualEmployeeCount}`);
      }
      if (actualTicketCount !== oldTicketCount) {
        console.log(`  Tickets:   ${oldTicketCount} -> ${actualTicketCount}`);
      }
    } else {
      console.log(`[${deptData.name || deptId}] OK (Employees: ${actualEmployeeCount}, Tickets: ${actualTicketCount})`);
    }
  }

  if (totalUpdated > 0) {
    console.log(`\nCommitting updates for ${totalUpdated} department(s)...`);
    await batch.commit();
    console.log("Reconciliation complete.");
  } else {
    console.log("\nAll departments are already in sync! No updates required.");
  }
  process.exit(0);
}

reconcileCounts().catch((err) => {
  console.error(err);
  process.exit(1);
});
