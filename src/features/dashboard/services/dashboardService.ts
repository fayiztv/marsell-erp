import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/constants';
import type { DashboardMetrics, AdminDashboardMetrics } from '../types/dashboard.types';

export const dashboardService = {
  /**
   * Fetch aggregate metrics for the Manager Dashboard.
   * Leverages Firestore getCountFromServer to avoid downloading entire collections.
   */
  async getManagerMetrics(): Promise<DashboardMetrics> {
    const usersCol = collection(db, COLLECTIONS.USERS);
    const clientsCol = collection(db, COLLECTIONS.CLIENTS);
    const ticketsCol = collection(db, COLLECTIONS.TICKETS);

    // Prepare queries
    const employeesQuery = query(usersCol, where('role', '==', 'employee'));
    const ticketsPendingQuery = query(ticketsCol, where('status', '==', 'pending'));
    const ticketsInProgressQuery = query(ticketsCol, where('status', '==', 'in_progress'));
    const ticketsOnHoldQuery = query(ticketsCol, where('status', '==', 'on_hold'));
    const ticketsCompletedQuery = query(ticketsCol, where('status', '==', 'completed'));
    const ticketsHighPriorityQuery = query(ticketsCol, where('priority', '==', 'high'));

    // Execute aggregate queries in parallel
    const [
      employeesSnap,
      clientsSnap,
      ticketsTotalSnap,
      ticketsPendingSnap,
      ticketsInProgressSnap,
      ticketsOnHoldSnap,
      ticketsCompletedSnap,
      ticketsHighPrioritySnap,
    ] = await Promise.all([
      getCountFromServer(employeesQuery),
      getCountFromServer(clientsCol),
      getCountFromServer(ticketsCol),
      getCountFromServer(ticketsPendingQuery),
      getCountFromServer(ticketsInProgressQuery),
      getCountFromServer(ticketsOnHoldQuery),
      getCountFromServer(ticketsCompletedQuery),
      getCountFromServer(ticketsHighPriorityQuery),
    ]);

    return {
      totalEmployees: employeesSnap.data().count,
      totalClients: clientsSnap.data().count,
      totalTickets: ticketsTotalSnap.data().count,
      ticketsPending: ticketsPendingSnap.data().count,
      ticketsInProgress: ticketsInProgressSnap.data().count,
      ticketsOnHold: ticketsOnHoldSnap.data().count,
      ticketsCompleted: ticketsCompletedSnap.data().count,
      ticketsHighPriority: ticketsHighPrioritySnap.data().count,
    };
  },

  /**
   * Fetch aggregate system-wide metrics for the Admin Dashboard.
   */
  async getAdminMetrics(): Promise<AdminDashboardMetrics> {
    const deptCol = collection(db, COLLECTIONS.DEPARTMENTS);
    const usersCol = collection(db, COLLECTIONS.USERS);
    const clientsCol = collection(db, COLLECTIONS.CLIENTS);
    const ticketsCol = collection(db, COLLECTIONS.TICKETS);
    const approvalsCol = collection(db, COLLECTIONS.DELETION_REQUESTS);

    const managersQuery = query(usersCol, where('role', '==', 'manager'));
    const employeesQuery = query(usersCol, where('role', '==', 'employee'));
    const pendingApprovalsQuery = query(approvalsCol, where('status', '==', 'pending'));
    const completedTicketsQuery = query(ticketsCol, where('status', '==', 'completed'));

    const [
      deptSnap,
      managersSnap,
      employeesSnap,
      clientsSnap,
      ticketsTotalSnap,
      completedTicketsSnap,
      pendingApprovalsSnap,
    ] = await Promise.all([
      getCountFromServer(deptCol),
      getCountFromServer(managersQuery),
      getCountFromServer(employeesQuery),
      getCountFromServer(clientsCol),
      getCountFromServer(ticketsCol),
      getCountFromServer(completedTicketsQuery),
      getCountFromServer(pendingApprovalsQuery),
    ]);

    const totalTickets = ticketsTotalSnap.data().count;
    const completedTickets = completedTicketsSnap.data().count;
    const totalOpenTickets = Math.max(0, totalTickets - completedTickets);

    return {
      totalDepartments: deptSnap.data().count,
      totalManagers: managersSnap.data().count,
      totalEmployees: employeesSnap.data().count,
      totalOpenTickets,
      pendingApprovalsCount: pendingApprovalsSnap.data().count,
      totalClients: clientsSnap.data().count,
      totalTickets,
    };
  },
};
