import { useQuery } from '@tanstack/react-query';
import { ticketService } from '../services/ticketService';
import { useAuth } from '@/hooks/useAuth';

export function useEmployeePendingTicketsCount() {
  const { firebaseUser, role } = useAuth();
  const employeeUid = firebaseUser?.uid;

  return useQuery({
    queryKey: ['tickets', 'pendingCount', employeeUid],
    queryFn: () => ticketService.getEmployeePendingCount(employeeUid!),
    enabled: !!employeeUid && role === 'employee',
    staleTime: 30000,
  });
}
