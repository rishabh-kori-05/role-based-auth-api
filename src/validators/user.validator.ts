import { z } from 'zod';

export const updateRoleSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, 'User ID must be a positive integer')
      .transform(Number),
  }),
  body: z.object({
    role: z.enum(['admin', 'manager', 'user'], {
      required_error: 'Role is required',
      invalid_type_error: "Role must be 'admin', 'manager', or 'user'",
    }),
  }),
});
