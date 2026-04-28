import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

export const emailSchema = z.object({
    email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    firstName: z.string().min(1, 'First name is required').max(45),
    lastName: z.string().min(1, 'Last name is required').max(45),
    salesRep: z.number().int().min(0).max(1).optional(),
    accessLevel: z.number().int().min(0).max(255).optional(),
    active: z.number().int().min(0).max(1).optional(),
});

export const updateUserSchema = z.object({
    id: z.number().int().positive('Invalid user ID'),
    email: z.string().email('Invalid email format').optional(),
    firstName: z.string().min(1).max(45).optional(),
    lastName: z.string().min(1).max(45).optional(),
    salesRep: z.number().int().min(0).max(1).optional(),
    accessLevel: z.number().int().min(0).max(255).optional(),
    active: z.number().int().min(0).max(1).optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const idParamSchema = z.object({
    id: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Invalid ID'),
});

export const searchSchema = z.object({
    pageNumber: z.coerce.number().int().positive().optional().default(1),
    pageSize: z.coerce.number().int().positive().max(100).optional().default(50),
    sortField: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type SearchInput = z.infer<typeof searchSchema>;