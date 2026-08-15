import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import type { DocumentSnapshot } from 'firebase/firestore';
import type {
  DeletionRequest,
  DeletionRequestFilters,
  DeletionEntityType,
} from '../types/approval.types';
import { COLLECTIONS } from '@/constants';

export const approvalService = {
  /**
   * Fetch deletion requests with filters and pagination
   */
  async fetchDeletionRequests(
    filters: DeletionRequestFilters,
    pageSize: number = 50,
    cursor: DocumentSnapshot | null = null
  ) {
    let q = query(collection(db, COLLECTIONS.DELETION_REQUESTS));

    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    if (filters.entityType) {
      q = query(q, where('entityType', '==', filters.entityType));
    }

    q = query(q, orderBy('requestedAt', 'desc'));

    if (cursor) {
      q = query(q, startAfter(cursor));
    }

    q = query(q, limit(pageSize));

    let snapshot;
    try {
      snapshot = await getDocs(q);
    } catch (error) {
      console.error("Firestore Error in fetchDeletionRequests (Likely missing index):", error);
      throw error;
    }

    let items = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as DeletionRequest[];

    // Client-side search filtering by entity title or requestedByName
    const filteredItems = filters.search
      ? items.filter(
          (req) =>
            req.entitySummary?.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
            req.entitySummary?.subtitle?.toLowerCase().includes(filters.search.toLowerCase()) ||
            req.requestedByName?.toLowerCase().includes(filters.search.toLowerCase())
        )
      : items;

    return {
      items: filteredItems,
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
      hasMore: filteredItems.length === pageSize,
    };
  },

  /**
   * Approve a deletion request via Cloud Function
   */
  async approveRequest(requestId: string) {
    const approveFn = httpsCallable<{ requestId: string }, { message: string }>(
      functions,
      'approveDeletionRequest'
    );
    const result = await approveFn({ requestId });
    return result.data;
  },

  /**
   * Reject a deletion request via Cloud Function
   */
  async rejectRequest(requestId: string, reason?: string) {
    const rejectFn = httpsCallable<{ requestId: string; reason?: string }, { message: string }>(
      functions,
      'rejectDeletionRequest'
    );
    const payload: { requestId: string; reason?: string } = { requestId };
    if (reason) payload.reason = reason;
    const result = await rejectFn(payload);
    return result.data;
  },

  /**
   * Admin direct delete bypassing the queue
   */
  async directDelete(entityType: DeletionEntityType, entityId: string) {
    const deleteFn = httpsCallable<
      { entityType: DeletionEntityType; entityId: string },
      { message: string }
    >(functions, 'adminDirectDelete');
    const result = await deleteFn({ entityType, entityId });
    return result.data;
  },

  /**
   * Submit a deletion request (Used by Managers)
   */
  async requestDeletion(entityType: DeletionEntityType, entityId: string, reason?: string) {
    const requestFn = httpsCallable<
      { entityType: DeletionEntityType; entityId: string; reason?: string },
      { message: string; requestId: string }
    >(functions, 'requestDeletion');
    const payload: { entityType: DeletionEntityType; entityId: string; reason?: string } = {
      entityType,
      entityId,
    };
    if (reason) payload.reason = reason;
    const result = await requestFn(payload);
    return result.data;
  },
};
