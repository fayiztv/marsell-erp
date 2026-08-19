import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Plus,
  Search,
  Users,
  Ticket,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDepartments } from '../hooks/useDepartments';
import { DepartmentFormDialog } from '../components/DepartmentFormDialog';
import { usePagination } from '@/hooks/usePagination';
import { PAGE_SIZE } from '@/constants';
import {
  Button,
  Input,
  Badge,
  Card,
  ConfirmationDialog,
  LoadingSkeleton,
  EmptyState,
  Pagination,
} from '@/components/ui';
import type { Department, DepartmentStatus } from '../types/department.types';
import type { DepartmentFormData } from '../validation/departmentSchema';
import { ROUTES } from '@/constants';
import { listStaggerVariants, listItemVariants } from '@/utils/animations';

export function AdminDepartmentListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DepartmentStatus | null>(null);

  const { currentPage, currentCursor, nextPage, previousPage } = usePagination();

  const {
    data,
    isLoading,
    isError,
    createDepartment,
    isCreating,
    updateDepartment,
    isUpdating,
    toggleStatus,
    deleteDepartment,
    isDeleting,
    recalculateCounts,
    isRecalculating,
  } = useDepartments({ status: statusFilter, search }, currentCursor);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  // Status toggle confirmation
  const [statusDialog, setStatusDialog] = useState<{
    isOpen: boolean;
    department: Department | null;
    nextStatus: DepartmentStatus;
  }>({
    isOpen: false,
    department: null,
    nextStatus: 'archived',
  });

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    department: Department | null;
  }>({
    isOpen: false,
    department: null,
  });

  const handleOpenCreate = () => {
    setEditingDepartment(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (dept: Department, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDepartment(dept);
    setIsFormOpen(true);
  };

  const handleSaveDepartment = async (formData: DepartmentFormData) => {
    if (editingDepartment) {
      await updateDepartment({ id: editingDepartment.id, data: formData });
    } else {
      await createDepartment(formData);
    }
  };

  const handleOpenToggleStatus = (dept: Department, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus: DepartmentStatus = dept.status === 'active' ? 'archived' : 'active';
    setStatusDialog({
      isOpen: true,
      department: dept,
      nextStatus,
    });
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusDialog.department) return;
    await toggleStatus({
      id: statusDialog.department.id,
      status: statusDialog.nextStatus,
    });
    setStatusDialog({ isOpen: false, department: null, nextStatus: 'archived' });
  };

  const handleOpenDelete = (dept: Department, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialog({
      isOpen: true,
      department: dept,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.department) return;
    await deleteDepartment(deleteDialog.department.id);
    setDeleteDialog({ isOpen: false, department: null });
  };

  const departments = data?.items || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Departments</h1>
          <p className="text-sm text-gray-400 mt-1">
            Organize company personnel, ticket assignments, and department boundaries.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={() => recalculateCounts()}
            disabled={isRecalculating}
          >
            <RotateCcw className={`size-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
            Recalculate Counts
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="size-4 mr-2" />
            New Department
          </Button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-900/40 p-3 rounded-xl border border-white/[0.06]">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or code..."
            className="pl-9 bg-gray-950/60 border-white/[0.08]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-lg border border-white/[0.06] w-full sm:w-auto self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              statusFilter === null
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              statusFilter === 'active'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              statusFilter === 'archived'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Content */}
      {isError ? (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
          Failed to load departments. Please try refreshing the page.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          icon={<Layers size={24} />}
          title="No departments found"
          description={
            search
              ? 'No departments matched your search query.'
              : 'Create your first department to start organizing personnel and tickets.'
          }
          actionLabel={search ? undefined : 'Create Department'}
          onAction={search ? undefined : handleOpenCreate}
        />
      ) : (
        <motion.div
          variants={listStaggerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {departments.map((dept) => {
            const isArchived = dept.status === 'archived';

            return (
              <motion.div key={dept.id} variants={listItemVariants}>
                <Card
                  onClick={() => navigate(ROUTES.ADMIN.DEPARTMENT_DETAIL(dept.id))}
                  className={`p-5 flex flex-col justify-between h-full cursor-pointer transition-all duration-200 border-white/[0.06] hover:border-blue-500/40 hover:bg-gray-900/80 group ${
                    isArchived ? 'opacity-70 bg-gray-950/40' : 'bg-gray-900/50'
                  }`}
                >
                  <div>
                    {/* Top Row: Code & Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">
                          {dept.code}
                        </span>
                        {dept.id === 'dept_general' && (
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            Default
                          </span>
                        )}
                      </div>
                      <Badge variant={isArchived ? 'muted' : 'success'}>
                        {isArchived ? 'Archived' : 'Active'}
                      </Badge>
                    </div>

                    {/* Name & Description */}
                    <h3 className="text-base font-semibold text-gray-100 group-hover:text-blue-300 transition-colors">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 min-h-[32px]">
                      {dept.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Metrics & Actions */}
                  <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5" title="Employees in department">
                        <Users className="size-3.5 text-gray-500" />
                        <strong className="text-gray-200 font-medium">{dept.employeeCount || 0}</strong> members
                      </span>
                      <span className="flex items-center gap-1.5" title="Tickets assigned to department">
                        <Ticket className="size-3.5 text-gray-500" />
                        <strong className="text-gray-200 font-medium">{dept.ticketCount || 0}</strong> tickets
                      </span>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleOpenEdit(dept, e)}
                        title="Edit department"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/[0.06] transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={(e) => handleOpenToggleStatus(dept, e)}
                        title={isArchived ? 'Reactivate department' : 'Archive department'}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                      >
                        {isArchived ? <RotateCcw size={14} /> : <Archive size={14} />}
                      </button>

                      {dept.employeeCount === 0 && dept.ticketCount === 0 && (
                        <button
                          onClick={(e) => handleOpenDelete(dept, e)}
                          title="Delete department"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}

                      <div className="text-gray-600 group-hover:text-blue-400 pl-1">
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {departments.length > 0 && (
        <Pagination
          currentPage={currentPage}
          hasMore={data?.hasMore || false}
          onNext={() => data?.lastDoc && nextPage(data.lastDoc)}
          onPrevious={previousPage}
          pageSize={PAGE_SIZE}
          itemCount={departments.length}
        />
      )}

      {/* Modals & Dialogs */}
      <DepartmentFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSaveDepartment}
        isLoading={isCreating || isUpdating}
        initialData={editingDepartment}
      />

      <ConfirmationDialog
        isOpen={statusDialog.isOpen}
        onClose={() => setStatusDialog({ isOpen: false, department: null, nextStatus: 'archived' })}
        onConfirm={handleConfirmToggleStatus}
        title={statusDialog.nextStatus === 'archived' ? 'Archive Department?' : 'Reactivate Department?'}
        description={
          statusDialog.nextStatus === 'archived'
            ? `Archiving "${statusDialog.department?.name}" will prevent new tickets or users from being assigned to it. Existing members and tickets remain intact.`
            : `Reactivating "${statusDialog.department?.name}" will make it available again for tickets and users.`
        }
        confirmLabel={statusDialog.nextStatus === 'archived' ? 'Archive' : 'Reactivate'}
        variant={statusDialog.nextStatus === 'archived' ? 'warning' : 'danger'}
      />

      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, department: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Department Permanently?"
        description={`Are you sure you want to delete "${deleteDialog.department?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Department"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
