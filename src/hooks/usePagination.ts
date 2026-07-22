import { useState, useCallback } from 'react';
import type { DocumentSnapshot } from 'firebase/firestore';
import type { PaginationState } from '@/types';

/**
 * Hook to manage cursor-based pagination state for Firestore queries.
 *
 * It maintains an array of DocumentSnapshots representing the last document
 * of each page. The current cursor to pass to `startAfter` is `cursors[currentPage - 1]`.
 */
export function usePagination() {
  const [state, setState] = useState<PaginationState>({
    cursors: [null], // Page 1 has no starting cursor (null)
    currentPage: 1,
    hasMore: true,
  });

  const nextPage = useCallback((lastDoc: DocumentSnapshot | null) => {
    setState((prev) => {
      // If we already have the cursor for the next page, just increment page
      if (prev.cursors.length > prev.currentPage) {
        return { ...prev, currentPage: prev.currentPage + 1 };
      }

      // Otherwise, store the new cursor
      return {
        ...prev,
        cursors: [...prev.cursors, lastDoc],
        currentPage: prev.currentPage + 1,
      };
    });
  }, []);

  const previousPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentPage: Math.max(1, prev.currentPage - 1),
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      cursors: [null],
      currentPage: 1,
      hasMore: true,
    });
  }, []);

  const setHasMore = useCallback((hasMore: boolean) => {
    setState((prev) => (prev.hasMore === hasMore ? prev : { ...prev, hasMore }));
  }, []);

  // The cursor to pass into Firestore's `startAfter()`
  const currentCursor = state.cursors[state.currentPage - 1];

  return {
    currentPage: state.currentPage,
    hasMore: state.hasMore,
    currentCursor,
    nextPage,
    previousPage,
    reset,
    setHasMore,
    isFirstPage: state.currentPage === 1,
  };
}
