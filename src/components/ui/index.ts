/**
 * Design System — barrel export for all shared UI components.
 * Always import UI components from '@/components/ui', never from deep paths.
 *
 * @example
 * import { Button, Input, Card, StatusBadge } from '@/components/ui';
 */

// ─── Form Controls ────────────────────────────────────────────────────────────
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';

export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

export { DatePicker } from './DatePicker';
export type { DatePickerProps } from './DatePicker';

// ─── Layout & Containers ─────────────────────────────────────────────────────
export { Card } from './Card';
export type { CardProps, CardPadding } from './Card';

export { Modal } from './Modal';
export type { ModalProps, ModalSize } from './Modal';

export { Dialog } from './Dialog';
export type { DialogProps, DialogAction } from './Dialog';

export { ConfirmationDialog } from './ConfirmationDialog';
export type { ConfirmationDialogProps, ConfirmationVariant } from './ConfirmationDialog';

// ─── Data Display ─────────────────────────────────────────────────────────────
export { Avatar } from './Avatar';
export type { AvatarProps, AvatarSize } from './Avatar';

export { Badge } from './Badge';
export type { BadgeProps, BadgeVariant } from './Badge';

export { PriorityBadge } from './PriorityBadge';
export type { PriorityBadgeProps } from './PriorityBadge';

export { StatusBadge } from './StatusBadge';
export type { StatusBadgeProps } from './StatusBadge';

// ─── Navigation & List Controls ───────────────────────────────────────────────
export { Pagination } from './Pagination';
export type { PaginationProps } from './Pagination';

export { SearchBar } from './SearchBar';
export type { SearchBarProps } from './SearchBar';

// ─── Feedback & State ─────────────────────────────────────────────────────────
export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export {
  LoadingSkeleton,
  SkeletonList,
  CardSkeleton,
  CardSkeletonList,
  StatCardSkeleton,
} from './LoadingSkeleton';
export type { LoadingSkeletonProps } from './LoadingSkeleton';

export { Toast, ToastContainer } from './Toast';
export type { ToastProps } from './Toast';
