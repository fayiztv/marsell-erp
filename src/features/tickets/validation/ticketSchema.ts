import { z } from 'zod';

export const ticketFormSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Please provide a detailed description'),
  clientId: z.string().optional().or(z.literal('')),
  assignedToId: z.string().min(1, 'Please assign an employee'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().optional(),
});

export type TicketFormData = z.infer<typeof ticketFormSchema>;
