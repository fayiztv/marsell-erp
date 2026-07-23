import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ticketService } from '../services/ticketService';
import type { TicketFormData } from '../validation/ticketSchema';
import type { TicketFilters, TicketStatus } from '@/types';
import type { Ticket } from '../types/ticket.types';
import type { DocumentSnapshot } from 'firebase/firestore';
import { QUERY_KEYS, LIST_STALE_TIME_MS, PAGE_SIZE } from '@/constants';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

/**
 * Fetch tickets with pagination
 */
export function useTickets(filters: TicketFilters, cursor: DocumentSnapshot | null) {
  const { firebaseUser, role } = useAuth();
  
  // If employee, enforce restriction at query level too
  const employeeUid = role === 'employee' ? firebaseUser?.uid : undefined;

  return useQuery({
    queryKey: [...QUERY_KEYS.tickets.lists(), filters, cursor?.id, employeeUid],
    queryFn: () => ticketService.fetchTickets(filters, PAGE_SIZE, cursor, employeeUid),
    staleTime: LIST_STALE_TIME_MS,
    placeholderData: keepPreviousData,
    enabled: !!firebaseUser, // Wait until auth is resolved
  });
}

/**
 * Real-time subscription to a single ticket
 */
export function useTicketSubscription(id?: string) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    const unsubscribe = ticketService.subscribeToTicket(id, (t) => {
      setTicket(t);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  return { ticket, isLoading };
}

/**
 * Mutation: Create Ticket
 */
export function useCreateTicket() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { firebaseUser } = useAuth();

  return useMutation({
    mutationFn: (data: TicketFormData) => {
      if (!firebaseUser) throw new Error('Unauthenticated');
      return ticketService.createTicket(data, firebaseUser.uid);
    },
    onSuccess: () => {
      toast.success('Ticket created', 'The ticket has been added successfully.');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats });
    },
    onError: (error: any) => {
      toast.error('Creation failed', error.message || 'Could not create ticket.');
    },
  });
}

/**
 * Mutation: Update Ticket (Managers)
 */
export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TicketFormData }) =>
      ticketService.updateTicket(id, data),
    onSuccess: () => {
      toast.success('Ticket updated', 'Ticket details have been saved.');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats });
    },
    onError: (error: any) => {
      toast.error('Update failed', error.message || 'Could not update ticket.');
    },
  });
}

/**
 * Mutation: Update Ticket Status (Employees/Managers)
 */
export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      ticketService.updateTicketStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated', 'The ticket status was updated.');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats });
    },
    onError: (error: any) => {
      toast.error('Update failed', error.message || 'Could not update status.');
    },
  });
}

/**
 * Mutation: Delete Ticket
 */
export function useDeleteTicket() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (ticketId: string) => 
      toast.promise(ticketService.deleteTicket(ticketId), {
        loading: 'Deleting ticket...',
        success: 'The ticket has been deleted.',
        error: (error: any) => error.message || 'Could not delete ticket.',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tickets.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats });
    },
  });
}
