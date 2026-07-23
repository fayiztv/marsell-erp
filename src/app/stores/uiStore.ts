import { create } from 'zustand';
import type { DialogType, TicketFilters, EmployeeFilters, ClientFilters } from '@/types';

const DEFAULT_TICKET_FILTERS: TicketFilters = {
  status: null,
  priority: null,
  clientId: null,
  assignedToId: null,
  search: '',
};

const DEFAULT_EMPLOYEE_FILTERS: EmployeeFilters = {
  role: null,
  status: null,
  search: '',
};

const DEFAULT_CLIENT_FILTERS: ClientFilters = {
  status: null,
  search: '',
};

interface UIStore {
  // Sidebar state
  isSidebarCollapsed: boolean;

  // Filter state (per module)
  ticketFilters: TicketFilters;
  employeeFilters: EmployeeFilters;
  clientFilters: ClientFilters;

  // Dialog state
  activeDialog: DialogType;
  dialogPayload: unknown;

  // Actions — Sidebar
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Actions — Ticket filters
  setTicketFilters: (filters: Partial<TicketFilters>) => void;
  resetTicketFilters: () => void;

  // Actions — Employee filters
  setEmployeeFilters: (filters: Partial<EmployeeFilters>) => void;
  resetEmployeeFilters: () => void;

  // Actions — Client filters
  setClientFilters: (filters: Partial<ClientFilters>) => void;
  resetClientFilters: () => void;

  // Actions — Dialog
  openDialog: (dialog: Exclude<DialogType, null>, payload?: unknown) => void;
  closeDialog: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  isSidebarCollapsed: false,
  ticketFilters: DEFAULT_TICKET_FILTERS,
  employeeFilters: DEFAULT_EMPLOYEE_FILTERS,
  clientFilters: DEFAULT_CLIENT_FILTERS,
  activeDialog: null,
  dialogPayload: undefined,

  // Sidebar
  toggleSidebarCollapsed: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  // Ticket filters
  setTicketFilters: (filters) =>
    set((state) => ({ ticketFilters: { ...state.ticketFilters, ...filters } })),
  resetTicketFilters: () => set({ ticketFilters: DEFAULT_TICKET_FILTERS }),

  // Employee filters
  setEmployeeFilters: (filters) =>
    set((state) => ({ employeeFilters: { ...state.employeeFilters, ...filters } })),
  resetEmployeeFilters: () => set({ employeeFilters: DEFAULT_EMPLOYEE_FILTERS }),

  // Client filters
  setClientFilters: (filters) =>
    set((state) => ({ clientFilters: { ...state.clientFilters, ...filters } })),
  resetClientFilters: () => set({ clientFilters: DEFAULT_CLIENT_FILTERS }),

  // Dialog
  openDialog: (dialog, payload) => set({ activeDialog: dialog, dialogPayload: payload }),
  closeDialog: () => set({ activeDialog: null, dialogPayload: undefined }),
}));
