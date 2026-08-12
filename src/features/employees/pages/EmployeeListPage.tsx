import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Pagination, EmptyState, LoadingSkeleton, Dialog } from '@/components/ui';
import { useUIStore } from '@/app/stores/uiStore';
import { useEmployees, useUpdateEmployeeStatus } from '../hooks/useEmployees';
import { useApprovals } from '@/features/approvals/hooks/useApprovals';
import { EmployeeCard } from '../components/EmployeeCard';
import { EmployeeFilters } from '../components/EmployeeFilters';
import { EmployeeForm } from '../components/EmployeeForm';
import { usePagination } from '@/hooks/usePagination';
import type { Employee } from '../types/employee.types';
import { listStaggerVariants, listItemVariants } from '@/utils/animations';
import { PAGE_SIZE } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

export function EmployeeListPage() {
  const filters = useUIStore((s) => s.employeeFilters);
  const activeDialog = useUIStore((s) => s.activeDialog);
  const dialogPayload = useUIStore((s) => s.dialogPayload) as Employee | undefined;
  const openDialog = useUIStore((s) => s.openDialog);
  const closeDialog = useUIStore((s) => s.closeDialog);
  const { accessibleDepartmentIds } = useAuth();

  const {
    currentPage,
    currentCursor,
    nextPage,
    previousPage,
  } = usePagination();

  const { data, isLoading, isError } = useEmployees(filters, currentCursor, true, true, accessibleDepartmentIds);
  const statusMutation = useUpdateEmployeeStatus();
  const { requestDeletion, isRequestingDeletion } = useApprovals();
  const [deleteReason, setDeleteReason] = useState('');

  const handleToggleStatus = (emp: Employee) => {
    const newStatus = emp.status === 'active' ? 'blocked' : 'active';
    statusMutation.mutate({ uid: emp.uid, status: newStatus });
  };

  const handleEdit = (emp: Employee) => {
    openDialog('edit-employee', emp);
  };

  const handleDelete = (emp: Employee) => {
    setDeleteReason('');
    openDialog('confirm-delete', emp);
  };

  const confirmDelete = () => {
    if (dialogPayload) {
      requestDeletion(
        {
          entityType: 'employee',
          entityId: dialogPayload.uid,
          reason: deleteReason || 'No reason provided',
        },
        {
          onSuccess: () => {
            closeDialog();
          },
        }
      );
    }
  };

  const employees = data?.items || [];
  const hasMore = data?.hasMore || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Employees</h1>
          <p className="text-sm text-gray-400 mt-1">Manage team members and access roles.</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => openDialog('create-employee')}
        >
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <EmployeeFilters />

      {/* Content */}
      {isError ? (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
          Failed to load employees. Please try again.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-[140px] rounded-xl" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No employees found"
          description="Try adjusting your filters or search query."
          action={
            <Button variant="outline" onClick={() => useUIStore.getState().resetEmployeeFilters()}>
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <motion.div
            variants={listStaggerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {employees.map((emp) => (
                <motion.div key={emp.uid} layout variants={listItemVariants}>
                  <EmployeeCard
                    employee={emp}
                    onEdit={handleEdit}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          <Pagination
            currentPage={currentPage}
            hasMore={hasMore}
            onNext={() => data?.lastDoc && nextPage(data.lastDoc)}
            onPrevious={previousPage}
            pageSize={PAGE_SIZE}
            itemCount={employees.length}
          />
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        isOpen={activeDialog === 'create-employee'}
        onClose={closeDialog}
        title="Add New Employee"
        description="Create a new user account with manager or employee access."
      >
        <EmployeeForm onCancel={closeDialog} />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        isOpen={activeDialog === 'edit-employee' && !!dialogPayload}
        onClose={closeDialog}
        title="Edit Employee"
        description="Update profile information for this user."
      >
        {dialogPayload && (
          <EmployeeForm
            editUid={dialogPayload.uid}
            defaultValues={{
              name: dialogPayload.name,
              email: dialogPayload.email,
              phone: dialogPayload.phone,
              role: dialogPayload.role,
            }}
            onCancel={closeDialog}
          />
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={activeDialog === 'confirm-delete' && !!dialogPayload}
        onClose={closeDialog}
        title="Request Employee Deletion"
        description={`Are you sure you want to request deletion of ${dialogPayload?.name}? An admin must approve this request before the user is permanently removed.`}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Reason for Deletion (Optional)
          </label>
          <textarea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            className="w-full bg-gray-900 border border-white/[0.04] rounded-lg p-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Why are you deleting this employee?"
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.04]">
          <Button variant="ghost" onClick={closeDialog} disabled={isRequestingDeletion}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete} isLoading={isRequestingDeletion}>
            Submit Request
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
