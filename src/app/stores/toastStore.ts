import { create } from 'zustand';
import { nanoid } from 'nanoid';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number; // make optional for loading
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<Toast>) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = nanoid();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  updateToast: (id, updatedToast) =>
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, ...updatedToast } : t
      ),
    })),
}));
