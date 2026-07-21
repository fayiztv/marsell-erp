import { X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { ModalSize } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DialogAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  isLoading?: boolean;
  disabled?: boolean;
}

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: ModalSize;
  children?: React.ReactNode;
  /** Footer action buttons (right-aligned) */
  actions?: DialogAction[];
  /** Prevent close on backdrop click */
  disableBackdropClose?: boolean;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  actions,
  disableBackdropClose = false,
  className,
}: DialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      disableBackdropClose={disableBackdropClose}
      className={className}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-100 leading-snug">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-400 leading-relaxed">{description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className={cn(
            'shrink-0 size-8 rounded-lg flex items-center justify-center',
            'text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]',
            'transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
          )}
        >
          <X size={16} />
        </button>
      </div>

      {/* Divider */}
      {children && <div className="h-px bg-white/[0.06] mx-6" />}

      {/* Body */}
      {children && <div className="px-6 py-5">{children}</div>}

      {/* Footer */}
      {actions && actions.length > 0 && (
        <>
          <div className="h-px bg-white/[0.06] mx-6" />
          <div className="flex items-center justify-end gap-2 px-6 py-4">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant ?? 'secondary'}
                onClick={action.onClick}
                isLoading={action.isLoading}
                disabled={action.disabled}
                size="md"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
