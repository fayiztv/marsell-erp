import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Ticket as TicketIcon,
  ShieldAlert,
  Layers,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { useAdminMetrics } from '../hooks/useAdminMetrics';
import { MetricCard } from '../components/MetricCard';
import { RecentItemsWidget } from '../components/RecentItemsWidget';
import { Button, Card, LoadingSkeleton } from '@/components/ui';
import { ROUTES } from '@/constants';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data: metrics, isLoading, isError } = useAdminMetrics();

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Admin Overview</h1>
          <p className="text-sm text-gray-400 mt-1">
            System-wide administration, department management, and approval queues.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(ROUTES.ADMIN.DEPARTMENTS)}
          >
            <Layers className="size-4 mr-2" />
            Departments
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(ROUTES.ADMIN.USERS)}
          >
            <Plus className="size-4 mr-2" />
            Manage Users
          </Button>
        </div>
      </div>

      {/* Pending Approvals Callout Banner if any exist */}
      {metrics && metrics.pendingApprovalsCount > 0 && (
        <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-amber-200">
                  {metrics.pendingApprovalsCount} Deletion {metrics.pendingApprovalsCount === 1 ? 'Request' : 'Requests'} Pending
                </h3>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  Managers have submitted entity deletion requests that require administrative review.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-sm shrink-0"
              onClick={() => navigate(ROUTES.ADMIN.APPROVALS)}
            >
              Review Approvals
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      {isError ? (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
          Failed to load administrative metrics.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="cursor-pointer" onClick={() => navigate(ROUTES.ADMIN.DEPARTMENTS)}>
            <MetricCard
              title="Total Departments"
              value={metrics.totalDepartments}
              icon={<Layers size={20} />}
              colorClass="text-blue-400"
              delay={0.1}
            />
          </div>
          <div className="cursor-pointer" onClick={() => navigate(ROUTES.ADMIN.USERS)}>
            <MetricCard
              title="Total Managers"
              value={metrics.totalManagers}
              icon={<UserCheck size={20} />}
              colorClass="text-purple-400"
              delay={0.2}
            />
          </div>
          <div className="cursor-pointer" onClick={() => navigate(ROUTES.ADMIN.USERS)}>
            <MetricCard
              title="Total Employees"
              value={metrics.totalEmployees}
              icon={<Users size={20} />}
              colorClass="text-emerald-400"
              delay={0.3}
            />
          </div>
          <div className="cursor-pointer" onClick={() => navigate(ROUTES.ADMIN.TICKETS)}>
            <MetricCard
              title="Open Tickets"
              value={metrics.totalOpenTickets}
              icon={<TicketIcon size={20} />}
              colorClass="text-amber-400"
              delay={0.4}
            />
          </div>
          <div className="cursor-pointer" onClick={() => navigate(ROUTES.ADMIN.APPROVALS)}>
            <MetricCard
              title="Pending Approvals"
              value={metrics.pendingApprovalsCount}
              icon={<ShieldAlert size={20} />}
              colorClass={metrics.pendingApprovalsCount > 0 ? "text-rose-400" : "text-gray-400"}
              delay={0.5}
            />
          </div>
        </div>
      ) : null}

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Navigation Cards */}
          <Card className="p-5 border-white/[0.06] bg-gray-900/60 hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Layers className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-200">Departments</h3>
              <p className="text-xs text-gray-500">Configure corporate organizational units</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            Manage permanent home departments, archive inactive units, and view department member rosters.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
            onClick={() => navigate(ROUTES.ADMIN.DEPARTMENTS)}
          >
            Manage Departments
            <ArrowRight className="size-4" />
          </Button>
        </Card>

        <Card className="p-5 border-white/[0.06] bg-gray-900/60 hover:border-purple-500/30 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Users className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-200">Users & Access</h3>
              <p className="text-xs text-gray-500">Admins, Managers & Employees</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            Create managers, grant or revoke temporary cross-department access, and manage user statuses.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            onClick={() => navigate(ROUTES.ADMIN.USERS)}
          >
            Manage User Directory
            <ArrowRight className="size-4" />
          </Button>
        </Card>

        <Card className="p-5 border-white/[0.06] bg-gray-900/60 hover:border-amber-500/30 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-200">Deletion Queue</h3>
              <p className="text-xs text-gray-500">Two-man rule approval workflows</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            Review deletion requests submitted by managers for employees and clients with automated dependency checks.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
            onClick={() => navigate(ROUTES.ADMIN.APPROVALS)}
          >
            Open Approvals Queue
            <ArrowRight className="size-4" />
          </Button>
        </Card>
        
        {/* Recent Items Widget */}
        <RecentItemsWidget />
      </div>
    </div>
  );
}
