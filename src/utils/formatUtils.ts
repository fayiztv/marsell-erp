/**
 * String and display formatting utilities.
 */

/** Returns initials from a full name. "John Doe" → "JD" */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

/** Truncates a string to maxLength and appends ellipsis if needed */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength).trimEnd()}…`;
}

/** Capitalizes the first letter of a string */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Converts snake_case to Title Case. "in_progress" → "In Progress" */
export function snakeToTitle(str: string): string {
  return str
    .split('_')
    .map((word) => capitalize(word))
    .join(' ');
}
