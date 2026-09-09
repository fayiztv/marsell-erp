import { z } from 'zod';

export const commentSchema = z.object({
  text: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be 1000 characters or fewer'),
});

export type CommentFormData = z.infer<typeof commentSchema>;
