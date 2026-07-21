import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/utils/cn';
import { toastVariants } from '@/utils/animations';
import { useToastStore } from '@/app/stores/toastStore';
import type { Toast as ToastType, ToastVariant } from '@/app/stores/toastStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const variantConfig: Record<
  ToastVariant,
  {
    icon: typeof CheckCircle2;
    iconColor: string;
    borderColor: string;
    glowColor: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    glowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.08)]',
  },
  error: {
    icon: XCircle,
    iconColor: 'text-red-400',
    borderColor: 'border-red-500/20',
    glowColor: 'shadow-[0_0_20px_rgba(239,68,68,0.08)]',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    glowColor: 'shadow-[0_0_20px_rgba(245,158,11,0.08)]',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
    glowColor: 'shadow-[0_0_20px_rgba(59,130,246,0.08)]',
  },
};

// ─── Single Toast ─────────────────────────────────────────────────────────────

export function Toast({ toast, onDismiss }: ToastProps) {
  const { icon: Icon, iconColor, borderColor, glowColor } = variantConfig[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'flex items-start gap-3 w-full max-w-sm',
        'px-4 py-3.5 rounded-xl',
        'bg-gray-900 border',
        'shadow-[0_8px_32px_rgba(0,0,0,0.6)]',
        borderColor,
        glowColor,
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <Icon size={18} className={cn('shrink-0 mt-0.5', iconColor)} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-100 leading-snug">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">{toast.description}</p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className={cn(
          'shrink-0 size-5 rounded flex items-center justify-center',
          'text-gray-600 hover:text-gray-300',
          'transition-colors duration-100',
        )}
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

// ─── Toast Container ──────────────────────────────────────────────────────────

/**
 * ToastContainer — renders fixed to the bottom-right of the viewport.
 * Mount once at the app root level inside AppProviders.
 */
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className={cn(
        'fixed bottom-4 right-4 z-[100]',
        'flex flex-col gap-2 items-end',
        'pointer-events-none',
      )}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full max-w-sm">
          <Toast toast={toast} onDismiss={removeToast} />
        </div>
      ))}
    </div>
  );
}
