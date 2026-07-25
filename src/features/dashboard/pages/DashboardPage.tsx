import { Users, Building2, Ticket as TicketIcon, Clock, CheckCircle2, AlertCircle, PlayCircle, PauseCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useTickets } from '@/features/tickets/hooks/useTickets';
import { MetricCard } from '../components/MetricCard';
import { TicketCard } from '@/features/tickets/components/TicketCard';
import { LoadingSkeleton } from '@/components/ui';
import { ROUTES } from '@/constants';
import { listStaggerVariants, listItemVariants } from '@/utils/animations';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: metrics, isLoading: isMetricsLoading, isError: isMetricsError } = useDashboardMetrics();
  
  // Fetch 5 most recent tickets
  const { data: ticketsData, isLoading: isTicketsLoading } = useTickets({ search: '' }, null);
  const recentTickets = ticketsData?.items.slice(0, 6) || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Welcome back. Here is what's happening today.</p>
      </div>

      {isMetricsError ? (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
          Failed to load dashboard metrics.
        </div>
      ) : isMetricsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Tickets"
            value={metrics.totalTickets}
            icon={<TicketIcon size={20} />}
            colorClass="text-blue-400"
            delay={0.1}
          />
          <MetricCard
            title="Pending"
            value={metrics.ticketsPending}
            icon={<Clock size={20} />}
            colorClass="text-yellow-400"
            delay={0.2}
          />
          <MetricCard
            title="In Progress"
            value={metrics.ticketsInProgress}
            icon={<PlayCircle size={20} />}
            colorClass="text-purple-400"
            delay={0.3}
          />
          <MetricCard
            title="Completed"
            value={metrics.ticketsCompleted}
            icon={<CheckCircle2 size={20} />}
            colorClass="text-green-400"
            delay={0.4}
          />
          <MetricCard
            title="High Priority"
            value={metrics.ticketsHighPriority}
            icon={<AlertCircle size={20} />}
            colorClass="text-red-400"
            delay={0.5}
          />
          <MetricCard
            title="On Hold"
            value={metrics.ticketsOnHold}
            icon={<PauseCircle size={20} />}
            colorClass="text-orange-400"
            delay={0.6}
          />
          <MetricCard
            title="Total Clients"
            value={metrics.totalClients}
            icon={<Building2 size={20} />}
            colorClass="text-indigo-400"
            delay={0.7}
          />
          <MetricCard
            title="Total Employees"
            value={metrics.totalEmployees}
            icon={<Users size={20} />}
            colorClass="text-pink-400"
            delay={0.8}
          />
        </div>
      ) : null}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">Recent Tickets</h2>
          <button
            onClick={() => navigate(ROUTES.MANAGER.TICKETS)}
            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all
          </button>
        </div>

        {isTicketsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-[180px] rounded-xl" />
            ))}
          </div>
        ) : recentTickets.length > 0 ? (
          <motion.div
            variants={listStaggerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {recentTickets.map((ticket) => (
                <motion.div key={ticket.id} layout variants={listItemVariants}>
                  <TicketCard
                    ticket={ticket}
                    onClick={(t) => navigate(ROUTES.MANAGER.TICKET_DETAIL(t.id))}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="p-8 text-center bg-gray-900/50 border border-white/[0.04] rounded-xl">
            <p className="text-sm text-gray-400">No tickets found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
