import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserDetailView } from '../components/UserDetailView';
import { ROUTES } from '@/constants';
import { Button } from '@/components/ui';
import { Edit2, Lock, Unlock, Trash2 } from 'lucide-react';
import { AdminUserFormDialog } from '../components/AdminUserFormDialog';
import { DirectDeleteDialog } from '@/features/approvals/components/DirectDeleteDialog';
import { 
  useEmployee, 
  useUpdateEmployee, 
  useUpdateEmployeeStatus, 
  useChangeHomeDepartment 
} from '../hooks/useEmployees';
import { useApprovals } from '@/features/approvals/hooks/useApprovals';
import type { EmployeeFormData } from '../validation/employeeSchema';

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: user } = useEmployee(id || '');
  const { mutateAsync: updateUser, isPending: isUpdatingUser } = useUpdateEmployee();
  const { mutateAsync: changeDept, isPending: isChangingDept } = useChangeHomeDepartment();
  const { mutateAsync: updateStatus } = useUpdateEmployeeStatus();
  const { directDelete, isDirectDeleting } = useApprovals();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (!id) return null;

  const handleSaveUser = async (formData: EmployeeFormData) => {
    if (!user) return;
    const isDeptChanged =
      user.role !== 'admin' &&
      formData.role !== 'admin' &&
      formData.homeDepartmentId !== user.homeDepartmentId;

    if (isDeptChanged && formData.homeDepartmentId) {
      const payload: any = {
        uid: user.uid,
        homeDepartmentId: formData.homeDepartmentId,
      };
      if (formData.name !== undefined) payload.name = formData.name;
      if (formData.phone !== undefined) payload.phone = formData.phone;
      await changeDept(payload);
    } else {
      await updateUser({
        uid: user.uid,
        data: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
      });
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    const nextStatus = user.status === 'active' ? 'blocked' : 'active';
    await updateStatus({ uid: user.uid, status: nextStatus });
  };

  const handleConfirmDelete = async () => {
    if (!user) return;
    await directDelete({
      entityType: 'employee',
      entityId: user.uid,
    });
    setIsDeleteOpen(false);
    navigate(ROUTES.ADMIN.USERS);
  };

  const isBlocked = user?.status === 'blocked';
  const isPendingDeletion = user?.isPendingDeletion;

  const headerActions = user && !isPendingDeletion && (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
        <Edit2 className="size-3.5 mr-1.5" />
        Edit
      </Button>
      <Button 
        variant={isBlocked ? "outline" : "danger"} 
        size="sm" 
        onClick={handleToggleStatus}
      >
        {isBlocked ? (
          <>
            <Unlock className="size-3.5 mr-1.5" />
            Unblock
          </>
        ) : (
          <>
            <Lock className="size-3.5 mr-1.5" />
            Block
          </>
        )}
      </Button>
      {user.role !== 'admin' && (
        <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
          <Trash2 className="size-3.5 mr-1.5" />
          Delete
        </Button>
      )}
    </div>
  );

  return (
    <>
      <UserDetailView 
        userId={id} 
        onBack={() => navigate(ROUTES.ADMIN.USERS)} 
        headerActions={headerActions}
      />
      {user && (
        <AdminUserFormDialog
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={user as any}
          onSubmit={handleSaveUser}
          isLoading={isUpdatingUser || isChangingDept}
        />
      )}
      {user && (
        <DirectDeleteDialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleConfirmDelete}
          isLoading={isDirectDeleting}
          entityType="employee"
          entityName={user.name}
        />
      )}
    </>
  );
}
