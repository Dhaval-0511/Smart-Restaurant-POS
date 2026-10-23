import { z } from 'zod';

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-]).{8,}$/;

export const registerValidator = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      PASSWORD_REGEX,
      'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
    ),
  role: z.enum(['ADMIN', 'EMPLOYEE', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'INVENTORY_MANAGER', 'CASHIER', 'KITCHEN_STAFF']).optional().default('EMPLOYEE'),
});

export const loginValidator = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateUserValidator = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE']).optional(),
  isArchived: z.boolean().optional(),
});
