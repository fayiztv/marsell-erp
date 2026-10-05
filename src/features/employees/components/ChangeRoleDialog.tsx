import { useState, useEffect } from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import { Dialog, Select, ConfirmationDialog, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useChangeUserRole } from '../hooks/useEmployees';
import type { User, UserRole } from '../types/employee.types';

export interface ChangeRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess?: () => void;
}

const ROLE_OPTIONS_ADMIN = [
  { value: 'employee', label: 'Employee (Self-only access)' },
  { value: 'manager', label: 'Department Manager (Team oversight)' },
  { value: 'admin', label: 'Administrator (Full access)' },
];

const ROLE_OPTIONS_MANAGER = [
  { value: 'employee', label: 'Employee (Self-only access)' },
  { value: 'manager', label: 'Department Manager (Team oversight)' },
];

function getRoleLabel(role: string): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'manager':
      return 'Department Manager';
    case 'employee':
      return 'Employee';
    default:
      return role;
  }
}

export function ChangeRoleDialog({
  isOpen,
  onClose,
  user,
  onSuccess,
}: ChangeRoleDialogProps) {
  const { isAdmin } = useAuth();
  const { mutateAsync: changeRole, isPending } = useChangeUserRole();

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    user.role === 'employee' ? 'manager' : 'employee'
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(user.role === 'employee' ? 'manager' : 'employee');
      setIsConfirmOpen(false);
    }
  }, [isOpen, user.role]);

  const availableOptions = isAdmin ? ROLE_OPTIONS_ADMIN : ROLE_OPTIONS_MANAGER;
  const isSameRole = selectedRole === user.role;

  const handleOpenConfirm = () => {
    if (isSameRole) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmRoleChange = async () => {
    try {
      await changeRole({
        targetUid: user.uid,
        newRole: selectedRole,
      });
      setIsConfirmOpen(false);
      onClose();
      onSuccess?.();
    } catch {
      // Error handled by mutation toast
    }
  };

  return (
    <>
      <Dialog
        isOpen={isOpen && !isConfirmOpen}
        onClose={onClose}
        title="Change User Role"
        description={`Update system permissions and security claims for ${user.name}.`}
        size="md"
        actions={[
          {
            label: 'Cancel',
            variant: 'ghost',
            onClick: onClose,
            disabled: isPending,
          },
          {
            label: 'Continue',
            variant: 'primary',
            onClick: handleOpenConfirm,
            disabled: isSameRole || isPending,
          },
        ]}
      >
        <div className="space-y-5">
          {/* Current Role Overview */}
          <div className="p-3.5 rounded-xl bg-gray-950/60 border border-white/[0.04] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block">
                Current Role
              </span>
              <span className="text-sm font-semibold text-gray-200">
                {getRoleLabel(user.role)}
              </span>
            </div>
            <Badge variant={user.role === 'admin' ? 'info' : user.role === 'manager' ? 'warning' : 'default'}>
              {user.role.toUpperCase()}
            </Badge>
          </div>

          {/* New Role Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Select New Role <span className="text-red-400">*</span>
            </label>
            <Select
              value={selectedRole}
              onChange={(val) => setSelectedRole(val as UserRole)}
              options={availableOptions}
              aria-label="Select new user role"
            />
          </div>

          {/* Transition Summary Preview */}
          {!isSameRole && (
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-blue-300">
                <Shield size={14} />
                <span>Permission Update Preview</span>
              </div>
              <div className="flex items-center gap-2 pt-0.5 text-gray-300 font-medium">
                <span className="capitalize">{user.role}</span>
                <ArrowRight size={13} className="text-blue-400" />
                <span className="capitalize font-bold text-white">{selectedRole}</span>
              </div>
              <p className="text-gray-400 pt-1">
                {selectedRole === 'admin'
                  ? 'Will grant full administrative privileges, system settings access, and deletion request approvals.'
                  : selectedRole === 'manager'
                  ? 'Will grant department team management, ticket assignment, and department deletion request capabilities.'
                  : 'Will limit access to self-assigned tickets and personal profile settings.'}
              </p>
            </div>
          )}
        </div>
      </Dialog>

      {/* Confirmation Step */}
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmRoleChange}
        title="Confirm Role Change"
        description={`Are you sure you want to change ${user.name}'s role from ${getRoleLabel(
          user.role
        )} to ${getRoleLabel(selectedRole)}? This will update their security claims and system access immediately.`}
        variant="warning"
        confirmLabel="Confirm Role Change"
        cancelLabel="Back"
        isLoading={isPending}
      />
    </>
  );
}
