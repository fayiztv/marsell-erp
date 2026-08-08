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
import type { User } from '../types/employee.types';
import type { EmployeeFormData } from '../validation/employeeSchema';
import type { EmployeeFilters, UserStatus } from '@/types';
import { COLLECTIONS } from '@/constants';

export const employeeService = {
  /**
   * Fetch employees / users with pagination and filters
   */
  async fetchEmployees(
    filters: EmployeeFilters,
    pageSize: number = 50,
    cursor: DocumentSnapshot | null = null,
    excludeUid?: string,
  ) {
    let q = query(collection(db, COLLECTIONS.USERS));

    // Role filter
    if (filters.role) {
      q = query(q, where('role', '==', filters.role));
    }

    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    // Order by createdAt desc
    q = query(q, orderBy('createdAt', 'desc'));

    if (cursor) {
      q = query(q, startAfter(cursor));
    }

    q = query(q, limit(excludeUid ? pageSize + 1 : pageSize));

    let snapshot;
    try {
      snapshot = await getDocs(q);
    } catch (err) {
      console.error('Firestore getDocs error:', err);
      throw err;
    }

    // Process results
    const items = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        ...data,
        name: data.name || data.displayName || 'Unknown User',
        temporaryDepartmentIds: data.temporaryDepartmentIds || [],
      };
    }) as User[];

    // Exclude specific user if requested
    let filteredItems = excludeUid ? items.filter((emp) => emp.uid !== excludeUid) : items;

    // Client-side search fallback
    if (filters.search) {
      const term = filters.search.toLowerCase();
      filteredItems = filteredItems.filter(
        (emp) =>
          emp.name?.toLowerCase().includes(term) ||
          emp.email?.toLowerCase().includes(term) ||
          emp.homeDepartmentName?.toLowerCase().includes(term)
      );
    }

    if (excludeUid && filteredItems.length > pageSize) {
      filteredItems.pop();
    }

    return {
      items: filteredItems,
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
      hasMore: snapshot.docs.length === pageSize,
    };
  },

  /**
   * Create a new user (Employee, Manager, or Admin) using the Cloud Function
   */
  async createEmployee(data: EmployeeFormData) {
    const createFn = httpsCallable<
      {
        email: string;
        password?: string;
        displayName: string;
        role: string;
        phone?: string;
        homeDepartmentId?: string | null;
      },
      { uid: string; message: string }
    >(functions, 'createUserAccount');

    const payload: {
      email: string;
      password?: string;
      displayName: string;
      role: string;
      phone?: string;
      homeDepartmentId?: string | null;
    } = {
      email: data.email,
      displayName: data.name,
      role: data.role,
      homeDepartmentId: data.homeDepartmentId ?? null,
    };

    if (data.password) {
      payload.password = data.password;
    }
    if (data.phone) {
      payload.phone = data.phone;
    }

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

  /**
   * Grant temporary department access
   */
  async grantTempAccess(targetUid: string, departmentId: string) {
    const grantFn = httpsCallable<
      { targetUid: string; departmentId: string },
      { message: string }
    >(functions, 'grantTemporaryDepartmentAccess');

    const response = await grantFn({ targetUid, departmentId });
    return response.data;
  },

  /**
   * Revoke temporary department access
   */
  async revokeTempAccess(targetUid: string, departmentId: string) {
    const revokeFn = httpsCallable<
      { targetUid: string; departmentId: string },
      { message: string }
    >(functions, 'revokeTemporaryDepartmentAccess');

    const response = await revokeFn({ targetUid, departmentId });
    return response.data;
  },

  /**
   * Delete an employee using the Cloud Function
   */
  async deleteEmployee(uid: string) {
    const deleteFn = httpsCallable<{ uid: string }, { message: string }>(
      functions,
      'deleteUserAccount'
    );
    const response = await deleteFn({ uid });
    return response.data;
  },

  /**
   * Direct delete any user (Admin only)
   */
  async adminDirectDelete(uid: string) {
    const deleteFn = httpsCallable<
      { entityType: string; entityId: string },
      { message: string }
    >(functions, 'adminDirectDelete');
    const response = await deleteFn({ entityType: 'employee', entityId: uid });
    return response.data;
  },
};
