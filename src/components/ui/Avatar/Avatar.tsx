import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/formatUtils';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Deterministic color from a name — picks one of 8 curated dark-theme colors */
function getAvatarColor(name: string): string {
  const colors = [
    'from-blue-600 to-blue-700',
    'from-violet-600 to-violet-700',
    'from-emerald-600 to-emerald-700',
    'from-amber-600 to-amber-700',
    'from-rose-600 to-rose-700',
    'from-cyan-600 to-cyan-700',
    'from-fuchsia-600 to-fuchsia-700',
    'from-indigo-600 to-indigo-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] ?? colors[0]!;
}

// ─── Style maps ──────────────────────────────────────────────────────────────

const sizeStyles: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: 'size-6', text: 'text-[10px]' },
  sm: { container: 'size-8', text: 'text-xs' },
  md: { container: 'size-9', text: 'text-sm' },
  lg: { container: 'size-11', text: 'text-base' },
  xl: { container: 'size-14', text: 'text-lg' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const { container, text } = sizeStyles[size];
  const initials = getInitials(name);
  const gradientColor = getAvatarColor(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover ring-2 ring-white/[0.08] shrink-0',
          container,
          className,
        )}
      />
    );
  }

  return (
    <div
      aria-label={name}
      title={name}
      className={cn(
        'rounded-full shrink-0',
        'bg-gradient-to-br',
        gradientColor,
        'flex items-center justify-center',
        'ring-2 ring-white/[0.08]',
        'font-semibold text-white select-none',
        container,
        text,
        className,
      )}
    >
      {initials}
    </div>
  );
}
