import { useState, useMemo } from 'react';
import { ArrowLeft, Mail, Phone, Building, Tag, Calendar, User as UserIcon } from 'lucide-react';
import { Button, LoadingSkeleton, Badge, Input } from '@/components/ui';
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

type TimePeriod = 'this_week' | 'this_month' | 'custom' | 'all_time';

export function UserDetailView({ userId, onBack, headerActions }: UserDetailViewProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all_time');
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);
  const [tempCustomRange, setTempCustomRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [customRangeError, setCustomRangeError] = useState('');

  const dateRange = useMemo(() => {
    const now = new Date();
    if (timePeriod === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    if (timePeriod === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    if (timePeriod === 'custom' && customRange?.from && customRange?.to) {
      const start = new Date(customRange.from);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customRange.to);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    return null;
  }, [timePeriod, customRange]);

  const handleApplyCustom = () => {
    if (!tempCustomRange.from || !tempCustomRange.to) {
      setCustomRangeError('Both dates are required.');
      return;
    }
    if (new Date(tempCustomRange.to) < new Date(tempCustomRange.from)) {
      setCustomRangeError('"To" date cannot be before "From" date.');
      return;
    }
    setCustomRangeError('');
    setCustomRange(tempCustomRange);
  };

  const { data: user, isLoading: isLoadingUser, isError: isErrorUser } = useEmployee(userId);
  const isManager = user?.role === 'manager';
  
  const { data: stats, isLoading: isLoadingStats } = useUserTicketStats(userId, isManager, dateRange);

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

      {/* Date Range Filter */}
      <div className="bg-gray-900/50 border border-white/[0.06] rounded-xl p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-200">Ticket Analytics</h2>
          <div className="flex flex-wrap items-center gap-2 bg-gray-950/50 p-1.5 rounded-lg border border-white/[0.04]">
            {(['this_week', 'this_month', 'custom', 'all_time'] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timePeriod === period
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                {period.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {timePeriod === 'custom' && (
          <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-end gap-4">
            <Input
              type="date"
              label="From Date"
              value={tempCustomRange.from}
              onChange={(e) => setTempCustomRange({ ...tempCustomRange, from: e.target.value })}
            />
            <Input
              type="date"
              label="To Date"
              value={tempCustomRange.to}
              onChange={(e) => setTempCustomRange({ ...tempCustomRange, to: e.target.value })}
            />
            <Button onClick={handleApplyCustom} variant="primary">
              Apply
            </Button>
            {customRangeError && <span className="text-sm text-red-400">{customRangeError}</span>}
          </div>
        )}
        
        {timePeriod === 'custom' && customRange?.from && customRange?.to && !customRangeError && (
          <div className="text-sm text-gray-400 bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-lg inline-block">
            Showing: {new Date(customRange.from).toLocaleDateString()} – {new Date(customRange.to).toLocaleDateString()}
          </div>
        )}
      </div>

      

      {/* Ticket Stats */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-200">Assigned Tickets (Summary)</h2>
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

      <UserAssignedTickets 
        userId={userId} 
        dateRange={dateRange ? { startDate: dateRange.startDate.toISOString(), endDate: dateRange.endDate.toISOString() } : null} 
      />
    </div>
  );
}
