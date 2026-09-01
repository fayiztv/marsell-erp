import { useAuth } from '@/hooks/useAuth';
import { Card, Avatar, Badge, Button } from '@/components/ui';
import { LogOut } from 'lucide-react';
import { authService } from '@/features/authentication/services/authService';
import { useDepartments } from '@/features/departments/hooks/useDepartments';

export function SettingsPage() {
  const { firebaseUser, role, homeDepartmentId, temporaryDepartmentIds, name: storeName, phone } = useAuth();
  const { data: departmentsData } = useDepartments({ status: 'active', search: '' });

  const handleSignOut = async () => {
    await authService.signOut();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Account & Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage your personal profile, credentials, and session preferences.
        </p>
      </div>

      {/* User Profile Card */}
      <Card className="p-6 bg-gray-900/50 border-white/[0.06] space-y-6">
        <div className="flex items-center gap-4">
          <Avatar
            name={storeName || firebaseUser?.displayName || firebaseUser?.email || 'User'}
            size="lg"
            className="rounded-xl border border-white/[0.06] shadow-xl"
          />
          <div>
            <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
              {storeName || firebaseUser?.displayName || 'Marsell User'}
            </h2>
            <p className="text-sm text-gray-400">{firebaseUser?.email}</p>
            <p className="text-sm text-gray-400 mt-0.5">
              {phone ? (
                <span className="text-gray-300">{phone}</span>
              ) : (
                <span className="italic text-gray-500">Phone not provided</span>
              )}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">
                {role || 'User'}
              </span>
              <Badge variant="success">Active Session</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/[0.06] text-sm">
          <div className="p-3.5 rounded-xl bg-gray-950/60 border border-white/[0.04]">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">
              Account UID
            </span>
            <span className="font-mono text-xs text-gray-300 select-all">
              {firebaseUser?.uid || 'Unknown'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-950/60 border border-white/[0.04]">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">
              System Environment
            </span>
            <span className="text-xs text-gray-300">Marsell Enterprise ERP • Phase 2</span>
          </div>
        </div>

          <div className="pt-4 border-t border-white/[0.06] space-y-4">
            <h3 className="text-sm font-semibold text-gray-100">Department Access</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 rounded-xl bg-gray-950/60 border border-white/[0.04]">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">
                  Home Department
                </span>
                <span className="text-sm text-gray-200">
                  {homeDepartmentId
                    ? departmentsData?.items.find((d) => d.id === homeDepartmentId)?.name ||
                      homeDepartmentId
                    : 'None'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-950/60 border border-white/[0.04]">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-2">
                  Temporary Departments
                </span>
                <div className="flex flex-wrap gap-2">
                  {temporaryDepartmentIds && temporaryDepartmentIds.length > 0 ? (
                    temporaryDepartmentIds.map((id) => (
                      <span
                        key={id}
                        className="text-[11px] font-medium px-2 py-1 rounded bg-gray-900 border border-white/[0.04] text-gray-300"
                      >
                        {departmentsData?.items.find((d) => d.id === id)?.name || id}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>

        <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-gray-500">Sign out of your active session</span>
          <Button variant="danger" size="sm" onClick={handleSignOut}>
            <LogOut className="size-4 mr-1.5" />
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
