import { useEffect, useRef, useState } from 'react';
import { SEARCH_DEBOUNCE_MS } from '@/constants';

/**
 * Debounces a value by the given delay.
 * Default delay is SEARCH_DEBOUNCE_MS (300ms) — suitable for search inputs.
 *
 * @example
 * const debouncedSearch = useDebounce(searchInput);
 */
export function useDebounce<T>(value: T, delay: number = SEARCH_DEBOUNCE_MS): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Returns a stable debounced callback function.
 * Useful for debouncing event handlers without creating new instances.
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number = SEARCH_DEBOUNCE_MS,
): (...args: Parameters<T>) => void {
  const callbackRef = useRef<T>(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the ref current without triggering re-renders
  useEffect(() => {
    callbackRef.current = callback;
  });

  return (...args: Parameters<T>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
  };
}
