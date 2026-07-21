/**
 * TanStack Query key factories.
 * Centralizing keys ensures consistent cache invalidation across the app.
 * Always use these factories — never raw strings — in useQuery / invalidateQueries.
 */
export const QUERY_KEYS = {
  // Users / Employees
  users: {
    all: ['users'] as const,
    lists: () => [...QUERY_KEYS.users.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...QUERY_KEYS.users.lists(), filters] as const,
    detail: (uid: string) => [...QUERY_KEYS.users.all, 'detail', uid] as const,
  },

  // Clients
  clients: {
    all: ['clients'] as const,
    lists: () => [...QUERY_KEYS.clients.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...QUERY_KEYS.clients.lists(), filters] as const,
    detail: (id: string) => [...QUERY_KEYS.clients.all, 'detail', id] as const,
  },

  // Tickets
  tickets: {
    all: ['tickets'] as const,
    lists: () => [...QUERY_KEYS.tickets.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...QUERY_KEYS.tickets.lists(), filters] as const,
    detail: (id: string) => [...QUERY_KEYS.tickets.all, 'detail', id] as const,
  },

  // Dashboard stats
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
  },
} as const;
