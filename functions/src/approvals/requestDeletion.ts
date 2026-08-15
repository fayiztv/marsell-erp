import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Submits a deletion request for an employee, ticket, or client (Manager only).
 * Server-side validates permissions, creates a deletionRequests record, and locks the entity.
 */
export const requestDeletion = onCall(
  { region: "asia-south1" },
  async (request) => {
    // 1. Validate Caller
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be logged in to request deletions."
      );
    }

    const callerRole = request.auth.token.role;
    if (callerRole !== "manager" && callerRole !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "Only Managers can submit deletion requests."
      );
    }

    const {entityType, entityId, reason} = request.data;
    if (!entityType || !entityId) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: entityType, entityId."
      );
    }

    if (!["employee", "ticket", "client"].includes(entityType)) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid entityType provided."
      );
    }

    const db = admin.firestore();

    try {
      // 2. Fetch Calling Manager Data for Department Verification
      const callerDoc = await db.collection("users").doc(request.auth.uid).get();
      const callerData = callerDoc.data();
      const callerName = callerData?.name || request.auth.token.name || request.auth.token.email || "Manager";
      const allowedDeptIds = [
        callerData?.homeDepartmentId,
        ...(callerData?.temporaryDepartmentIds || []),
      ].filter(Boolean);

      let entitySummary = {
        title: "",
        subtitle: "",
        departmentId: null as string | null,
      };

      let targetDocRef: FirebaseFirestore.DocumentReference;

      // 3. Verify Permission & Entity Lock Status Based on Entity Type
      if (entityType === "ticket") {
        targetDocRef = db.collection("tickets").doc(entityId);
        const ticketDoc = await targetDocRef.get();
        if (!ticketDoc.exists) {
          throw new HttpsError("not-found", "Ticket not found.");
        }
        const ticketData = ticketDoc.data();

        if (ticketData?.isPendingDeletion) {
          throw new HttpsError(
            "already-exists",
            "This ticket already has a pending deletion request."
          );
        }

        if (callerRole === "manager" && !allowedDeptIds.includes(ticketData?.departmentId)) {
          throw new HttpsError(
            "permission-denied",
            "You do not have department access to request deletion for this ticket."
          );
        }

        entitySummary = {
          title: ticketData?.title || "Untitled Ticket",
          subtitle: `Client: ${ticketData?.clientName || "N/A"} | Dept: ${ticketData?.departmentName || "N/A"}`,
          departmentId: ticketData?.departmentId || null,
        };
      } else if (entityType === "employee") {
        targetDocRef = db.collection("users").doc(entityId);
        const userDoc = await targetDocRef.get();
        if (!userDoc.exists) {
          throw new HttpsError("not-found", "Employee not found.");
        }
        const userData = userDoc.data();

        if (userData?.isPendingDeletion) {
          throw new HttpsError(
            "already-exists",
            "This employee already has a pending deletion request."
          );
        }

        if (userData?.role !== "employee" && userData?.role !== "manager") {
          throw new HttpsError(
            "permission-denied",
            "You can only request deletion for Employee or Manager accounts."
          );
        }

        if (callerRole === "manager") {
          const isCreator = userData?.createdBy === request.auth.uid;
          
          let creatorIsInactive = false;
          if (!isCreator && userData?.createdBy) {
            const creatorDoc = await db.collection("users").doc(userData.createdBy).get();
            if (!creatorDoc.exists || creatorDoc.data()?.status !== 'active') {
              creatorIsInactive = true;
            }
          }

          const targetDeptIds = [
            userData?.homeDepartmentId,
            ...(userData?.temporaryDepartmentIds || [])
          ].filter(Boolean);
          
          const hasDeptIntersection = targetDeptIds.some(id => allowedDeptIds.includes(id));

          if (!isCreator && !creatorIsInactive && !hasDeptIntersection) {
            throw new HttpsError(
              "permission-denied",
              "You do not have permission to request deletion for this user."
            );
          }
        }

        entitySummary = {
          title: userData?.name || "Unnamed Employee",
          subtitle: `${userData?.email || "No email"} | Dept: ${userData?.homeDepartmentName || "N/A"}`,
          departmentId: userData?.homeDepartmentId || null,
        };
      } else {
        // entityType === 'client'
        targetDocRef = db.collection("clients").doc(entityId);
        const clientDoc = await targetDocRef.get();
        if (!clientDoc.exists) {
          throw new HttpsError("not-found", "Client not found.");
        }
        const clientData = clientDoc.data();

        if (clientData?.isPendingDeletion) {
          throw new HttpsError(
            "already-exists",
            "This client already has a pending deletion request."
          );
        }

        if (callerRole === "manager") {
          const isCreator = clientData?.createdBy === request.auth.uid;
          
          let creatorIsInactive = false;
          if (!isCreator && clientData?.createdBy) {
            const creatorDoc = await db.collection("users").doc(clientData.createdBy).get();
            if (!creatorDoc.exists || creatorDoc.data()?.status !== 'active') {
              creatorIsInactive = true;
            }
          }

          if (!isCreator && !creatorIsInactive) {
            throw new HttpsError(
              "permission-denied",
              "Only the manager who created this client (or if they are inactive) can request their deletion."
            );
          }
        }

        entitySummary = {
          title: clientData?.companyName || "Unnamed Client",
          subtitle: `Contact: ${clientData?.contactPerson || "N/A"} (${clientData?.phone || "N/A"})`,
          departmentId: null,
        };
      }

      // 4. Transaction: Create Deletion Request & Lock Target Entity
      const requestId = db.collection("deletionRequests").doc().id;
      const requestRef = db.collection("deletionRequests").doc(requestId);

      await db.runTransaction(async (transaction) => {
        // Create Request Doc
        transaction.set(requestRef, {
          id: requestId,
          entityType,
          entityId,
          entitySummary,
          reason: reason || "",
          status: "pending",
          requestedByUid: request.auth!.uid,
          requestedByName: callerName,
          requestedByRole: callerRole,
          requestedAt: admin.firestore.FieldValue.serverTimestamp(),
          reviewedByUid: null,
          reviewedByName: null,
          reviewedAt: null,
        });

        // Lock Target Entity
        transaction.update(targetDocRef, {
          isPendingDeletion: true,
          deletionRequestId: requestId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      return {
        requestId,
        message: "Deletion request submitted successfully for Admin review.",
      };
    } catch (error: any) {
      console.error("Error submitting deletion request:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError(
        "internal",
        "An error occurred while submitting the deletion request."
      );
    }
  }
);
