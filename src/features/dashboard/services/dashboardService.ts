import { collection, query, where, getCountFromServer, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/constants';
import type { DashboardMetrics, AdminDashboardMetrics } from '../types/dashboard.types';

export const dashboardService = {
  /**
   * Fetch aggregate metrics for the Manager Dashboard.
   * Scopes metrics to the Manager's currently accessible departments.
   */
  async getManagerMetrics(accessibleDepartmentIds: string[]): Promise<DashboardMetrics> {
    if (accessibleDepartmentIds.length === 0) {
      return {
        totalEmployees: 0,
        totalClients: 0,
        totalTickets: 0,
        ticketsPending: 0,
        ticketsInProgress: 0,
        ticketsOnHold: 0,
        ticketsCompleted: 0,
        ticketsHighPriority: 0,
      };
    }

    const usersCol = collection(db, COLLECTIONS.USERS);
    const clientsCol = collection(db, COLLECTIONS.CLIENTS);
    const ticketsCol = collection(db, COLLECTIONS.TICKETS);

    // Clients are system-wide, unrestricted by department
    const totalClientsPromise = getCountFromServer(clientsCol).then((s) => s.data().count);

    // ========================================================================
    // TODO(SCALABILITY): IN-MEMORY EMPLOYEE INTERSECTION
    // 
    // We are currently fetching the entire users collection (role == employee)
    // on every dashboard load to perform an in-memory intersection check against 
    // the manager's accessible departments (home + temp). 
    // 
    // This approach is acceptable for the client's current size (a few dozen users),
    // but WILL BECOME A PERFORMANCE AND COST BOTTLENECK as the company scales.
    // 
    // ACTION REQUIRED: Before this scales significantly, this must be refactored.
    // Recommended approach: Maintain a denormalized `employeeCount` (and potentially
    // manager counts) per department using Cloud Function triggers, similar to how
    // `ticketCount` is currently maintained, so the dashboard can just sum those 
    // pre-aggregated counts instead of fetching thousands of user documents.
    // ========================================================================
    const employeesQuery = query(usersCol, where('role', '==', 'employee'));
    const totalEmployeesPromise = getDocs(employeesQuery).then((snapshot) => {
      return snapshot.docs.filter((doc) => {
        const data = doc.data();
        const homeId = data.homeDepartmentId;
        const tempIds: string[] = data.temporaryDepartmentIds || [];
        
        return (
          (homeId && accessibleDepartmentIds.includes(homeId)) ||
          tempIds.some((id) => accessibleDepartmentIds.includes(id))
        );
      }).length;
    });

    // Chunk accessibleDepartmentIds into batches of 10 for Firestore 'in' queries
    const chunks: string[][] = [];
    for (let i = 0; i < accessibleDepartmentIds.length; i += 10) {
      chunks.push(accessibleDepartmentIds.slice(i, i + 10));
    }

    // Prepare ticket queries for all chunks
    const ticketPromises = chunks.map(async (chunk) => {
      const baseQ = query(ticketsCol, where('departmentId', 'in', chunk));
      
      const [total, pending, inProgress, onHold, completed, highPriority] = await Promise.all([
        getCountFromServer(baseQ),
        getCountFromServer(query(baseQ, where('status', '==', 'pending'))),
        getCountFromServer(query(baseQ, where('status', '==', 'in_progress'))),
        getCountFromServer(query(baseQ, where('status', '==', 'on_hold'))),
        getCountFromServer(query(baseQ, where('status', '==', 'completed'))),
        getCountFromServer(query(baseQ, where('priority', '==', 'high'))),
      ]);

      return {
        total: total.data().count,
        pending: pending.data().count,
        inProgress: inProgress.data().count,
        onHold: onHold.data().count,
        completed: completed.data().count,
        highPriority: highPriority.data().count,
      };
    });

    const [totalClients, totalEmployees, ...ticketResults] = await Promise.all([
      totalClientsPromise,
      totalEmployeesPromise,
      ...ticketPromises,
    ]);

    // Aggregate ticket chunks
    const ticketTotals = ticketResults.reduce(
      (acc, curr) => ({
        total: acc.total + curr.total,
        pending: acc.pending + curr.pending,
        inProgress: acc.inProgress + curr.inProgress,
        onHold: acc.onHold + curr.onHold,
        completed: acc.completed + curr.completed,
        highPriority: acc.highPriority + curr.highPriority,
      }),
      { total: 0, pending: 0, inProgress: 0, onHold: 0, completed: 0, highPriority: 0 }
    );

    return {
      totalEmployees,
      totalClients,
      totalTickets: ticketTotals.total,
      ticketsPending: ticketTotals.pending,
      ticketsInProgress: ticketTotals.inProgress,
      ticketsOnHold: ticketTotals.onHold,
      ticketsCompleted: ticketTotals.completed,
      ticketsHighPriority: ticketTotals.highPriority,
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

  /**
   * Fetch ticket statistics for a specific user.
   */
  async getUserTicketStats(uid: string, isManager: boolean = false) {
    const ticketsCol = collection(db, COLLECTIONS.TICKETS);
    
    // Base queries
    const assignedToQ = query(ticketsCol, where('assignedToId', '==', uid));
    
    const [
      assignedTotal,
      assignedPending,
      assignedInProgress,
      assignedOnHold,
      assignedCompleted,
      assignedHighPriority,
    ] = await Promise.all([
      getCountFromServer(assignedToQ),
      getCountFromServer(query(assignedToQ, where('status', '==', 'pending'))),
      getCountFromServer(query(assignedToQ, where('status', '==', 'in_progress'))),
      getCountFromServer(query(assignedToQ, where('status', '==', 'on_hold'))),
      getCountFromServer(query(assignedToQ, where('status', '==', 'completed'))),
      getCountFromServer(query(assignedToQ, where('priority', '==', 'high'))),
    ]);

    const assignedStats = {
      total: assignedTotal.data().count,
      pending: assignedPending.data().count,
      inProgress: assignedInProgress.data().count,
      onHold: assignedOnHold.data().count,
      completed: assignedCompleted.data().count,
      highPriority: assignedHighPriority.data().count,
    };

    let createdStats = null;
    if (isManager) {
      const createdByQ = query(ticketsCol, where('assignedById', '==', uid));
      const [
        createdTotal,
        createdPending,
        createdInProgress,
        createdOnHold,
        createdCompleted,
        createdHighPriority,
      ] = await Promise.all([
        getCountFromServer(createdByQ),
        getCountFromServer(query(createdByQ, where('status', '==', 'pending'))),
        getCountFromServer(query(createdByQ, where('status', '==', 'in_progress'))),
        getCountFromServer(query(createdByQ, where('status', '==', 'on_hold'))),
        getCountFromServer(query(createdByQ, where('status', '==', 'completed'))),
        getCountFromServer(query(createdByQ, where('priority', '==', 'high'))),
      ]);
      
      createdStats = {
        total: createdTotal.data().count,
        pending: createdPending.data().count,
        inProgress: createdInProgress.data().count,
        onHold: createdOnHold.data().count,
        completed: createdCompleted.data().count,
        highPriority: createdHighPriority.data().count,
      };
    }

    return {
      assigned: assignedStats,
      created: createdStats,
    };
  },

  /**
   * Fetch ticket statistics for a specific client.
   */
  async getClientTicketStats(clientId: string) {
    const ticketsCol = collection(db, COLLECTIONS.TICKETS);
    const clientQ = query(ticketsCol, where('clientId', '==', clientId));

    const [
      total,
      pending,
      inProgress,
      onHold,
      completed,
      highPriority,
    ] = await Promise.all([
      getCountFromServer(clientQ),
      getCountFromServer(query(clientQ, where('status', '==', 'pending'))),
      getCountFromServer(query(clientQ, where('status', '==', 'in_progress'))),
      getCountFromServer(query(clientQ, where('status', '==', 'on_hold'))),
      getCountFromServer(query(clientQ, where('status', '==', 'completed'))),
      getCountFromServer(query(clientQ, where('priority', '==', 'high'))),
    ]);

    return {
      total: total.data().count,
      pending: pending.data().count,
      inProgress: inProgress.data().count,
      onHold: onHold.data().count,
      completed: completed.data().count,
      highPriority: highPriority.data().count,
    };
  },
};
