import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

interface FirebaseAuthError {
  code?: string;
  message?: string;
}

/**
 * Creates a new user account (Auth + Firestore).
 * - Admin can create admin, manager, or employee accounts.
 * - Manager can ONLY create employee accounts within departments they have access to.
 * - Automatically sets Custom Claims (role, homeDeptId, tempDeptIds) and increments department employeeCount.
 */
export const createUserAccount = onCall(
  {region: "asia-south1"},
  async (request) => {
    // 1. Validate Caller Authentication
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be logged in to create users."
      );
    }

    const callerRole = request.auth.token.role;
    if (callerRole !== "admin" && callerRole !== "manager") {
      throw new HttpsError(
        "permission-denied",
        "Only Admins and Managers can create new users."
      );
    }

    // 2. Validate Payload
    const {
      email,
      password,
      displayName,
      role,
      phone,
      homeDepartmentId,
      temporaryDepartmentIds = [],
    } = request.data;

    if (!email || !password || !displayName || !role) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: email, password, displayName, role."
      );
    }

    if (!["admin", "manager", "employee"].includes(role)) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid role provided."
      );
    }

    // 3. Enforce Hierarchy Rules Server-Side
    const db = admin.firestore();

    if (callerRole === "manager") {
      if (role !== "employee" && role !== "manager") {
        throw new HttpsError(
          "permission-denied",
          "Managers can only create Employee or Manager accounts."
        );
      }

      // Fetch calling manager's user doc to verify department access
      const managerDoc = await db.collection("users").doc(request.auth.uid).get();
      if (!managerDoc.exists) {
        throw new HttpsError("not-found", "Calling manager profile not found.");
      }

      const managerData = managerDoc.data();
      const allowedDeptIds = [
        managerData?.homeDepartmentId,
        ...(managerData?.temporaryDepartmentIds || []),
      ].filter(Boolean);

      if (!homeDepartmentId || !allowedDeptIds.includes(homeDepartmentId)) {
        throw new HttpsError(
          "permission-denied",
          "You can only assign employees to departments you currently have access to."
        );
      }
    }

    // 4. Validate Target Department
    let targetDeptName = "";
    const effectiveHomeDeptId = homeDepartmentId || (role === "admin" ? null : "dept_general");

    if (effectiveHomeDeptId) {
      const deptDoc = await db.collection("departments").doc(effectiveHomeDeptId).get();
      if (!deptDoc.exists) {
        throw new HttpsError("not-found", "Assigned department not found.");
      }
      const deptData = deptDoc.data();
      if (deptData?.status === "archived") {
        throw new HttpsError(
          "failed-precondition",
          "Cannot assign users to an archived department."
        );
      }
      targetDeptName = deptData?.name || "";
    }

    try {
      // 5. Create Firebase Auth User
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
      });

      // 6. Set Custom Claims
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role,
        homeDeptId: effectiveHomeDeptId,
        tempDeptIds: temporaryDepartmentIds,
      });

      // 7. Write to Firestore & Increment Department Employee Count
      const batch = db.batch();
      const userRef = db.collection("users").doc(userRecord.uid);

      batch.set(userRef, {
        uid: userRecord.uid,
        email,
        name: displayName,
        phone: phone || null,
        role,
        status: "active",
        homeDepartmentId: effectiveHomeDeptId,
        homeDepartmentName: targetDeptName || null,
        temporaryDepartmentIds,
        createdBy: request.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (effectiveHomeDeptId) {
        const deptRef = db.collection("departments").doc(effectiveHomeDeptId);
        batch.update(deptRef, {
          employeeCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();

      return {
        uid: userRecord.uid,
        message: "User created successfully.",
      };
    } catch (error: any) {
      const authError = error as FirebaseAuthError;
      console.error("Error creating user account:", authError);
      if (authError.code === "auth/email-already-exists") {
        throw new HttpsError(
          "already-exists",
          "A user with this email already exists."
        );
      }
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError(
        "internal",
        "An error occurred while creating the user account."
      );
    }
  }
);
