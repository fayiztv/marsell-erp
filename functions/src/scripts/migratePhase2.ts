/**
 * Phase 2 Migration Script
 *
 * One-time, idempotent migration script to backfill departments, user assignments,
 * ticket department scoping, and Firebase Auth Custom Claims.
 *
 * Usage:
 *   Dry Run (preview changes without writing):
 *     npx ts-node src/scripts/migratePhase2.ts --dry-run
 *
 *   Live Run (apply changes to Firestore & Auth):
 *     npx ts-node src/scripts/migratePhase2.ts
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

const BATCH_SIZE = 400; // Firestore batch limit is 500; 400 provides safe margin
const isDryRun = process.argv.includes("--dry-run");

interface MigrationSummary {
  departmentsCreated: number;
  departmentsUpdated: number;
  usersUpdated: number;
  usersSkipped: number;
  ticketsUpdated: number;
  ticketsSkipped: number;
  claimsUpdated: number;
  claimsSkipped: number;
  activeEmployeeCount: number;
  ticketCount: number;
}

const summary: MigrationSummary = {
  departmentsCreated: 0,
  departmentsUpdated: 0,
  usersUpdated: 0,
  usersSkipped: 0,
  ticketsUpdated: 0,
  ticketsSkipped: 0,
  claimsUpdated: 0,
  claimsSkipped: 0,
  activeEmployeeCount: 0,
  ticketCount: 0,
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runMigration() {
  console.log("====================================================");
  console.log(` Starting Marsell Phase 2 Migration ${isDryRun ? "[DRY RUN - NO WRITES]" : "[LIVE RUN]"}`);
  console.log("====================================================\n");

  // ──────────────────────────────────────────────────────────────────────────
  // Step 1: Ensure Default Department ("dept_general") Exists
  // ──────────────────────────────────────────────────────────────────────────
  console.log(">>> Step 1: Checking default department (dept_general)...");
  const deptRef = db.collection("departments").doc("dept_general");
  const deptDoc = await deptRef.get();

  const deptData = {
    id: "dept_general",
    name: "General Operations",
    code: "GEN",
    description: "Default department for company-wide operations",
    status: "active" as const,
    createdBy: "system",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!deptDoc.exists) {
    console.log("[+] Department dept_general does not exist. Will CREATE.");
    summary.departmentsCreated++;
    if (!isDryRun) {
      await deptRef.set({
        ...deptData,
        employeeCount: 0,
        ticketCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log("    [OK] Created departments/dept_general");
    }
  } else {
    console.log("[=] Department dept_general already exists. Will update counts later.");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 2: Backfill /users Missing homeDepartmentId
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n>>> Step 2: Scanning /users for missing homeDepartmentId...");
  const usersSnapshot = await db.collection("users").get();
  let userBatch = db.batch();
  let userBatchCount = 0;

  const userRolesMap = new Map<string, string>(); // Map UID -> Role for Claims

  for (const docSnap of usersSnapshot.docs) {
    const data = docSnap.data();
    userRolesMap.set(docSnap.id, data.role || "employee");

    const needsBackfill = !data.homeDepartmentId;

    if (needsBackfill) {
      console.log(`[+] User ${docSnap.id} (${data.name || data.email || "No name"}): missing homeDepartmentId -> setting dept_general`);
      summary.usersUpdated++;

      if (!isDryRun) {
        userBatch.update(docSnap.ref, {
          homeDepartmentId: "dept_general",
          homeDepartmentName: "General Operations",
          temporaryDepartmentIds: data.temporaryDepartmentIds || [],
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        userBatchCount++;

        if (userBatchCount >= BATCH_SIZE) {
          await userBatch.commit();
          console.log(`    [COMMIT] Committed batch of ${userBatchCount} users`);
          userBatch = db.batch();
          userBatchCount = 0;
        }
      }
    } else {
      summary.usersSkipped++;
    }

    // Tally active employees/managers for department counters
    const effectiveDept = data.homeDepartmentId || "dept_general";
    if (effectiveDept === "dept_general" && data.status !== "blocked") {
      summary.activeEmployeeCount++;
    }
  }

  if (!isDryRun && userBatchCount > 0) {
    await userBatch.commit();
    console.log(`    [COMMIT] Committed final batch of ${userBatchCount} users`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 3: Backfill /tickets Missing departmentId
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n>>> Step 3: Scanning /tickets for missing departmentId...");
  const ticketsSnapshot = await db.collection("tickets").get();
  let ticketBatch = db.batch();
  let ticketBatchCount = 0;

  for (const docSnap of ticketsSnapshot.docs) {
    const data = docSnap.data();
    const needsBackfill = !data.departmentId;

    if (needsBackfill) {
      console.log(`[+] Ticket ${docSnap.id} ("${data.title || "Untitled"}"): missing departmentId -> setting dept_general`);
      summary.ticketsUpdated++;

      if (!isDryRun) {
        ticketBatch.update(docSnap.ref, {
          departmentId: "dept_general",
          departmentName: "General Operations",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        ticketBatchCount++;

        if (ticketBatchCount >= BATCH_SIZE) {
          await ticketBatch.commit();
          console.log(`    [COMMIT] Committed batch of ${ticketBatchCount} tickets`);
          ticketBatch = db.batch();
          ticketBatchCount = 0;
        }
      }
    } else {
      summary.ticketsSkipped++;
    }

    const effectiveDept = data.departmentId || "dept_general";
    if (effectiveDept === "dept_general") {
      summary.ticketCount++;
    }
  }

  if (!isDryRun && ticketBatchCount > 0) {
    await ticketBatch.commit();
    console.log(`    [COMMIT] Committed final batch of ${ticketBatchCount} tickets`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 4: Update Department Counters (employeeCount & ticketCount)
  // ──────────────────────────────────────────────────────────────────────────
  console.log(`\n>>> Step 4: Updating dept_general counts: employeeCount=${summary.activeEmployeeCount}, ticketCount=${summary.ticketCount}...`);
  if (!isDryRun) {
    await deptRef.update({
      employeeCount: summary.activeEmployeeCount,
      ticketCount: summary.ticketCount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    summary.departmentsUpdated++;
    console.log("    [OK] Updated departments/dept_general with live counts.");
  } else {
    console.log(`    [DRY RUN] Would update dept_general counts to employeeCount=${summary.activeEmployeeCount}, ticketCount=${summary.ticketCount}`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 5: Update Firebase Auth Custom Claims for All Users
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n>>> Step 5: Updating Firebase Auth Custom Claims...");
  let nextPageToken: string | undefined;

  do {
    const listResult = await auth.listUsers(100, nextPageToken);
    for (const authUser of listResult.users) {
      const existingClaims = authUser.customClaims || {};
      const targetRole = existingClaims.role || userRolesMap.get(authUser.uid) || "employee";
      const targetHomeDeptId = existingClaims.homeDeptId || "dept_general";
      const targetTempDeptIds = existingClaims.tempDeptIds || [];

      const claimsAlreadySet =
        existingClaims.role === targetRole &&
        existingClaims.homeDeptId === targetHomeDeptId &&
        Array.isArray(existingClaims.tempDeptIds);

      if (!claimsAlreadySet) {
        console.log(`[+] Auth User ${authUser.uid} (${authUser.email}): setting claims -> role=${targetRole}, homeDeptId=${targetHomeDeptId}, tempDeptIds=[]`);
        summary.claimsUpdated++;

        if (!isDryRun) {
          await auth.setCustomUserClaims(authUser.uid, {
            ...existingClaims,
            role: targetRole,
            homeDeptId: targetHomeDeptId,
            tempDeptIds: targetTempDeptIds,
          });
          // Rate-limiting pause (50ms) between Auth updates
          await sleep(50);
        }
      } else {
        summary.claimsSkipped++;
      }
    }
    nextPageToken = listResult.pageToken;
  } while (nextPageToken);

  // ──────────────────────────────────────────────────────────────────────────
  // Final Summary
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n====================================================");
  console.log(` Marsell Phase 2 Migration Summary ${isDryRun ? "[DRY RUN COMPLETED]" : "[LIVE COMPLETED]"}`);
  console.log("====================================================");
  console.log(` Departments Created : ${summary.departmentsCreated}`);
  console.log(` Departments Updated : ${summary.departmentsUpdated}`);
  console.log(` Users Backfilled    : ${summary.usersUpdated} (${summary.usersSkipped} skipped)`);
  console.log(` Tickets Backfilled  : ${summary.ticketsUpdated} (${summary.ticketsSkipped} skipped)`);
  console.log(` Claims Updated      : ${summary.claimsUpdated} (${summary.claimsSkipped} skipped)`);
  console.log(` Dept Employee Count : ${summary.activeEmployeeCount}`);
  console.log(` Dept Ticket Count   : ${summary.ticketCount}`);
  console.log("====================================================\n");
}

runMigration()
  .then(() => {
    console.log("Migration script finished successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed with error:", err);
    process.exit(1);
  });
