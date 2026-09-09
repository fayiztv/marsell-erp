import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { commentService } from '../services/commentService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import type { TicketComment } from '../types/comment.types';

/**
 * Live subscription to a ticket's comments via onSnapshot.
 * Consistent with the project pattern: onSnapshot for bounded single-ticket views.
 */
export function useComments(ticketId: string | undefined) {
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ticketId) return;
    setIsLoading(true);
    setError(null);

    const unsubscribe = commentService.subscribeToComments(
      ticketId,
      (data) => {
        setComments(data);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ticketId]);

  return { comments, isLoading, error };
}

/**
 * Mutation to post a new comment.
 */
export function useAddComment(ticketId: string | undefined) {
  const { firebaseUser, role, name } = useAuth();
  const toast = useToast();

  return useMutation({
    mutationFn: async (text: string) => {
      if (!ticketId || !firebaseUser || !role || !name) throw new Error('Not authenticated');
      await commentService.addComment(ticketId, text, {
        uid: firebaseUser.uid,
        name,
        role: role as 'admin' | 'manager' | 'employee',
      });
    },
    onError: (err: Error) => {
      toast.error('Failed to post comment', err.message || 'Please try again.');
    },
  });
}
