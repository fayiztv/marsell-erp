import { ConfirmationDialog } from '@/components/ui';
import type { DeletionEntityType } from '../types/approval.types';

interface DirectDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  entityType: DeletionEntityType;
  entityName: string;
  isLoading?: boolean;
}

export function DirectDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  entityType,
  entityName,
  isLoading = false,
}: DirectDeleteDialogProps) {
  const entityLabels: Record<DeletionEntityType, string> = {
    employee: 'User / Employee',
    client: 'Client Company',
    ticket: 'Support Ticket',
  };

  const entityWarning: Record<DeletionEntityType, string> = {
    employee:
      'This will delete the user authentication account, revoke their roles, and remove their record. They cannot have active assigned tickets.',
    client:
      'This will permanently delete this client. All associated tickets must be resolved or reassigned first.',
    ticket:
      'This will permanently delete this ticket and update department metrics.',
  };

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Delete ${entityLabels[entityType]}?`}
      description={`Are you sure you want to permanently delete "${entityName}"? ${entityWarning[entityType]}`}
      confirmLabel="Delete Immediately"
      variant="danger"
      isLoading={isLoading}
    />
  );
}
