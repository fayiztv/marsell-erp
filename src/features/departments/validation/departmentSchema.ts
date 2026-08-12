import { z } from 'zod';

export const departmentSchema = z.object({
  name: z
    .string()
    .min(2, 'Department name must be at least 2 characters')
    .max(50, 'Department name cannot exceed 50 characters'),
  code: z
    .string()
    .min(2, 'Department code must be at least 2 characters')
    .max(10, 'Department code cannot exceed 10 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code can only contain letters, numbers, hyphens, and underscores')
    .transform((val) => val.toUpperCase()),
  description: z
    .string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional()
    .or(z.literal('')),
});

export type DepartmentFormData = z.infer<typeof departmentSchema>;
