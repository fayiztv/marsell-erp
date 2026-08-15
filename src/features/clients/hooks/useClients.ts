import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { clientService } from '../services/clientService';
import type { ClientFormData } from '../validation/clientSchema';
import type { ClientFilters } from '@/types';
import type { DocumentSnapshot } from 'firebase/firestore';
import { QUERY_KEYS, LIST_STALE_TIME_MS, PAGE_SIZE } from '@/constants';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

/**
 * Fetch clients with pagination
 */
export function useClients(
  filters: ClientFilters, 
  cursor: DocumentSnapshot | null,
  pageSize: number = PAGE_SIZE
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.clients.lists(), filters, cursor?.id, pageSize],
    queryFn: () => clientService.fetchClients(filters, pageSize, cursor),
    staleTime: LIST_STALE_TIME_MS,
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetch a single client by ID
 */
export function useClient(id?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.clients.detail(id || '')],
    queryFn: () => {
      if (!id) throw new Error('Client ID is required');
      return clientService.fetchClientById(id);
    },
    enabled: !!id,
    staleTime: LIST_STALE_TIME_MS,
  });
}

/**
 * Mutation: Create Client
 */
export function useCreateClient() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { firebaseUser } = useAuth();

  return useMutation({
    mutationFn: (data: ClientFormData) => {
      if (!firebaseUser) throw new Error('Unauthenticated');
      return clientService.createClient(data, firebaseUser.uid);
    },
    onSuccess: () => {
      toast.success('Client created', 'The client has been added successfully.');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats });
    },
    onError: (error: any) => {
      toast.error('Creation failed', error.message || 'Could not create client.');
    },
  });
}

/**
 * Mutation: Update Client
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientFormData }) =>
      clientService.updateClient(id, data),
    onSuccess: () => {
      toast.success('Client updated', 'Client details have been saved.');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats });
    },
    onError: (error: any) => {
      toast.error('Update failed', error.message || 'Could not update client.');
    },
  });
}

/**
 * Mutation: Update Client Status
 */
export function useUpdateClientStatus() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      clientService.updateClientStatus(id, status),
    onSuccess: (_, variables) => {
      const action = variables.status === 'active' ? 'activated' : 'deactivated';
      toast.success('Status updated', `Client has been ${action}.`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats });
    },
    onError: (error: any) => {
      toast.error('Status update failed', error.message || 'Could not update status.');
    },
  });
}

/**
 * Mutation: Delete Client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { firebaseUser } = useAuth();

  return useMutation({
    mutationFn: (id: string) => {
      if (!firebaseUser) throw new Error('Unauthenticated');
      return toast.promise(clientService.deleteClient(id, firebaseUser.uid), {
        loading: 'Deleting client...',
        success: 'The client has been removed.',
        error: (error: any) => error.message || 'Could not delete client.',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats });
    },
  });
}
