import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, Input, Textarea } from '@/components/ui';
import {
  departmentSchema,
  type DepartmentFormData,
} from '../validation/departmentSchema';
import type { Department } from '../types/department.types';

interface DepartmentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DepartmentFormData) => Promise<void>;
  isLoading: boolean;
  initialData?: Department | null | undefined;
}

export function DepartmentFormDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  initialData,
}: DepartmentFormDialogProps) {
  const isEditing = Boolean(initialData);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        code: initialData.code,
        description: initialData.description || '',
      });
    } else {
      reset({
        name: '',
        code: '',
        description: '',
      });
    }
  }, [initialData, reset, isOpen]);

  const handleFormSubmit = async (data: DepartmentFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Department' : 'Create Department'}
      description={
        isEditing
          ? 'Update the department configuration and metadata.'
          : 'Define a new organizational department for assigning employees and tickets.'
      }
      actions={[
        {
          label: 'Cancel',
          variant: 'ghost',
          onClick: onClose,
          disabled: isLoading,
        },
        {
          label: isEditing ? 'Save Changes' : 'Create Department',
          variant: 'primary',
          onClick: handleSubmit(handleFormSubmit),
          isLoading,
        },
      ]}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Department Name"
          placeholder="e.g. Finance & Accounting"
          required
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Department Code"
          placeholder="e.g. FIN"
          required
          error={errors.code?.message}
          helperText="Unique uppercase identifier (2-10 characters, letters/numbers/dashes)"
          {...register('code')}
        />

        <Textarea
          label="Description (Optional)"
          placeholder="Describe the department's responsibilities or operational scope..."
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />
      </form>
    </Dialog>
  );
}
