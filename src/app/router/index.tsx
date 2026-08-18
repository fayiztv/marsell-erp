import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { PortalGuard } from '@/components/layouts/PortalGuard/PortalGuard';
import { AppLayout } from '@/components/layouts/AppLayout/AppLayout';

// Auth pages
import { LoginPage } from '@/features/authentication/pages/LoginPage';
import { ForgotPasswordPage } from '@/features/authentication/pages/ForgotPasswordPage';

// Admin pages
import { AdminDashboardPage } from '@/features/dashboard/pages/AdminDashboardPage';
import { AdminDepartmentListPage } from '@/features/departments/pages/AdminDepartmentListPage';
import { AdminDepartmentDetailPage } from '@/features/departments/pages/AdminDepartmentDetailPage';
import { AdminUserListPage } from '@/features/employees/pages/AdminUserListPage';
import { AdminUserDetailPage } from '@/features/employees/pages/AdminUserDetailPage';
import { AdminClientListPage } from '@/features/clients/pages/AdminClientListPage';
import { AdminTicketListPage } from '@/features/tickets/pages/AdminTicketListPage';
import { AdminTicketDetailPage } from '@/features/tickets/pages/AdminTicketDetailPage';
import { AdminApprovalListPage } from '@/features/approvals/pages/AdminApprovalListPage';

// Manager pages
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { EmployeeListPage } from '@/features/employees/pages/EmployeeListPage';
import { EmployeeDetailPage } from '@/features/employees/pages/EmployeeDetailPage';
import { ClientListPage } from '@/features/clients/pages/ClientListPage';
import { ClientDetailPage } from '@/features/clients/pages/ClientDetailPage';
import { ManagerTicketListPage } from '@/features/tickets/pages/ManagerTicketListPage';
import { ManagerTicketDetailPage } from '@/features/tickets/pages/ManagerTicketDetailPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';

// Employee pages
import { EmployeeTicketListPage } from '@/features/tickets/pages/EmployeeTicketListPage';
import { EmployeeTicketDetailPage } from '@/features/tickets/pages/EmployeeTicketDetailPage';

// Dev / QA
import { ComponentShowcase } from '@/features/showcase/pages/ComponentShowcase';

// Misc
import { NotFoundPage } from '@/app/pages/NotFoundPage';

export const router = createBrowserRouter([
  // ─── Root redirect ───────────────────────────────────────────
  {
    path: '/',
    element: <Navigate to={ROUTES.LOGIN} replace />,
  },

  // ─── Public routes ───────────────────────────────────────────
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: <ForgotPasswordPage />,
  },

  // ─── Admin portal ────────────────────────────────────────────
  {
    path: ROUTES.ADMIN.ROOT,
    element: (
      <PortalGuard requiredRole="admin">
        <AppLayout />
      </PortalGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />,
      },
      {
        path: 'dashboard',
        element: <AdminDashboardPage />,
      },
      {
        path: 'departments',
        element: <AdminDepartmentListPage />,
      },
      {
        path: 'departments/:id',
        element: <AdminDepartmentDetailPage />,
      },
      {
        path: 'users',
        element: <AdminUserListPage />,
      },
      {
        path: 'users/:id',
        element: <AdminUserDetailPage />,
      },
      {
        path: 'clients',
        element: <AdminClientListPage />,
      },
      {
        path: 'clients/:id',
        element: <ClientDetailPage />,
      },
      {
        path: 'tickets',
        element: <AdminTicketListPage />,
      },
      {
        path: 'tickets/:id',
        element: <AdminTicketDetailPage />,
      },
      {
        path: 'approvals',
        element: <AdminApprovalListPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },

  // ─── Manager portal ──────────────────────────────────────────
  {
    path: ROUTES.MANAGER.ROOT,
    element: (
      <PortalGuard requiredRole="manager">
        <AppLayout />
      </PortalGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.MANAGER.DASHBOARD} replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'employees',
        element: <EmployeeListPage />,
      },
      {
        path: 'employees/:id',
        element: <EmployeeDetailPage />,
      },
      {
        path: 'clients',
        element: <ClientListPage />,
      },
      {
        path: 'clients/:id',
        element: <ClientDetailPage />,
      },
      {
        path: 'tickets',
        element: <ManagerTicketListPage />,
      },
      {
        path: 'tickets/:id',
        element: <ManagerTicketDetailPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },

  // ─── Employee portal ─────────────────────────────────────────
  {
    path: ROUTES.EMPLOYEE.ROOT,
    element: (
      <PortalGuard requiredRole="employee">
        <AppLayout />
      </PortalGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.EMPLOYEE.TICKETS} replace />,
      },
      {
        path: 'tickets',
        element: <EmployeeTicketListPage />,
      },
      {
        path: 'tickets/:id',
        element: <EmployeeTicketDetailPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },

  // ─── Showcase (dev/QA — no auth guard) ─────────────────────
  {
    path: '/showcase',
    element: <ComponentShowcase />,
  },

  // ─── Catch-all ───────────────────────────────────────────────
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
