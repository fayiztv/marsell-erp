/**
 * Type-safe route path constants.
 * Always import from here — never use raw strings in <Link> or navigate().
 */

export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',

  MANAGER: {
    ROOT: '/manager',
    DASHBOARD: '/manager/dashboard',
    EMPLOYEES: '/manager/employees',
    EMPLOYEE_DETAIL: (id: string) => `/manager/employees/${id}`,
    CLIENTS: '/manager/clients',
    CLIENT_DETAIL: (id: string) => `/manager/clients/${id}`,
    TICKETS: '/manager/tickets',
    TICKET_DETAIL: (id: string) => `/manager/tickets/${id}`,
    SETTINGS: '/manager/settings',
  },

  EMPLOYEE: {
    ROOT: '/employee',
    TICKETS: '/employee/tickets',
    TICKET_DETAIL: (id: string) => `/employee/tickets/${id}`,
    SETTINGS: '/employee/settings',
  },
} as const;
