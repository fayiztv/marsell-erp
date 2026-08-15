import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, LoadingSkeleton, EmptyState, Badge } from '@/components/ui';
import { Layers, Users, Building2, Ticket, ShieldAlert } from 'lucide-react';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import { useClients } from '@/features/clients/hooks/useClients';
import { useTickets } from '@/features/tickets/hooks/useTickets';
import { useApprovals } from '@/features/approvals/hooks/useApprovals';
import { formatDate } from '@/utils/dateUtils';

type TabType = 'departments' | 'users' | 'clients' | 'tickets' | 'approvals';

export function RecentItemsWidget() {
  const [activeTab, setActiveTab] = useState<TabType>('departments');

  const tabs = [
    { id: 'departments', label: 'Departments', icon: Layers },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'clients', label: 'Clients', icon: Building2 },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'approvals', label: 'Approvals', icon: ShieldAlert },
  ] as const;

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'departments': return <RecentDepartments />;
      case 'users': return <RecentUsers />;
      case 'clients': return <RecentClients />;
      case 'tickets': return <RecentTickets />;
      case 'approvals': return <RecentApprovals />;
    }
  };

  return (
    <Card className="p-0 border-white/[0.06] bg-gray-900/40 flex flex-col h-full overflow-hidden col-span-1 md:col-span-3">
      <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">Recently Added</h2>
      </div>
      
      {/* Tabs */}
      <div className="px-5 pt-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/[0.06]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive 
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5 rounded-t-lg' 
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.02] rounded-t-lg'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-blue-400' : 'text-gray-500'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-5 flex-1 min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </Card>
  );
}

function RecentDepartments() {
  const { data, isLoading, isError } = useDepartments({ search: '', status: null }, null, 3);
  
  if (isError) return <div className="text-red-400 p-4 bg-red-500/10 rounded-xl text-sm">Failed to load departments.</div>;
  if (isLoading) return <ListSkeleton />;
  if (!data?.items.length) return <EmptyState icon={<Layers size={24}/>} title="No departments found" className="py-8" />;

  return (
    <div className="space-y-3">
      {data.items.map((dept) => (
        <div key={dept.id} className="flex items-center justify-between p-3 rounded-lg border border-white/[0.04] bg-gray-900/50 hover:bg-gray-800/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Layers size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">{dept.name}</p>
              <p className="text-xs text-gray-500">Added {formatDate(dept.createdAt)}</p>
            </div>
          </div>
          <Badge variant={dept.status === 'active' ? 'success' : 'muted'}>{dept.status}</Badge>
        </div>
      ))}
    </div>
  );
}

function RecentUsers() {
  const { data, isLoading, isError } = useEmployees({ search: '', status: null, role: null }, null, false, false, undefined, 3);
  
  if (isError) return <div className="text-red-400 p-4 bg-red-500/10 rounded-xl text-sm">Failed to load users.</div>;
  if (isLoading) return <ListSkeleton />;
  if (!data?.items.length) return <EmptyState icon={<Users size={24}/>} title="No users found" className="py-8" />;

  return (
    <div className="space-y-3">
      {data.items.map((user) => (
        <div key={user.uid} className="flex items-center justify-between p-3 rounded-lg border border-white/[0.04] bg-gray-900/50 hover:bg-gray-800/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">{user.name}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 capitalize">
                <span className="text-purple-400 font-medium">{user.role}</span>
                <span>•</span>
                <span>Added {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
          <Badge variant={user.status === 'active' ? 'success' : 'danger'}>{user.status}</Badge>
        </div>
      ))}
    </div>
  );
}

function RecentClients() {
  const { data, isLoading, isError } = useClients({ search: '', status: null }, null, 3);
  
  if (isError) return <div className="text-red-400 p-4 bg-red-500/10 rounded-xl text-sm">Failed to load clients.</div>;
  if (isLoading) return <ListSkeleton />;
  if (!data?.items.length) return <EmptyState icon={<Building2 size={24}/>} title="No clients found" className="py-8" />;

  return (
    <div className="space-y-3">
      {data.items.map((client) => (
        <div key={client.id} className="flex items-center justify-between p-3 rounded-lg border border-white/[0.04] bg-gray-900/50 hover:bg-gray-800/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">{client.companyName}</p>
              <p className="text-xs text-gray-500">Contact: {client.contactPerson} • Added {formatDate(client.createdAt)}</p>
            </div>
          </div>
          <Badge variant={client.status === 'active' ? 'success' : 'muted'}>{client.status}</Badge>
        </div>
      ))}
    </div>
  );
}

function RecentTickets() {
  const { data, isLoading, isError } = useTickets({ search: '', status: null, priority: null, departmentId: null, assignedToId: null, clientId: null }, null, undefined, 3);
  
  if (isError) return <div className="text-red-400 p-4 bg-red-500/10 rounded-xl text-sm">Failed to load tickets.</div>;
  if (isLoading) return <ListSkeleton />;
  if (!data?.items.length) return <EmptyState icon={<Ticket size={24}/>} title="No tickets found" className="py-8" />;

  return (
    <div className="space-y-3">
      {data.items.map((ticket) => (
        <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg border border-white/[0.04] bg-gray-900/50 hover:bg-gray-800/50 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Ticket size={20} />
            </div>
            <div className="min-w-0 truncate pr-4">
              <p className="text-sm font-medium text-gray-200 truncate">{ticket.title}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="truncate">{ticket.departmentName}</span>
                <span>•</span>
                <span>Created {formatDate(ticket.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={ticket.priority === 'high' ? 'danger' : ticket.priority === 'medium' ? 'warning' : 'default'} className="hidden sm:inline-flex">{ticket.priority}</Badge>
            <Badge variant="default" className="capitalize">{ticket.status.replace('_', ' ')}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentApprovals() {
  const { data, isLoading, isError } = useApprovals({ status: 'pending', entityType: null, search: "" }, null, 3);
  
  
  if (isError) return <div className="text-red-400 p-4 bg-red-500/10 rounded-xl text-sm">Failed to load approvals.</div>;
  if (isLoading) return <ListSkeleton />;
  if (!data?.items.length) return <EmptyState icon={<ShieldAlert size={24}/>} title="No pending approvals" className="py-8" />;

  return (
    <div className="space-y-3">
      {data.items.map((req) => (
        <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border border-white/[0.04] bg-gray-900/50 hover:bg-gray-800/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">Delete {req.entityType} request</p>
              <p className="text-xs text-gray-500">Requested {formatDate(req.requestedAt)}</p>
            </div>
          </div>
          <Badge variant="warning">Pending</Badge>
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <LoadingSkeleton key={i} className="h-16 rounded-lg" />
      ))}
    </div>
  );
}
