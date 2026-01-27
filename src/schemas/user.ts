import { z } from 'zod';

// Схема для создания пользователя
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

// Схема для обновления пользователя по id
export const updateUserSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive('ID must be a positive number'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
  }),
});

// Схема для обновления текущего пользователя (PATCH /me)
export const updateMeSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  }),
});

// Схема для получения пользователя
export const getUserSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive('ID must be a positive number'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

// Типы для использования в контроллерах
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];

