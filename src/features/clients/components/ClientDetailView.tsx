import { ArrowLeft, Mail, Phone, Building2, AlignLeft, Calendar } from 'lucide-react';
import { Badge, LoadingSkeleton, Button } from '@/components/ui';
import { MetricCard } from '@/features/dashboard/components/MetricCard';
import { useClient } from '../hooks/useClients';
import { useClientTicketStats } from '@/features/dashboard/hooks/useEntityStats';
import { formatDate } from '@/utils/dateUtils';
import { motion } from 'framer-motion';
import { listStaggerVariants, listItemVariants } from '@/utils/animations';

interface ClientDetailViewProps {
  clientId: string;
  onBack: () => void;
}

export function ClientDetailView({ clientId, onBack }: ClientDetailViewProps) {
  const { data: client, isLoading: isLoadingClient, isError: isErrorClient } = useClient(clientId);
  const { data: stats, isLoading: isLoadingStats } = useClientTicketStats(clientId);

  if (isErrorClient) {
    return (
      <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
        Failed to load client details. Please go back and try again.
      </div>
    );
  }

  if (isLoadingClient) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-40 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!client) return null;

  const isActive = client.status === 'active';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <Button variant="ghost" onClick={onBack} className="mb-2 -ml-2 text-gray-400">
        <ArrowLeft className="size-4 mr-2" />
        Back
      </Button>

      {/* Profile Header */}
      <div className="bg-gray-900/50 border border-white/[0.06] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/2"></div>
        
        <div className="flex items-center gap-6">
          <div className="size-20 md:size-24 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10 shrink-0">
            <Building2 size={40} className="md:size-[48px]" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{client.companyName}</h1>
              <Badge variant={isActive ? 'success' : 'muted'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <div className="font-medium text-gray-300">
                Contact: {client.contactPerson}
              </div>
              <span className="hidden sm:inline text-gray-600">•</span>
              <div className="flex items-center gap-1.5">
                <Mail size={14} className="text-gray-500" />
                <span>{client.email}</span>
              </div>
              {client.phone && (
                <>
                  <span className="hidden sm:inline text-gray-600">•</span>
                  <div className="flex items-center gap-1.5">
                    <Phone size={14} className="text-gray-500" />
                    <span>{client.phone}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-500" />
                <span>Added {formatDate(client.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {client.address && (
        <div className="bg-gray-900/40 p-4 rounded-xl border border-white/[0.04]">
          <div className="flex gap-2 text-sm text-gray-400">
            <AlignLeft size={16} className="shrink-0 mt-0.5 text-gray-500" />
            <div>
              <strong className="text-gray-300 block mb-1">Address & Notes</strong>
              {client.address && <p>{client.address}</p>}
              {client.notes && <p className="mt-2 text-gray-500 whitespace-pre-line">{client.notes}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Ticket Stats */}
      <div className="space-y-4 pt-2">
        <h2 className="text-lg font-semibold text-gray-200">Ticket History</h2>
        {isLoadingStats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={listStaggerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            <motion.div variants={listItemVariants}>
              <MetricCard title="Total Tickets" value={stats?.total || 0} icon={<AlignLeft size={20} />} />
            </motion.div>
            <motion.div variants={listItemVariants}>
              <MetricCard title="Pending" value={stats?.pending || 0} icon={<Calendar size={20} />} colorClass="text-purple-400" />
            </motion.div>
            <motion.div variants={listItemVariants}>
              <MetricCard title="In Progress" value={stats?.inProgress || 0} icon={<Building2 size={20} />} colorClass="text-blue-400" />
            </motion.div>
            <motion.div variants={listItemVariants}>
              <MetricCard title="On Hold" value={stats?.onHold || 0} icon={<Calendar size={20} />} colorClass="text-amber-400" />
            </motion.div>
            <motion.div variants={listItemVariants}>
              <MetricCard title="Completed" value={stats?.completed || 0} icon={<ArrowLeft size={20} />} colorClass="text-emerald-400" />
            </motion.div>
            <motion.div variants={listItemVariants}>
              <MetricCard title="High Priority" value={stats?.highPriority || 0} icon={<AlignLeft size={20} />} colorClass="text-rose-400" />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
