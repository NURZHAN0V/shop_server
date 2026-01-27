import { z } from 'zod';

// Схема для создания пользователя
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Некорректный email'),
    name: z.string().min(2, 'Имя должно быть минимум 2 символа'),
    password: z.string().min(8, 'Пароль должен быть минимум 8 символов'),
  }),
});

// Схема для обновления пользователя по id
export const updateUserSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive('ID должен быть положительным числом'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
  }),
});

// Схема для обновления текущего пользователя (PATCH /me)
export const updateMeSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Имя должно быть минимум 2 символа').optional(),
  }),
});

// Схема для получения пользователя
export const getUserSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive('ID должен быть положительным числом'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Пароль должен быть минимум 8 символов'),
  }),
});

// Типы для использования в контроллерах
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];

