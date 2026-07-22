import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/constants';
import type { DashboardMetrics } from '../types/dashboard.types';

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
    const ticketsCompletedQuery = query(ticketsCol, where('status', '==', 'completed'));
    const ticketsHighPriorityQuery = query(ticketsCol, where('priority', '==', 'high'));

    // Execute aggregate queries in parallel
    const [
      employeesSnap,
      clientsSnap,
      ticketsTotalSnap,
      ticketsPendingSnap,
      ticketsInProgressSnap,
      ticketsCompletedSnap,
      ticketsHighPrioritySnap,
    ] = await Promise.all([
      getCountFromServer(employeesQuery),
      getCountFromServer(clientsCol),
      getCountFromServer(ticketsCol),
      getCountFromServer(ticketsPendingQuery),
      getCountFromServer(ticketsInProgressQuery),
      getCountFromServer(ticketsCompletedQuery),
      getCountFromServer(ticketsHighPriorityQuery),
    ]);

    return {
      totalEmployees: employeesSnap.data().count,
      totalClients: clientsSnap.data().count,
      totalTickets: ticketsTotalSnap.data().count,
      ticketsPending: ticketsPendingSnap.data().count,
      ticketsInProgress: ticketsInProgressSnap.data().count,
      ticketsCompleted: ticketsCompletedSnap.data().count,
      ticketsHighPriority: ticketsHighPrioritySnap.data().count,
    };
  },
};
