import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize the Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

interface FirebaseAuthError {
  code?: string;
  message?: string;
}

/**
 * Creates a new user account (Auth + Firestore).
 * Restricted to authenticated users with the 'manager' role claim.
 */
export const createUserAccount = functions.https.onCall(
  async (data, context) => {
    // 1. Validate Caller
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to create users.",
      );
    }

    // Check custom claim for 'manager' role
    const callerRole = context.auth.token.role;
    if (callerRole !== "manager") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only managers can create new users.",
      );
    }

    // 2. Validate Payload
    const {email, password, displayName, role, phone} = data;
    if (!email || !password || !displayName || !role) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: email, password, displayName, role.",
      );
    }

    if (!["manager", "employee", "client"].includes(role)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid role provided.",
      );
    }

    try {
    // 3. Create Firebase Auth User
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
      });

      // 4. Set Custom Claims (role)
      await admin.auth().setCustomUserClaims(userRecord.uid, {role});

      // 5. Write to Firestore 'users' collection
      await admin.firestore().collection("users").doc(userRecord.uid).set({
        email,
        name: displayName,
        phone: phone || null,
        role,
        status: "active", // default status
        createdBy: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        uid: userRecord.uid,
        message: "User created successfully.",
      };
    } catch (error) {
      const authError = error as FirebaseAuthError;
      console.error("Error creating user account:", authError);
      if (authError.code === "auth/email-already-exists") {
        throw new functions.https.HttpsError(
          "already-exists",
          "A user with this email already exists.",
        );
      }
      throw new functions.https.HttpsError(
        "internal",
        "An error occurred while creating the user account.",
      );
    }
  });
