import { useToastStore, type ToastVariant } from "@/app/stores/toastStore";
import { TOAST_DURATION } from "@/constants";

/**
 * Convenience hook for triggering toast notifications.
 *
 * @example
 * const toast = useToast();
 * toast.success('Employee created successfully');
 * toast.error('Something went wrong', 'Please try again later');
 */
export function useToast() {
  const addToast = useToastStore((s) => s.addToast);
  const updateToast = useToastStore((s) => s.updateToast);
  const removeToast = useToastStore((s) => s.removeToast);

  const show = (variant: ToastVariant, title: string, description?: string, id?: string) => {
    const duration =
      variant === "success"
        ? TOAST_DURATION.SUCCESS
        : variant === "error"
          ? TOAST_DURATION.ERROR
          : variant === "warning"
            ? TOAST_DURATION.WARNING
        : variant === "loading"
          ? 0 // loading doesn't auto-dismiss
          : TOAST_DURATION.INFO;

    const payload = {
      variant,
      title,
      duration,
      ...(description !== undefined && { description }),
    };

    if (id) {
      updateToast(id, payload);
      return id;
    }
    return addToast(payload);
  };

  return {
    success: (title: string, description?: string, id?: string) =>
      show("success", title, description, id),
    error: (title: string, description?: string, id?: string) =>
      show("error", title, description, id),
    warning: (title: string, description?: string, id?: string) =>
      show("warning", title, description, id),
    info: (title: string, description?: string, id?: string) =>
      show("info", title, description, id),
    loading: (title: string, description?: string, id?: string) =>
      show("loading", title, description, id),
    dismiss: (id: string) => removeToast(id),
    promise: async <T>(
      promise: Promise<T>,
      msgs: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: any) => string);
      }
    ) => {
      const id = show("loading", msgs.loading);
      try {
        const data = await promise;
        const successMsg =
          typeof msgs.success === "function" ? msgs.success(data) : msgs.success;
        show("success", successMsg, undefined, id);
        return data;
      } catch (err: any) {
        const errorMsg =
          typeof msgs.error === "function" ? msgs.error(err) : msgs.error;
        show("error", "Failed", errorMsg, id);
        throw err;
      }
    },
  };
}
