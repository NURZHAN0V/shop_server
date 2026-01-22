import { z } from 'zod';

// Пагинация
export const paginationSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default(1),
    limit: z.string().transform(Number).default(10),
  }),
});

// Фильтрация
export const filterSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

// ID параметр
export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID должен быть валидным UUID'),
  }),
});