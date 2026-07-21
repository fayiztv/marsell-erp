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

  const show = (variant: ToastVariant, title: string, description?: string) => {
    const duration =
      variant === "success"
        ? TOAST_DURATION.SUCCESS
        : variant === "error"
          ? TOAST_DURATION.ERROR
          : variant === "warning"
            ? TOAST_DURATION.WARNING
            : TOAST_DURATION.INFO;

    addToast({
      variant,
      title,
      duration,
      ...(description !== undefined && { description }),
    });
  };

  return {
    success: (title: string, description?: string) =>
      show("success", title, description),
    error: (title: string, description?: string) =>
      show("error", title, description),
    warning: (title: string, description?: string) =>
      show("warning", title, description),
    info: (title: string, description?: string) =>
      show("info", title, description),
  };
}
