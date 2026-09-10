import React from 'react';
import {
  PlusCircle,
  ArrowRightLeft,
  Pencil,
  AlertCircle,
} from 'lucide-react';

export function getHistoryActionIcon(action: string, size: number = 13): React.ReactNode {
  switch (action) {
    case 'ticket_created':
      return <PlusCircle size={size} className="text-emerald-400 shrink-0" />;
    case 'reassigned':
      return <ArrowRightLeft size={size} className="text-blue-400 shrink-0" />;
    case 'field_updated':
      return <Pencil size={size} className="text-amber-400 shrink-0" />;
    default:
      return <AlertCircle size={size} className="text-gray-500 shrink-0" />;
  }
}
