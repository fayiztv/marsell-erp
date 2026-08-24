import { ArrowLeft, Mail, Phone, Building, Tag, Calendar, User as UserIcon } from 'lucide-react';
import { Button, LoadingSkeleton, Badge } from '@/components/ui';
import { MetricCard } from '@/features/dashboard/components/MetricCard';
import { useEmployee } from '../hooks/useEmployees';
import { useUserTicketStats } from '@/features/dashboard/hooks/useEntityStats';
import { formatDate } from '@/utils/dateUtils';
import { motion } from 'framer-motion';
import { listStaggerVariants, listItemVariants } from '@/utils/animations';
import { UserAssignedTickets } from './UserAssignedTickets';

interface UserDetailViewProps {
  userId: string;
  onBack: () => void;
  headerActions?: React.ReactNode;
}

export function UserDetailView({ userId, onBack, headerActions }: UserDetailViewProps) {
  const { data: user, isLoading: isLoadingUser, isError: isErrorUser } = useEmployee(userId);
  const isManager = user?.role === 'manager';
  
  const { data: stats, isLoading: isLoadingStats } = useUserTicketStats(userId, isManager);

  if (isErrorUser) {
    return (
      <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
        Failed to load user details. Please go back and try again.
      </div>
    );
  }

  if (isLoadingUser) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-40 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <LoadingSkeleton className="h-32 rounded-xl" />
          <LoadingSkeleton className="h-32 rounded-xl" />
          <LoadingSkeleton className="h-32 rounded-xl" />
          <LoadingSkeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isActive = user.status === 'active';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <Button variant="ghost" onClick={onBack} className="mb-2 -ml-2 text-gray-400">
        <ArrowLeft className="size-4 mr-2" />
        Back
      </Button>

      {/* Profile Header */}
      <div className="bg-gray-900/50 border border-white/[0.06] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/2"></div>
        
        <div className="flex items-center gap-6">
          <div className="size-20 md:size-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10 shrink-0">
            <UserIcon size={40} className="md:size-[48px]" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{user.name}</h1>
              <Badge variant={isActive ? 'success' : 'danger'}>
                {isActive ? 'Active' : 'Blocked'}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <div className="flex items-center gap-1.5">
                <Mail size={14} className="text-gray-500" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <>
                  <span className="hidden sm:inline text-gray-600">•</span>
                  <div className="flex items-center gap-1.5">
                    <Phone size={14} className="text-gray-500" />
                    <span>{user.phone}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Tag size={14} className="text-blue-400" />
                <span className="capitalize text-gray-300 font-medium">{user.role}</span>
              </div>
              {user.homeDepartmentName && (
                <>
                  <span className="text-gray-600">•</span>
                  <div className="flex items-center gap-1.5">
                    <Building size={14} className="text-indigo-400" />
                    <span className="text-gray-300">{user.homeDepartmentName}</span>
                  </div>
                </>
              )}
              <span className="text-gray-600">•</span>
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-500" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {headerActions && (
          <div className="shrink-0 mt-4 md:mt-0">
            {headerActions}
          </div>
        )}
      </div>

      {/* Ticket Stats */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-200">Assigned Tickets</h2>
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
              <MetricCard title="Total Assigned" value={stats?.assigned?.total || 0} icon={<Tag size={20} />} />
            </motion.div>
            <motion.div variants={listItemVariants}>
              <MetricCard title="Pending" value={stats?.assigned?.pending || 0} icon={<Calendar size={20} />} colorClass="text-purple-400" />
            </motion.div>
            <motion.div variants={listItemVariants}>
              <MetricCard title="In Progress" value={stats?.assigned?.inProgress || 0} icon={<Building size={20} />} colorClass="text-blue-400" />
            </motion.div>
            <motion.div variants={listItemVariants}>
              <MetricCard title="On Hold" value={stats?.assigned?.onHold || 0} icon={<Calendar size={20} />} colorClass="text-amber-400" />
            </motion.div>
            <motion.div variants={listItemVariants}>
              <MetricCard title="Completed" value={stats?.assigned?.completed || 0} icon={<UserIcon size={20} />} colorClass="text-emerald-400" />
            </motion.div>
            <motion.div variants={listItemVariants}>
              <MetricCard title="High Priority" value={stats?.assigned?.highPriority || 0} icon={<Tag size={20} />} colorClass="text-rose-400" />
            </motion.div>
          </motion.div>
        )}
      </div>

      {isManager && (
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-semibold text-gray-200">Created Tickets</h2>
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
                <MetricCard title="Total Created" value={stats?.created?.total || 0} icon={<Tag size={20} />} colorClass="text-indigo-400" />
              </motion.div>
              <motion.div variants={listItemVariants}>
                <MetricCard title="Pending" value={stats?.created?.pending || 0} icon={<Calendar size={20} />} colorClass="text-purple-400" />
              </motion.div>
              <motion.div variants={listItemVariants}>
                <MetricCard title="In Progress" value={stats?.created?.inProgress || 0} icon={<Building size={20} />} colorClass="text-blue-400" />
              </motion.div>
              <motion.div variants={listItemVariants}>
                <MetricCard title="On Hold" value={stats?.created?.onHold || 0} icon={<Calendar size={20} />} colorClass="text-amber-400" />
              </motion.div>
              <motion.div variants={listItemVariants}>
                <MetricCard title="Completed" value={stats?.created?.completed || 0} icon={<UserIcon size={20} />} colorClass="text-emerald-400" />
              </motion.div>
              <motion.div variants={listItemVariants}>
                <MetricCard title="High Priority" value={stats?.created?.highPriority || 0} icon={<Tag size={20} />} colorClass="text-rose-400" />
              </motion.div>
            </motion.div>
          )}
        </div>
      )}

      <UserAssignedTickets userId={userId} />
    </div>
  );
}
