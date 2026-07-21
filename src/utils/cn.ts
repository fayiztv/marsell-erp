import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Class name utility: merges clsx conditional classes with Tailwind's conflict resolution.
 * Always use this instead of manual string concatenation for Tailwind classes.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-brand-500', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
