import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserDetailView } from '../components/UserDetailView';
import { ROUTES } from '@/constants';
import { Button, Dialog } from '@/components/ui';
import { Edit2, Lock, Unlock, Trash2 } from 'lucide-react';
import { EmployeeForm } from '../components/EmployeeForm';
import { useEmployee, useUpdateEmployeeStatus } from '../hooks/useEmployees';
import { useApprovals } from '@/features/approvals/hooks/useApprovals';

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: user } = useEmployee(id || '');
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } = useUpdateEmployeeStatus();
  const { requestDeletion, isRequestingDeletion } = useApprovals();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  if (!id) return null;

  const handleToggleStatus = async () => {
    if (!user) return;
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    await updateStatus({ uid: user.uid, status: newStatus });
  };

  const handleConfirmDelete = () => {
    if (!user) return;
    requestDeletion(
      {
        entityType: 'employee',
        entityId: user.uid,
        reason: deleteReason || 'No reason provided',
      },
      {
        onSuccess: () => setIsDeleteOpen(false),
      }
    );
  };

  const isPendingDeletion = user?.isPendingDeletion;

  const headerActions = user && !isPendingDeletion && (
    <div className="flex items-center gap-2">
      {user.role === 'employee' && (
        <>
          <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>
            <Edit2 className="size-3.5 mr-1.5" />
            Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={handleToggleStatus} isLoading={isUpdatingStatus}>
            {user.status === 'active' ? (
              <>
                <Lock className="size-3.5 mr-1.5" />
                Block
              </>
            ) : (
              <>
                <Unlock className="size-3.5 mr-1.5" />
                Unblock
              </>
            )}
          </Button>
        </>
      )}
      {user.role !== 'admin' && (
        <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
          <Trash2 className="size-3.5 mr-1.5" />
          Request Deletion
        </Button>
      )}
    </div>
  );

  return (
    <>
      <UserDetailView 
        userId={id} 
        onBack={() => navigate(ROUTES.MANAGER.EMPLOYEES)} 
        headerActions={headerActions}
      />

      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Employee"
        description="Update profile information for this user."
      >
        {user && (
          <EmployeeForm
            editUid={user.uid}
            defaultValues={{
              name: user.name,
              email: user.email,
              phone: user.phone || '',
              role: user.role,
            }}
            onCancel={() => setIsEditOpen(false)}
          />
        )}
      </Dialog>

      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Request Employee Deletion"
        description={`Are you sure you want to request deletion of ${user?.name}? An admin must approve this request before the user is permanently removed.`}
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
          <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} disabled={isRequestingDeletion}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} isLoading={isRequestingDeletion}>
            Submit Request
          </Button>
        </div>
      </Dialog>
    </>
  );
}
