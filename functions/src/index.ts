import { setGlobalOptions } from "firebase-functions/v2";

// Set global region to asia-south1 for all v2 functions
setGlobalOptions({ region: "asia-south1" });

// User Management Functions
export * from "./users/createUserAccount";
export * from "./users/deleteUserAccount";

// Department Access Management Functions
export * from "./departments/grantTemporaryDepartmentAccess";
export * from "./departments/revokeTemporaryDepartmentAccess";

// Deletion Request & Approval Functions
export * from "./approvals/requestDeletion";
export * from "./approvals/approveDeletionRequest";
export * from "./approvals/rejectDeletionRequest";
export * from "./approvals/adminDirectDelete";

// Firestore Realtime Triggers & Data Synchronization
export * from "./tickets/syncClientName";
export * from "./tickets/syncUserName";
export * from "./tickets/syncTicketDepartment";
export * from "./tickets/deleteTicket";
