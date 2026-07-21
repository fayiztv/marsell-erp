/**
 * Firestore collection name constants.
 * Never use raw strings — always reference these constants.
 * Changing a collection name requires a single update here.
 */
export const COLLECTIONS = {
  USERS: 'users',
  CLIENTS: 'clients',
  TICKETS: 'tickets',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
