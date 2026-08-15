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
import type { Department, DepartmentFilters, DepartmentStatus } from '../types/department.types';
import type { DepartmentFormData } from '../validation/departmentSchema';
import type { User, Ticket } from '@/types';
import { COLLECTIONS } from '@/constants';
import { nanoid } from 'nanoid';

export const departmentService = {
  /**
   * Fetch departments with pagination and status filter
   */
  async fetchDepartments(
    filters: DepartmentFilters,
    pageSize: number = 50,
    cursor: DocumentSnapshot | null = null
  ) {
    let q = query(
      collection(db, COLLECTIONS.DEPARTMENTS),
      orderBy('createdAt', 'desc')
    );

    if (cursor) {
      q = query(q, startAfter(cursor));
    }

    q = query(q, limit(pageSize));

    const snapshot = await getDocs(q);
    let items = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Department[];

    // In-memory status filtering for resilience against unbuilt composite indexes
    if (filters.status) {
      items = items.filter((d) => d.status === filters.status);
    }

    // Client-side search filtering by name or code
    const filteredItems = filters.search
      ? items.filter(
          (d) =>
            d.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            d.code.toLowerCase().includes(filters.search.toLowerCase()) ||
            (d.description && d.description.toLowerCase().includes(filters.search.toLowerCase()))
        )
      : items;

    return {
      items: filteredItems,
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
      hasMore: filteredItems.length === pageSize,
    };
  },

  /**
   * Fetch a single department by ID
   */
  async fetchDepartmentById(id: string): Promise<Department | null> {
    const ref = doc(db, COLLECTIONS.DEPARTMENTS, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Department;
  },

  /**
   * Create a new department
   */
  async createDepartment(data: DepartmentFormData, creatorUid: string) {
    const id = `dept_${data.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${nanoid(4)}`;
    const ref = doc(db, COLLECTIONS.DEPARTMENTS, id);

    await setDoc(ref, {
      id,
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description || '',
      status: 'active',
      employeeCount: 0,
      ticketCount: 0,
      createdBy: creatorUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return id;
  },

  /**
   * Update department details
   */
  async updateDepartment(id: string, data: DepartmentFormData) {
    const ref = doc(db, COLLECTIONS.DEPARTMENTS, id);
    await updateDoc(ref, {
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description || '',
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Toggle department status between active and archived
   */
  async toggleDepartmentStatus(id: string, status: DepartmentStatus) {
    const ref = doc(db, COLLECTIONS.DEPARTMENTS, id);
    await updateDoc(ref, {
      status,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Delete a department — only allowed if no users or tickets reference it
   */
  async deleteDepartment(id: string) {
    const ref = doc(db, COLLECTIONS.DEPARTMENTS, id);
    const deptSnap = await getDoc(ref);
    if (!deptSnap.exists()) throw new Error('Department not found');

    const data = deptSnap.data() as Department;
    if (data.employeeCount > 0 || data.ticketCount > 0) {
      throw new Error(
        `Cannot delete department: ${data.employeeCount} member(s) and ${data.ticketCount} ticket(s) are assigned to it. Archive the department instead.`
      );
    }

    // Verify in Firestore directly
    const [homeUsersSnap, ticketsSnap] = await Promise.all([
      getDocs(query(collection(db, COLLECTIONS.USERS), where('homeDepartmentId', '==', id), limit(1))),
      getDocs(query(collection(db, COLLECTIONS.TICKETS), where('departmentId', '==', id), limit(1))),
    ]);

    if (!homeUsersSnap.empty || !ticketsSnap.empty) {
      throw new Error(
        'Cannot delete department: Active records still reference this department. Archive it instead.'
      );
    }

    await deleteDoc(ref);
  },

  /**
   * Fetch all members of a department (Home department + Temporary access)
   */
  async fetchDepartmentMembers(departmentId: string): Promise<{
    homeMembers: User[];
    tempMembers: User[];
  }> {
    const usersCol = collection(db, COLLECTIONS.USERS);

    const [homeSnap, tempSnap] = await Promise.all([
      getDocs(query(usersCol, where('homeDepartmentId', '==', departmentId))),
      getDocs(query(usersCol, where('temporaryDepartmentIds', 'array-contains', departmentId))),
    ]);

    const homeMembers = homeSnap.docs.map((d) => ({
      uid: d.id,
      ...d.data(),
      name: d.data().name || d.data().displayName || 'Unknown User',
    })) as User[];

    const tempMembers = (
      tempSnap.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
        name: d.data().name || d.data().displayName || 'Unknown User',
      })) as User[]
    ).filter((u) => u.homeDepartmentId !== departmentId);

    return { homeMembers, tempMembers };
  },

  /**
   * Fetch tickets currently in a department
   */
  async fetchDepartmentTickets(departmentId: string): Promise<Ticket[]> {
    const q = query(
      collection(db, COLLECTIONS.TICKETS),
      where('departmentId', '==', departmentId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data()) as Ticket[];
  },
};
