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
    let filteredItems = filters.search
      ? items.filter((t) => {
          const s = filters.search.toLowerCase();
          return (
            t.title.toLowerCase().includes(s) ||
            t.description.toLowerCase().includes(s) ||
            (t.clientName && t.clientName.toLowerCase().includes(s)) ||
            t.assignedToName.toLowerCase().includes(s)
          );
        })
      : items;

    if (filters.clientId === 'none') {
      filteredItems = filteredItems.filter((t) => !t.clientId);
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

    const [assigneeDoc, assignerDoc] = await Promise.all([
      getDoc(doc(db, COLLECTIONS.USERS, data.assignedToId)),
      getDoc(doc(db, COLLECTIONS.USERS, assignedByUid)),
    ]);

    if (!assigneeDoc.exists()) throw new Error('Assigned employee not found');
    if (!assignerDoc.exists()) throw new Error('Creator not found');

    const assigneeData = assigneeDoc.data();
    const assignedToName = assigneeData.name || assigneeData.displayName || 'Employee';
    const assignerData = assignerDoc.data();
    const assignedByName = assignerData.name || assignerData.displayName || 'Manager';
    const departmentId = assigneeData.homeDepartmentId || 'dept_general';

    const ticketData: any = {
      id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      assignedToId: data.assignedToId,
      departmentId,
      status: 'pending',
      assignedById: assignedByUid,
      assignedToName,
      assignedByName,
      dueDate: data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (data.clientId) {
      const clientDoc = await getDoc(doc(db, COLLECTIONS.CLIENTS, data.clientId));
      if (!clientDoc.exists()) throw new Error('Client not found');
      ticketData.clientId = data.clientId;
      ticketData.clientName = clientDoc.data().companyName;
    }

    await setDoc(ref, ticketData);
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
      title: data.title,
      description: data.description,
      priority: data.priority,
      assignedToId: data.assignedToId,
      dueDate: data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : null,
      updatedAt: serverTimestamp() 
    };

    if (data.clientId !== currentData.clientId) {
      if (data.clientId) {
        const clientDoc = await getDoc(doc(db, COLLECTIONS.CLIENTS, data.clientId));
        if (clientDoc.exists()) {
          updates.clientId = data.clientId;
          updates.clientName = clientDoc.data().companyName;
        }
      } else {
        // If clientId is cleared, we should remove clientId and clientName
        updates.clientId = deleteField();
        updates.clientName = deleteField();
      }
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
