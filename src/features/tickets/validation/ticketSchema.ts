import { z } from 'zod';

export const ticketFormSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Please provide a detailed description'),
  clientId: z.string().min(1, 'Please select a client'),
  assignedToId: z.string().min(1, 'Please assign an employee'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.date().optional(),
});

export type TicketFormData = z.infer<typeof ticketFormSchema>;
