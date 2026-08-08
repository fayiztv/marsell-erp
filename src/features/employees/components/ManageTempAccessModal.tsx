import { useState } from 'react';
import { Layers, X, Plus } from 'lucide-react';
import { Dialog, Button, Select, LoadingSkeleton } from '@/components/ui';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import { useGrantTempAccess, useRevokeTempAccess } from '../hooks/useEmployees';
import type { User } from '../types/employee.types';

interface ManageTempAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function ManageTempAccessModal({
  isOpen,
  onClose,
  user,
}: ManageTempAccessModalProps) {
  const [selectedDeptId, setSelectedDeptId] = useState('');

  const { data: deptData, isLoading: isLoadingDepts } = useDepartments({
    status: 'active',
    search: '',
  });

  const { mutateAsync: grantAccess, isPending: isGranting } = useGrantTempAccess();
  const { mutateAsync: revokeAccess, isPending: isRevoking } = useRevokeTempAccess();

  if (!user) return null;

  const allDepts = deptData?.items || [];
  const currentTempIds = user.temporaryDepartmentIds || [];

  // Available departments for granting (exclude home dept and already granted temp depts)
  const availableDepts = allDepts.filter(
    (d) => d.id !== user.homeDepartmentId && !currentTempIds.includes(d.id)
  );

  const handleGrant = async () => {
    if (!selectedDeptId || !user) return;
    await grantAccess({ targetUid: user.uid, departmentId: selectedDeptId });
    setSelectedDeptId('');
  };

  const handleRevoke = async (departmentId: string) => {
    if (!user) return;
    await revokeAccess({ targetUid: user.uid, departmentId });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Department Access"
      description={`Grant or revoke temporary cross-department permissions for ${user.name}.`}
      actions={[
        {
          label: 'Close',
          variant: 'secondary',
          onClick: onClose,
        },
      ]}
    >
      <div className="space-y-6">
        {/* User Info Header */}
        <div className="p-3.5 rounded-xl bg-gray-950/60 border border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-200">{user.name}</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Home Dept</span>
            <span className="text-xs font-semibold text-gray-300">
              {user.homeDepartmentName || (user.homeDepartmentId ? user.homeDepartmentId : 'None (Admin)')}
            </span>
          </div>
        </div>

        {/* Current Temporary Departments */}
        <div>
          <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2.5">
            Active Temporary Departments ({currentTempIds.length})
          </h4>

          {currentTempIds.length === 0 ? (
            <div className="p-4 rounded-lg bg-gray-950/30 border border-white/[0.04] text-center">
              <p className="text-xs text-gray-500">
                This user currently has no temporary department access.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentTempIds.map((deptId) => {
                const dept = allDepts.find((d) => d.id === deptId);
                const deptLabel = dept ? `${dept.name} (${dept.code})` : deptId;

                return (
                  <div
                    key={deptId}
                    className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium"
                  >
                    <Layers size={14} className="text-purple-400 shrink-0" />
                    <span>{deptLabel}</span>
                    <button
                      onClick={() => handleRevoke(deptId)}
                      disabled={isRevoking}
                      title="Revoke access"
                      className="p-1 rounded-md text-purple-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Grant New Temporary Department */}
        <div className="p-4 rounded-xl bg-gray-950/40 border border-white/[0.06] space-y-3">
          <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Grant Temporary Access
          </h4>

          {isLoadingDepts ? (
            <LoadingSkeleton className="h-10 rounded-lg" />
          ) : availableDepts.length === 0 ? (
            <p className="text-xs text-gray-500">
              No additional active departments available to grant.
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={selectedDeptId}
                  onChange={(val) => setSelectedDeptId(val)}
                  options={[
                    { value: '', label: 'Select Department to Grant...' },
                    ...availableDepts.map((d) => ({
                      value: d.id,
                      label: `${d.name} (${d.code})`,
                    })),
                  ]}
                />
              </div>
              <Button
                size="md"
                onClick={handleGrant}
                disabled={!selectedDeptId || isGranting}
                isLoading={isGranting}
              >
                <Plus size={16} className="mr-1.5" />
                Grant
              </Button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
