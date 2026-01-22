# Валидация с Zod

Использование Zod для валидации запросов, ответов и переменных окружения.

## Структура файлов

```
src/
├── config/
│   └── env.ts            → Валидация переменных окружения
├── schemas/
│   ├── user.ts           → Схемы валидации пользователя
│   └── common.ts         → Общие схемы
└── middleware/
    └── validate.ts       → Middleware для валидации
```

## 1. Валидация переменных окружения

**Расположение:** `src/config/env.ts`

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('1480'),
  DATABASE_URL: z.string().url('DATABASE_URL должен быть валидным URL'),
  CORS_ORIGIN: z.string().url().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET должен быть минимум 32 символа'),
});

export type Env = z.infer<typeof envSchema>;

// Валидация при импорте
export const env = envSchema.parse(process.env);
```

**Пояснение:** Zod проверяет типы и значения переменных окружения при старте приложения. Если какая-то переменная невалидна, приложение не запустится.

## 2. Создание схем валидации

**Расположение:** `src/schemas/user.ts`

```typescript
import { z } from 'zod';

// Схема для создания пользователя
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Некорректный email'),
    name: z.string().min(2, 'Имя должно быть минимум 2 символа'),
    age: z.number().int().min(18).max(120).optional(),
  }),
});

// Схема для обновления пользователя
export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID должен быть валидным UUID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    age: z.number().int().min(18).max(120).optional(),
  }),
});

// Схема для получения пользователя
export const getUserSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

// Типы для использования в контроллерах
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
```

**Пояснение:** Схемы определяют структуру и правила валидации для запросов. Можно валидировать `body`, `params`, `query` отдельно.

## 3. Общие схемы

**Расположение:** `src/schemas/common.ts`

```typescript
import { z } from 'zod';

// Пагинация
export const paginationSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('10'),
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
```

**Пояснение:** Общие схемы можно переиспользовать в разных маршрутах для стандартизации валидации.

## 4. Middleware для валидации

**Расположение:** `src/middleware/validate.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../lib/logger';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Валидируем весь запрос (body, params, query)
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ errors: error.errors }, 'Ошибка валидации');
        return res.status(400).json({
          error: 'Ошибка валидации',
          details: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};
```

**Пояснение:** Middleware `validate` принимает Zod схему и проверяет соответствие запроса этой схеме. При ошибке возвращает детальное описание проблем.

## 5. Использование в маршрутах

**Расположение:** `src/routes/user.ts`

```typescript
import { Router } from 'express';
import { validate } from '../middleware/validate';
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  type CreateUserInput,
} from '../schemas/user';
import prisma from '../lib/prisma';

const router = Router();

// Создание пользователя
router.post(
  '/',
  validate(createUserSchema), // Валидация перед обработкой
  async (req, res) => {
    // TypeScript знает тип req.body благодаря схеме
    const data: CreateUserInput = req.body;

    const user = await prisma.user.create({
      data,
    });

    res.status(201).json(user);
  }
);

// Получение пользователя
router.get(
  '/:id',
  validate(getUserSchema),
  async (req, res) => {
    const { id } = req.params; // Уже валидирован как UUID

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(user);
  }
);

// Обновление пользователя
router.patch(
  '/:id',
  validate(updateUserSchema),
  async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    res.json(user);
  }
);

export default router;
```

**Пояснение:** Валидация происходит до выполнения логики контроллера. TypeScript автоматически выводит типы из схем, обеспечивая типобезопасность.

## 6. Валидация ответов (опционально)

**Расположение:** `src/middleware/validateResponse.ts`

Для валидации ответов сервера (рекомендуется для публичных API):

```typescript
import { Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validateResponse = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = (data: unknown) => {
      try {
        const validated = schema.parse(data);
        return originalJson(validated);
      } catch (error) {
        logger.error({ error }, 'Ошибка валидации ответа');
        return originalJson({ error: 'Ошибка формирования ответа' });
      }
    };

    next();
  };
};
```

**Пояснение:** Валидация ответов гарантирует, что API всегда возвращает данные в ожидаемом формате.

## Примеры схем для разных случаев

### Валидация email и пароля

```typescript
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Пароль должен быть минимум 8 символов'),
  }),
});
```

### Валидация с кастомными сообщениями

```typescript
export const productSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Название обязательно'),
    price: z.number().positive('Цена должна быть положительной'),
    category: z.enum(['electronics', 'clothing', 'food'], {
      errorMap: () => ({ message: 'Неверная категория' }),
    }),
  }),
});
```

### Валидация с трансформацией данных

```typescript
export const searchSchema = z.object({
  query: z.object({
    q: z.string().trim().toLowerCase(), // Автоматически обрезает и приводит к нижнему регистру
    page: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
});
```
