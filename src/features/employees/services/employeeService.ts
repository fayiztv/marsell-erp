import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import type { DocumentSnapshot } from 'firebase/firestore';
import type { Employee } from '../types/employee.types';
import type { EmployeeFormData } from '../validation/employeeSchema';
import type { EmployeeFilters, UserStatus } from '@/types';
import { COLLECTIONS } from '@/constants';

export const employeeService = {
  /**
   * Fetch employees with pagination and filters
   */
  async fetchEmployees(
    filters: EmployeeFilters,
    pageSize: number,
    cursor: DocumentSnapshot | null,
  ) {
    let q = query(collection(db, COLLECTIONS.USERS));

    // Role filter is native to the users collection, allowing us to only get employees/managers
    if (filters.role) {
      q = query(q, where('role', '==', filters.role));
    } else {
      q = query(q, where('role', 'in', ['manager', 'employee']));
    }

    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    // In a real app, 'search' requires a 3rd party like Algolia,
    // or we'd just filter client-side. For this architecture, we filter
    // locally after fetching if search is active (since Firebase doesn't
    // support full-text search easily without extensions).
    // But we will apply ordering and pagination.
    
    // Note: Due to composite index requirements, if we have multiple where clauses
    // we need to order by the same fields or create composite indexes.
    // For simplicity of MVP, we'll order by createdAt desc.
    q = query(q, orderBy('createdAt', 'desc'));

    if (cursor) {
      q = query(q, startAfter(cursor));
    }

    q = query(q, limit(pageSize));

    let snapshot;
    try {
      snapshot = await getDocs(q);
    } catch (err) {
      console.error("Firestore getDocs error:", err);
      throw err;
    }
    
    // Process results
    const items = snapshot.docs.map((d) => ({
      uid: d.id,
      ...d.data(),
    })) as Employee[];

    // Client-side search fallback (basic prefix/includes search)
    const filteredItems = filters.search
      ? items.filter(
          (emp) =>
            emp.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
            emp.email.toLowerCase().includes(filters.search.toLowerCase())
        )
      : items;

    return {
      items: filteredItems,
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
      hasMore: snapshot.docs.length === pageSize,
    };
  },

  /**
   * Create a new employee using the Cloud Function
   */
  async createEmployee(data: EmployeeFormData) {
    const createFn = httpsCallable<EmployeeFormData, { uid: string; message: string }>(
      functions,
      'createUserAccount'
    );
    // Note: data contains { name, email, phone, role, password }
    // Our cloud function expects { email, password, displayName, role }
    // We map `name` -> `displayName` for the function payload.
    const payload = {
      email: data.email,
      password: data.password,
      displayName: data.name,
      role: data.role,
      phone: data.phone,
    };
    const response = await createFn(payload);
    return response.data;
  },

  /**
   * Update an employee's profile
   */
  async updateEmployee(uid: string, data: Omit<EmployeeFormData, 'password' | 'role'>) {
    const ref = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(ref, {
      name: data.name,
      phone: data.phone || null,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Update an employee's status (block/unblock)
   */
  async updateStatus(uid: string, status: UserStatus) {
    const ref = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(ref, {
      status,
      updatedAt: serverTimestamp(),
    });
  },
};
