import { Building2, User, Mail, Phone } from 'lucide-react';
import { Input, Textarea, Button } from '@/components/ui';
import { useClientForm } from '../hooks/useClientForm';
import type { ClientFormData } from '../validation/clientSchema';

export interface ClientFormProps {
  defaultValues?: Partial<ClientFormData> | undefined;
  editId?: string | undefined;
  onCancel: () => void;
}

export function ClientForm({ defaultValues, editId, onCancel }: ClientFormProps) {
  const { form, onSubmit, isSubmitting, isEditing } = useClientForm(defaultValues, editId);
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {errors.root && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
          <p className="text-sm text-red-400">{errors.root.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Company Name"
          type="text"
          placeholder="Acme Corp"
          leftIcon={<Building2 size={15} />}
          error={errors.companyName?.message}
          disabled={isSubmitting}
          {...register('companyName')}
        />
        <Input
          label="Contact Person"
          type="text"
          placeholder="John Smith"
          leftIcon={<User size={15} />}
          error={errors.contactPerson?.message}
          disabled={isSubmitting}
          {...register('contactPerson')}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="john@acme.com"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          disabled={isSubmitting}
          {...register('email')}
        />
        <Input
          label="Phone Number"
          type="tel"
          placeholder="+1 (555) 000-0000"
          leftIcon={<Phone size={15} />}
          error={errors.phone?.message}
          disabled={isSubmitting}
          {...register('phone')}
        />
      </div>

      <Textarea
        label="Address (Optional)"
        placeholder="123 Main St, City, Country"
        rows={2}
        error={errors.address?.message}
        disabled={isSubmitting}
        {...register('address')}
      />

      <Textarea
        label="Notes (Optional)"
        placeholder="Any additional information..."
        rows={3}
        error={errors.notes?.message}
        disabled={isSubmitting}
        {...register('notes')}
      />

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.04]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditing ? 'Save Changes' : 'Create Client'}
        </Button>
      </div>
    </form>
  );
}
