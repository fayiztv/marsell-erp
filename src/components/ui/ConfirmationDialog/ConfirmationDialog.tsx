import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ConfirmationVariant = 'danger' | 'warning';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmationVariant;
  isLoading?: boolean;
}

// ─── Style config ─────────────────────────────────────────────────────────────

const variantConfig: Record<
  ConfirmationVariant,
  { iconBg: string; iconColor: string; Icon: typeof Trash2 }
> = {
  danger: {
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-400',
    Icon: Trash2,
  },
  warning: {
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    Icon: AlertTriangle,
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmationDialogProps) {
  const { iconBg, iconColor, Icon } = variantConfig[variant];

  async function handleConfirm() {
    await onConfirm();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" disableBackdropClose={isLoading}>
      <div className="p-6 flex flex-col items-center text-center gap-4">
        {/* Icon */}
        <div className={cn('size-12 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon size={22} className={iconColor} />
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-gray-100">{title}</h3>
          <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full pt-1">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'outline'}
            size="md"
            onClick={handleConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
