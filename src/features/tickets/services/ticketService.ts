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
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
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
    employeeUid?: string // If provided, strictly limits to tickets assigned to this employee
  ) {
    let q = query(collection(db, COLLECTIONS.TICKETS));

    // Role enforcement
    if (employeeUid) {
      q = query(q, where('assignedToId', '==', employeeUid));
    }

    // Active filters
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.priority) {
      q = query(q, where('priority', '==', filters.priority));
    }
    if (filters.clientId) {
      q = query(q, where('clientId', '==', filters.clientId));
    }
    if (filters.assignedToId && !employeeUid) {
      q = query(q, where('assignedToId', '==', filters.assignedToId));
    }
    if (filters.departmentId) {
      q = query(q, where('departmentId', '==', filters.departmentId));
    }

    q = query(q, orderBy('createdAt', 'desc'));

    if (cursor) {
      q = query(q, startAfter(cursor));
    }

    q = query(q, limit(pageSize));

    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => d.data()) as Ticket[];

    // Client-side text search (title/description/names)
    const filteredItems = filters.search
      ? items.filter((t) => {
          const s = filters.search.toLowerCase();
          return (
            t.title.toLowerCase().includes(s) ||
            t.description.toLowerCase().includes(s) ||
            t.clientName.toLowerCase().includes(s) ||
            t.assignedToName.toLowerCase().includes(s)
          );
        })
      : items;

    return {
      items: filteredItems,
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
      hasMore: snapshot.docs.length === pageSize,
    };
  },

  /**
   * Real-time subscription to a single ticket (used for TicketDetailPage)
   */
  subscribeToTicket(id: string, onUpdate: (ticket: Ticket | null) => void) {
    const ref = doc(db, COLLECTIONS.TICKETS, id);
    return onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as Ticket);
      } else {
        onUpdate(null);
      }
    });
  },

  /**
   * Create a new ticket
   */
  async createTicket(data: TicketFormData, assignedByUid: string) {
    const id = nanoid(12);
    const ref = doc(db, COLLECTIONS.TICKETS, id);

    const [clientDoc, assigneeDoc, assignerDoc] = await Promise.all([
      getDoc(doc(db, COLLECTIONS.CLIENTS, data.clientId)),
      getDoc(doc(db, COLLECTIONS.USERS, data.assignedToId)),
      getDoc(doc(db, COLLECTIONS.USERS, assignedByUid)),
    ]);

    if (!clientDoc.exists()) throw new Error('Client not found');
    if (!assigneeDoc.exists()) throw new Error('Assigned employee not found');
    if (!assignerDoc.exists()) throw new Error('Creator not found');

    const clientName = clientDoc.data().companyName;
    const assigneeData = assigneeDoc.data();
    const assignedToName = assigneeData.name || assigneeData.displayName || 'Employee';
    const assignerData = assignerDoc.data();
    const assignedByName = assignerData.name || assignerData.displayName || 'Manager';
    const departmentId = assigneeData.homeDepartmentId || 'dept_general';

    await setDoc(ref, {
      id,
      ...data,
      departmentId,
      status: 'pending',
      assignedById: assignedByUid,
      clientName,
      assignedToName,
      assignedByName,
      dueDate: data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Update a ticket
   */
  async updateTicket(id: string, data: TicketFormData) {
    const ref = doc(db, COLLECTIONS.TICKETS, id);
    
    const currentDoc = await getDoc(ref);
    if (!currentDoc.exists()) throw new Error('Ticket not found');
    
    const currentData = currentDoc.data();
    let updates: any = { 
      ...data, 
      dueDate: data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : null,
      updatedAt: serverTimestamp() 
    };

    if (data.clientId !== currentData.clientId) {
      const clientDoc = await getDoc(doc(db, COLLECTIONS.CLIENTS, data.clientId));
      if (clientDoc.exists()) updates.clientName = clientDoc.data().companyName;
    }
    if (data.assignedToId !== currentData.assignedToId) {
      const assigneeDoc = await getDoc(doc(db, COLLECTIONS.USERS, data.assignedToId));
      if (assigneeDoc.exists()) {
        const assigneeData = assigneeDoc.data();
        updates.assignedToName = assigneeData.name || assigneeData.displayName || 'Employee';
        if (assigneeData.homeDepartmentId) {
          updates.departmentId = assigneeData.homeDepartmentId;
        }
      }
    }

    await updateDoc(ref, updates);
  },

  /**
   * Update only the ticket status
   */
  async updateTicketStatus(id: string, status: TicketStatus) {
    const ref = doc(db, COLLECTIONS.TICKETS, id);
    await updateDoc(ref, {
      status,
      updatedAt: serverTimestamp(),
    });
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
