/**
 * Type-safe route path constants.
 * Always import from here — never use raw strings in <Link> or navigate().
 */

export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',

  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    DEPARTMENTS: '/admin/departments',
    DEPARTMENT_DETAIL: (id: string) => `/admin/departments/${id}`,
    USERS: '/admin/users',
    USER_DETAIL: (id: string) => `/admin/users/${id}`,
    CLIENTS: '/admin/clients',
    CLIENT_DETAIL: (id: string) => `/admin/clients/${id}`,
    TICKETS: '/admin/tickets',
    TICKET_DETAIL: (id: string) => `/admin/tickets/${id}`,
    APPROVALS: '/admin/approvals',
    SETTINGS: '/admin/settings',
  },

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
