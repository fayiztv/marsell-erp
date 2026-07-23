import { Building2, Mail, Phone, MapPin } from 'lucide-react';
import { Card, DropdownMenu, type DropdownMenuItem } from '@/components/ui';
import type { Client } from '../types/client.types';
interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onToggleStatus: (client: Client) => void;
}

export function ClientCard({ client, onEdit, onDelete, onToggleStatus }: ClientCardProps) {
  const isInactive = client.status === 'inactive';

  const menuItems: DropdownMenuItem[] = [
    { label: 'Edit Client', onClick: () => onEdit(client) },
    {
      label: isInactive ? 'Activate Client' : 'Deactivate Client',
      onClick: () => onToggleStatus(client),
      variant: isInactive ? 'default' : 'danger',
    },
    { label: 'Delete Client', onClick: () => onDelete(client), variant: 'danger' },
  ];

  return (
    <Card padding="md" hoverable className="group flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Building2 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-100">{client.companyName}</h3>
            <p className="text-xs text-gray-500">{client.contactPerson}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2 py-1 rounded-full text-[10px] font-medium tracking-wider uppercase bg-gray-900 border border-white/[0.04]">
            <span
              className={`size-1.5 rounded-full ${
                client.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
            <span className={client.status === 'active' ? 'text-emerald-400' : 'text-red-400'}>
              {client.status}
            </span>
          </div>
          <DropdownMenu
            items={menuItems}
            className="opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100"
          />
        </div>
      </div>

      <div className="mt-auto space-y-2 pt-4 border-t border-white/[0.04]">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Mail size={14} className="shrink-0 text-gray-500" />
          <span className="truncate">{client.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Phone size={14} className="shrink-0 text-gray-500" />
          <span className="truncate">{client.phone}</span>
        </div>
        {client.address && (
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <MapPin size={14} className="shrink-0 text-gray-500 mt-0.5" />
            <span className="line-clamp-2 leading-relaxed">{client.address}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
