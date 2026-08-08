import { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Layers,
  Edit2,
  Lock,
  Unlock,
  Trash2,
  Mail,
  Phone,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useUpdateEmployeeStatus } from '../hooks/useEmployees';
import { AdminUserFormDialog } from '../components/AdminUserFormDialog';
import { ManageTempAccessModal } from '../components/ManageTempAccessModal';
import { DirectDeleteDialog } from '@/features/approvals/components/DirectDeleteDialog';
import { useApprovals } from '@/features/approvals/hooks/useApprovals';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import {
  Button,
  Input,
  Badge,
  Card,
  Avatar,
  LoadingSkeleton,
  EmptyState,
} from '@/components/ui';
import type { User } from '../types/employee.types';
import type { EmployeeFormData } from '../validation/employeeSchema';
import type { UserRole, UserStatus } from '@/types';
import { listStaggerVariants, listItemVariants } from '@/utils/animations';

export function AdminUserListPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | null>(null);
  const [statusFilter, setStatusFilter] = useState<UserStatus | null>(null);

  const { data, isLoading, isError } = useEmployees(
    {
      role: roleFilter as any,
      status: statusFilter,
      search,
    },
    null,
    false
  );

  const { data: deptData } = useDepartments({ status: 'active', search: '' });
  const allDepartments = deptData?.items || [];

  const { mutateAsync: createUser, isPending: isCreating } = useCreateEmployee();
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateEmployee();
  const { mutateAsync: updateStatus } = useUpdateEmployeeStatus();
  const { directDelete, isDirectDeleting } = useApprovals();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [tempAccessUser, setTempAccessUser] = useState<User | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({
    isOpen: false,
    user: null,
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleSaveUser = async (formData: EmployeeFormData) => {
    if (editingUser) {
      await updateUser({
        uid: editingUser.uid,
        data: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
      });
    } else {
      await createUser(formData);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus: UserStatus = user.status === 'active' ? 'blocked' : 'active';
    await updateStatus({ uid: user.uid, status: nextStatus });
  };

  const handleOpenDelete = (user: User) => {
    setDeleteDialog({ isOpen: true, user });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.user) return;
    await directDelete({
      entityType: 'employee',
      entityId: deleteDialog.user.uid,
    });
    setDeleteDialog({ isOpen: false, user: null });
  };

  const users = data?.items || [];

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/20">
            Admin
          </span>
        );
      case 'manager':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20">
            Manager
          </span>
        );
      case 'employee':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">
            Employee
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Users & Access</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage company administrators, department managers, and employee permissions.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="size-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-900/40 p-4 rounded-xl border border-white/[0.06]">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, department..."
            className="pl-9 bg-gray-950/60 border-white/[0.08]"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-lg border border-white/[0.06]">
            <button
              onClick={() => setRoleFilter(null)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                roleFilter === null
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All Roles
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                roleFilter === 'admin'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Admins
            </button>
            <button
              onClick={() => setRoleFilter('manager')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                roleFilter === 'manager'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Managers
            </button>
            <button
              onClick={() => setRoleFilter('employee')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                roleFilter === 'employee'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Employees
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-lg border border-white/[0.06]">
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                statusFilter === null
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                statusFilter === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('blocked')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                statusFilter === 'blocked'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Blocked
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      {isError ? (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
          Failed to load users. Please refresh the page.
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No users found"
          description={
            search ? 'No users match your search criteria.' : 'Get started by creating your first user.'
          }
          action={
            search ? undefined : (
              <Button onClick={handleOpenCreate}>
                <Plus className="size-4 mr-2" />
                Create User
              </Button>
            )
          }
        />
      ) : (
        <motion.div
          variants={listStaggerVariants}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {users.map((user) => {
            const isBlocked = user.status === 'blocked';
            const tempDepts = user.temporaryDepartmentIds || [];

            // Find home department info
            const homeDept = allDepartments.find((d) => d.id === user.homeDepartmentId);
            const homeDeptLabel =
              user.role === 'admin'
                ? 'Global Admin (All Depts)'
                : homeDept
                ? `${homeDept.name} (${homeDept.code})`
                : user.homeDepartmentName || user.homeDepartmentId || 'General';

            return (
              <motion.div key={user.uid} variants={listItemVariants}>
                <Card
                  className={`p-4 bg-gray-900/50 border-white/[0.06] flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all ${
                    isBlocked ? 'opacity-65 bg-gray-950/40' : ''
                  }`}
                >
                  {/* Left Column: User Profile & Department details */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <Avatar name={user.name} size="md" className="shrink-0 mt-0.5" />
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-100 truncate">{user.name}</h3>
                        {getRoleBadge(user.role)}
                        <Badge variant={isBlocked ? 'danger' : 'success'}>
                          {isBlocked ? 'Blocked' : 'Active'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1.5 truncate">
                          <Mail size={13} className="text-gray-500 shrink-0" />
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1.5 truncate">
                            <Phone size={13} className="text-gray-500 shrink-0" />
                            {user.phone}
                          </span>
                        )}
                      </div>

                      {/* Department Info */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-300">
                          <Layers size={13} className="text-blue-400 shrink-0" />
                          <span className="text-gray-500">Home:</span>
                          <span className="font-medium text-gray-200">{homeDeptLabel}</span>
                        </div>

                        {tempDepts.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pl-2 border-l border-white/[0.08]">
                            <span className="text-[11px] text-purple-400 font-medium">Temp:</span>
                            {tempDepts.map((dId) => {
                              const dObj = allDepartments.find((d) => d.id === dId);
                              return (
                                <span
                                  key={dId}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono"
                                >
                                  {dObj ? dObj.code : dId}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
                    {user.role !== 'admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTempAccessUser(user)}
                        className="text-xs"
                      >
                        <Layers className="size-3.5 mr-1.5 text-purple-400" />
                        Temp Access ({tempDepts.length})
                      </Button>
                    )}

                    <button
                      onClick={() => handleOpenEdit(user)}
                      title="Edit user details"
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/[0.06] transition-colors"
                    >
                      <Edit2 size={15} />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(user)}
                      title={isBlocked ? 'Unblock user' : 'Block user'}
                      className={`p-2 rounded-lg transition-colors ${
                        isBlocked
                          ? 'text-emerald-400 hover:bg-emerald-500/10'
                          : 'text-amber-400 hover:bg-amber-500/10'
                      }`}
                    >
                      {isBlocked ? <Unlock size={15} /> : <Lock size={15} />}
                    </button>

                    <button
                      onClick={() => handleOpenDelete(user)}
                      title="Delete user permanently"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Create / Edit Form Dialog */}
      <AdminUserFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSaveUser}
        isLoading={isCreating || isUpdating}
        initialData={editingUser}
      />

      {/* Temporary Access Modal */}
      <ManageTempAccessModal
        isOpen={Boolean(tempAccessUser)}
        onClose={() => setTempAccessUser(null)}
        user={tempAccessUser}
      />

      {/* Direct Delete Dialog */}
      <DirectDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, user: null })}
        onConfirm={handleConfirmDelete}
        entityType="employee"
        entityName={deleteDialog.user?.name || 'User'}
        isLoading={isDirectDeleting}
      />
    </div>
  );
}
