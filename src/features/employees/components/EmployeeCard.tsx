import { Mail, Phone, Shield } from 'lucide-react';
import { Card, Avatar, Badge, DropdownMenu, type DropdownMenuItem } from '@/components/ui';
import type { Employee } from '../types/employee.types';
interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onToggleStatus: (employee: Employee) => void;
}

export function EmployeeCard({ employee, onEdit, onToggleStatus }: EmployeeCardProps) {
  const isBlocked = employee.status === 'blocked';

  const menuItems: DropdownMenuItem[] = [
    { label: 'Edit Profile', onClick: () => onEdit(employee) },
    {
      label: isBlocked ? 'Unblock User' : 'Block User',
      onClick: () => onToggleStatus(employee),
      variant: isBlocked ? 'default' : 'danger',
    },
  ];

  return (
    <Card padding="md" hoverable className="group flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={employee.name} size="md" />
          <div>
            <h3 className="text-sm font-medium text-gray-100 flex items-center gap-2">
              {employee.name}
              {employee.role === 'manager' && (
                <Shield size={12} className="text-blue-400" aria-label="Manager" />
              )}
            </h3>
            <p className="text-xs text-gray-500 capitalize">{employee.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={employee.status === 'active' ? 'success' : 'danger'} dot>
            {employee.status === 'active' ? 'Active' : 'Blocked'}
          </Badge>
          <DropdownMenu items={menuItems} className="opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100" />
        </div>
      </div>

      <div className="mt-auto space-y-2 pt-4 border-t border-white/[0.04]">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Mail size={14} className="shrink-0 text-gray-500" />
          <span className="truncate">{employee.email}</span>
        </div>
        {employee.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Phone size={14} className="shrink-0 text-gray-500" />
            <span className="truncate">{employee.phone}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
