export interface DashboardMetrics {
  totalEmployees: number;
  totalClients: number;
  totalTickets: number;
  ticketsPending: number;
  ticketsInProgress: number;
  ticketsCompleted: number;
  ticketsOnHold: number;
  ticketsHighPriority: number;
}

export interface AdminDashboardMetrics {
  totalDepartments: number;
  totalManagers: number;
  totalEmployees: number;
  totalOpenTickets: number;
  pendingApprovalsCount: number;
  totalClients: number;
  totalTickets: number;
}
