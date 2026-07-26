import { z } from "zod";

export const employeeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits")
    .optional()
    .or(z.literal("")),
  role: z.enum(["manager", "employee"]),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
});

export type EmployeeFormData = z.infer<typeof employeeFormSchema>;
