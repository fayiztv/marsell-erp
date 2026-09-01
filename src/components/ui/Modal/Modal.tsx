import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { backdropVariants, modalVariants } from '@/utils/animations';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize | undefined;
  /** Prevent closing on backdrop click */
  disableBackdropClose?: boolean | undefined;
  className?: string | undefined;
}

// ─── Style maps ──────────────────────────────────────────────────────────────

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-48px)]',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Modal({
  isOpen,
  onClose,
  children,
  size = 'md',
  disableBackdropClose = false,
  className,
}: ModalProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        // Backdrop
        <motion.div
          key="modal-backdrop"
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={disableBackdropClose ? undefined : onClose}
          className={cn(
            'fixed inset-0 z-50',
            'flex items-center justify-center',
            'p-4 sm:p-6',
            'bg-black/60 backdrop-blur-sm',
          )}
          aria-modal="true"
          role="dialog"
        >
          {/* Content — stop click propagation so backdrop click doesn't trigger inside */}
          <motion.div
            key="modal-content"
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'w-full relative flex flex-col max-h-[90vh]',
              'bg-gray-900 border border-white/[0.09]',
              'rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden',
              sizeStyles[size],
              className,
            )}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
