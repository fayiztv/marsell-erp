import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDoc,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DocumentSnapshot } from 'firebase/firestore';
import type { Client } from '../types/client.types';
import type { ClientFormData } from '../validation/clientSchema';
import type { ClientFilters } from '@/types';
import { COLLECTIONS } from '@/constants';
import { nanoid } from 'nanoid';

export const clientService = {
  /**
   * Fetch clients with pagination and search filtering
   */
  async fetchClients(
    filters: ClientFilters,
    pageSize: number,
    cursor: DocumentSnapshot | null,
  ) {
    let q = query(collection(db, COLLECTIONS.CLIENTS));

    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    // Order by created date for pagination
    q = query(q, orderBy('createdAt', 'desc'));

    if (cursor) {
      q = query(q, startAfter(cursor));
    }

    q = query(q, limit(pageSize));

    const snapshot = await getDocs(q);
    
    const items = snapshot.docs.map((d) => ({
      ...d.data(),
    })) as Client[];

    // Client-side search fallback (basic prefix/includes search)
    const filteredItems = filters.search
      ? items.filter(
          (c) =>
            c.companyName.toLowerCase().includes(filters.search.toLowerCase()) ||
            c.contactPerson.toLowerCase().includes(filters.search.toLowerCase()) ||
            c.email.toLowerCase().includes(filters.search.toLowerCase())
        )
      : items;

    return {
      items: filteredItems,
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
      hasMore: filteredItems.length === pageSize,
    };
  },

  /**
   * Fetch a single client by ID
   */
  async fetchClientById(id: string): Promise<Client | null> {
    const d = await getDoc(doc(db, COLLECTIONS.CLIENTS, id));
    if (!d.exists()) return null;
    return d.data() as Client;
  },

  /**
   * Create a new client
   */
  async createClient(data: ClientFormData, managerUid: string) {
    const id = nanoid(10);
    const ref = doc(db, COLLECTIONS.CLIENTS, id);
    
    await setDoc(ref, {
      id,
      ...data,
      status: 'active',
      createdBy: managerUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Update a client's information
   */
  async updateClient(id: string, data: ClientFormData) {
    const ref = doc(db, COLLECTIONS.CLIENTS, id);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Update client status (active/inactive)
   */
  async updateClientStatus(id: string, status: 'active' | 'inactive') {
    const ref = doc(db, COLLECTIONS.CLIENTS, id);
    await updateDoc(ref, {
      status,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Delete a client
   */
  async deleteClient(id: string, currentUserId: string) {
    try {
      // 1. Fetch client to check ownership
      const clientDoc = await getDoc(doc(db, COLLECTIONS.CLIENTS, id));
      if (!clientDoc.exists()) throw new Error('Client not found');
      
      const clientData = clientDoc.data() as Client;
      
      // 2. Enforce ownership exception
      if (clientData.createdBy !== currentUserId) {
        const creatorDoc = await getDoc(doc(db, COLLECTIONS.USERS, clientData.createdBy));
        if (creatorDoc.exists()) {
          const creatorStatus = creatorDoc.data()?.status;
          if (creatorStatus === 'active') {
             throw new Error('Only the manager who created this client can delete them.');
          }
        }
      }

      // 3. Check if client is referenced by any tickets
      const q = query(
        collection(db, COLLECTIONS.TICKETS),
        where('clientId', '==', id),
        limit(1)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        throw new Error('This client has existing tickets — deactivate instead, or delete the tickets first.');
      }

      const ref = doc(db, COLLECTIONS.CLIENTS, id);
      await deleteDoc(ref);
    } catch (error) {
      console.error("Firestore deleteDoc error (client):", error);
      throw error;
    }
  },
};
