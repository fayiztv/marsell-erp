import { z } from 'zod';

export const ticketFormSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Please provide a detailed description'),
  departmentIds: z.array(z.string()).length(1, 'Select a department'),
  assignedToIds: z.array(z.string()).length(1, 'Assign an employee'),
  clientIds: z.array(z.string()),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().optional(),
});

export type TicketFormData = z.infer<typeof ticketFormSchema>;
