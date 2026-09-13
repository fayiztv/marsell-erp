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
  serverTimestamp,
  where,
  onSnapshot,
  Timestamp,
  deleteField,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, auth } from '@/lib/firebase';
import { useAuthStore } from '@/app/stores/authStore';
import type { DocumentSnapshot } from 'firebase/firestore';
import type { Ticket } from '../types/ticket.types';
import type { TicketFormData } from '../validation/ticketSchema';
import type { TicketFilters, TicketStatus } from '@/types';
import { COLLECTIONS } from '@/constants';
import { nanoid } from 'nanoid';

export const ticketService = {
  /**
   * Fetch tickets with pagination and filters
   */
  async fetchTickets(
    filters: TicketFilters,
    pageSize: number,
    cursor: DocumentSnapshot | null,
    employeeUid?: string, // If provided, strictly limits to tickets assigned to this employee
    managerDepartmentIds?: string[] // If provided, strictly limits to tickets in these departments
  ) {
    // If the manager has no departments, they shouldn't see anything (and empty 'in' array throws an error in Firestore)
    if (managerDepartmentIds && managerDepartmentIds.length === 0) {
      console.warn('[DEBUG] fetchTickets called with empty managerDepartmentIds - returning empty result to prevent Firestore crash and flag stale state.');
      return { items: [], lastDoc: null, hasMore: false };
    }

    let q = query(collection(db, COLLECTIONS.TICKETS));

    // Role enforcement
    if (employeeUid) {
      q = query(q, where('assignedToId', '==', employeeUid));
    } else if (managerDepartmentIds && managerDepartmentIds.length > 0) {
      q = query(q, where('departmentId', 'in', managerDepartmentIds));
    }

    // Active filters
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.priority) {
      q = query(q, where('priority', '==', filters.priority));
    }
    if (filters.clientId && filters.clientId !== 'none') {
      q = query(q, where('clientIds', 'array-contains', filters.clientId));
    }
    if (filters.assignedToId && !employeeUid) {
      q = query(q, where('assignedToId', '==', filters.assignedToId));
    }
    if (filters.departmentId) {
      q = query(q, where('departmentId', '==', filters.departmentId));
    }
    if (filters.startDate) {
      q = query(q, where('createdAt', '>=', new Date(filters.startDate)));
    }
    if (filters.endDate) {
      q = query(q, where('createdAt', '<=', new Date(filters.endDate)));
    }

    q = query(q, orderBy('createdAt', 'desc'));

    if (cursor) {
      q = query(q, startAfter(cursor));
    }

    q = query(q, limit(pageSize));

    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => d.data()) as Ticket[];

    // Client-side text search (title/description/names)
    let filteredItems = filters.search
      ? items.filter((t) => {
          const s = filters.search.toLowerCase();
          return (
            t.title.toLowerCase().includes(s) ||
            t.description.toLowerCase().includes(s) ||
            (t.clientName && t.clientName.toLowerCase().includes(s)) ||
            (t.clients && t.clients.some((c) => c.name.toLowerCase().includes(s))) ||
            (t.assignedToName && t.assignedToName.toLowerCase().includes(s)) ||
            (t.assignees && t.assignees.some((a) => a.name.toLowerCase().includes(s)))
          );
        })
      : items;

    if (filters.clientId === 'none') {
      filteredItems = filteredItems.filter(
        (t) => (!t.clientIds || t.clientIds.length === 0) && !t.clientId
      );
    }

    return {
      items: filteredItems,
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
      hasMore: filteredItems.length === pageSize,
    };
  },

  /**
   * Real-time subscription to a single ticket (used for TicketDetailPage)
   */
  subscribeToTicket(id: string, onUpdate: (ticket: Ticket | null) => void, onError?: (error: any) => void) {
    const ref = doc(db, COLLECTIONS.TICKETS, id);
    return onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as Ticket);
      } else {
        onUpdate(null);
      }
    }, (error) => {
      if (onError) onError(error);
      else console.error('Ticket subscription error:', error);
    });
  },

  /**
   * Create a new ticket
   */
  async createTicket(data: TicketFormData, assignedByUid: string) {
    const id = nanoid(12);
    const ref = doc(db, COLLECTIONS.TICKETS, id);

    // Fetch assigner doc
    const assignerDoc = await getDoc(doc(db, COLLECTIONS.USERS, assignedByUid));
    if (!assignerDoc.exists()) throw new Error('Creator not found');
    const assignerData = assignerDoc.data();
    const assignedByName = assignerData.name || assignerData.displayName || 'Manager';
    const assignerRole = assignerData.role || 'manager';

    // Fetch department docs
    const departmentIds = data.departmentIds || [];
    const deptDocs = await Promise.all(
      departmentIds.map((deptId) => getDoc(doc(db, COLLECTIONS.DEPARTMENTS, deptId)))
    );
    const departments = deptDocs
      .filter((d) => d.exists())
      .map((d) => {
        const dData = d.data();
        return {
          id: d.id,
          name: dData.name || 'Department',
          code: dData.code || undefined,
        };
      });

    // Fetch assignee docs
    const assignedToIds = data.assignedToIds || [];
    const assigneeDocs = await Promise.all(
      assignedToIds.map((uid) => getDoc(doc(db, COLLECTIONS.USERS, uid)))
    );
    const assignees = assigneeDocs
      .filter((d) => d.exists())
      .map((d) => {
        const uData = d.data();
        return {
          uid: d.id,
          name: uData.name || uData.displayName || 'User',
          role: uData.role || 'employee',
          homeDepartmentId: uData.homeDepartmentId || undefined,
        };
      });

    // Fetch client docs (if any)
    const clientIds = data.clientIds || [];
    let clients: Array<{ id: string; name: string }> = [];
    if (clientIds.length > 0) {
      const clientDocs = await Promise.all(
        clientIds.map((cid) => getDoc(doc(db, COLLECTIONS.CLIENTS, cid)))
      );
      clients = clientDocs
        .filter((d) => d.exists())
        .map((d) => ({
          id: d.id,
          name: d.data().companyName || 'Client',
        }));
    }

    const ticketData: any = {
      id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: 'pending',

      // Multi-Entity Primary Arrays
      departmentIds,
      departments,
      assignedToIds,
      assignees,
      clientIds,
      clients,

      // Mirrored Legacy Singular Fields (Physical Retention)
      departmentId: departmentIds[0] || 'dept_general',
      departmentName: departments[0]?.name || 'General',
      assignedToId: assignedToIds[0] || '',
      assignedToName: assignees[0]?.name || 'Employee',
      clientId: clientIds[0] || null,
      clientName: clients[0]?.name || null,

      // Creator & History Metadata
      createdBy: assignedByUid,
      createdByRole: assignerRole,
      assignedById: assignedByUid,
      assignedByName,
      lastUpdatedByUid: assignedByUid,
      lastUpdatedByName: assignedByName,

      dueDate: data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, ticketData);
  },

  /**
   * Update a ticket
   */
  async updateTicket(
    id: string,
    data: TicketFormData,
    updatedBy?: { uid: string; name: string }
  ) {
    const ref = doc(db, COLLECTIONS.TICKETS, id);
    
    const currentDoc = await getDoc(ref);
    if (!currentDoc.exists()) throw new Error('Ticket not found');
    
    const currentUser = auth.currentUser;
    const authStore = useAuthStore.getState();
    const actorUid = updatedBy?.uid || authStore.firebaseUser?.uid || currentUser?.uid || 'unknown';
    const actorName = updatedBy?.name || authStore.name || currentUser?.displayName || 'User';

    // Fetch department docs
    const departmentIds = data.departmentIds || [];
    const deptDocs = await Promise.all(
      departmentIds.map((deptId) => getDoc(doc(db, COLLECTIONS.DEPARTMENTS, deptId)))
    );
    const departments = deptDocs
      .filter((d) => d.exists())
      .map((d) => {
        const dData = d.data();
        return {
          id: d.id,
          name: dData.name || 'Department',
          code: dData.code || undefined,
        };
      });

    // Fetch assignee docs
    const assignedToIds = data.assignedToIds || [];
    const assigneeDocs = await Promise.all(
      assignedToIds.map((uid) => getDoc(doc(db, COLLECTIONS.USERS, uid)))
    );
    const assignees = assigneeDocs
      .filter((d) => d.exists())
      .map((d) => {
        const uData = d.data();
        return {
          uid: d.id,
          name: uData.name || uData.displayName || 'User',
          role: uData.role || 'employee',
          homeDepartmentId: uData.homeDepartmentId || undefined,
        };
      });

    // Fetch client docs (if any)
    const clientIds = data.clientIds || [];
    let clients: Array<{ id: string; name: string }> = [];
    if (clientIds.length > 0) {
      const clientDocs = await Promise.all(
        clientIds.map((cid) => getDoc(doc(db, COLLECTIONS.CLIENTS, cid)))
      );
      clients = clientDocs
        .filter((d) => d.exists())
        .map((d) => ({
          id: d.id,
          name: d.data().companyName || 'Client',
        }));
    }

    let updates: any = { 
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : null,
      updatedAt: serverTimestamp(),
      lastUpdatedByUid: actorUid,
      lastUpdatedByName: actorName,

      // Multi-Entity Arrays
      departmentIds,
      departments,
      assignedToIds,
      assignees,
      clientIds,
      clients,

      // Mirrored Legacy Singular Fields
      departmentId: departmentIds[0] || 'dept_general',
      departmentName: departments[0]?.name || 'General',
      assignedToId: assignedToIds[0] || '',
      assignedToName: assignees[0]?.name || 'Employee',
    };

    if (clientIds.length > 0) {
      updates.clientId = clientIds[0];
      updates.clientName = clients[0]?.name || null;
    } else {
      updates.clientId = deleteField();
      updates.clientName = deleteField();
    }

    await updateDoc(ref, updates);
  },

  /**
   * Update only the ticket status
   */
  async updateTicketStatus(
    id: string,
    status: TicketStatus,
    updatedBy?: { uid: string; name: string }
  ) {
    const ref = doc(db, COLLECTIONS.TICKETS, id);
    const currentUser = auth.currentUser;
    const authStore = useAuthStore.getState();
    const actorUid = updatedBy?.uid || authStore.firebaseUser?.uid || currentUser?.uid || 'unknown';
    const actorName = updatedBy?.name || authStore.name || currentUser?.displayName || 'User';

    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
      lastUpdatedByUid: actorUid,
      lastUpdatedByName: actorName,
    };
    await updateDoc(ref, updateData);
  },

  /**
   * Delete a ticket using the Cloud Function
   */
  async deleteTicket(ticketId: string) {
    const deleteFn = httpsCallable<{ ticketId: string }, { message: string }>(
      functions,
      'deleteTicket'
    );
    const response = await deleteFn({ ticketId });
    return response.data;
  },
};
