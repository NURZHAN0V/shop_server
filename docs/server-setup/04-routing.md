# Роутинг

Создание маршрутов API с валидацией и обработкой запросов.

## Структура роутинга

**Местоположение:** `src/routes/`

```
routes/
├── user.ts              # Маршруты пользователей
├── product.ts           # Маршруты товаров (пример)
└── index.ts             # Объединение всех маршрутов (опционально)
```

## Шаг 1: Создание схемы валидации

**Местоположение:** `src/schemas/user.ts`

```typescript
import { z } from 'zod';

// Схема для создания пользователя
export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Имя обязательно'),
    email: z.string().email('Неверный формат email'),
    age: z.number().int().positive().optional(),
  }),
});

// Схема для получения пользователя
export const getUserSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID должен быть числом'),
  }),
});

// Схема для обновления пользователя
export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID должен быть числом'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    age: z.number().int().positive().optional(),
  }),
});

// Типы для TypeScript
export type CreateUserInput = z.infer<
  typeof createUserSchema
>['body'];
```

**Пояснение:**
- `z.object()` — создаёт схему объекта
- `body`, `params`, `query` — разделение по источникам данных
- Экспорт типов для использования в обработчиках

## Шаг 2: Создание роутера

**Местоположение:** `src/routes/user.ts`

```typescript
import { Router } from 'express';
import { validate } from '../middleware/validate';
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  type CreateUserInput,
} from '../schemas/user';

const router = Router();

// Создание пользователя
router.post(
  '/',
  validate(createUserSchema),
  async (req, res) => {
    const data: CreateUserInput = req.body;
    
    // Здесь будет логика создания пользователя
    res.status(201).json({ message: 'Пользователь создан', data });
  }
);

// Получение пользователя
router.get(
  '/:id',
  validate(getUserSchema),
  async (req, res) => {
    const { id } = req.params;
    
    // Здесь будет логика получения пользователя
    res.json({ id, message: 'Пользователь найден' });
  }
);

// Обновление пользователя
router.patch(
  '/:id',
  validate(updateUserSchema),
  async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    
    // Здесь будет логика обновления пользователя
    res.json({ id, data, message: 'Пользователь обновлён' });
  }
);

// Удаление пользователя
router.delete(
  '/:id',
  validate(getUserSchema), // Используем ту же схему для params
  async (req, res) => {
    const { id } = req.params;
    
    // Здесь будет логика удаления пользователя
    res.status(204).send();
  }
);

export default router;
```

**Пояснение:**
- `Router()` — создаёт новый роутер
- `validate()` — middleware для валидации перед обработкой
- `async` — обработчики могут быть асинхронными
- Экспорт роутера для подключения в `index.ts`

## Шаг 3: Подключение роутера

**Местоположение:** `src/index.ts`

Роутер подключается к приложению в том же файле, где создаётся `app`:

```typescript
import userRouter from './routes/user';

// … после создания app и middleware …
app.use('/api/users', userRouter);
// …
```

Полный пример точки входа — см. текущий `src/index.ts` (приложение, маршруты и запуск сервера в одном файле). Запуск:

```typescript
const server = app.listen(env.PORT, () => {
  console.log(`Сервер запущен на http://localhost:${env.PORT}`);
});
```

**Пояснение:**
- `app.use('/api/users', userRouter)` — все маршруты из роутера будут доступны по префиксу `/api/users`
- Порядок подключения важен (специфичные маршруты должны быть выше общих)

## Шаг 4: Работа с базой данных

**Местоположение:** `src/routes/user.ts` (обновлённая версия)

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
import { logger } from '../lib/logger';

const router = Router();

// Создание пользователя
router.post(
  '/',
  validate(createUserSchema),
  async (req, res) => {
    try {
      const data: CreateUserInput = req.body;
      const user = await prisma.user.create({ data });
      
      logger.info({ userId: user.id }, 'Пользователь создан');
      res.status(201).json(user);
    } catch (error) {
      logger.error({ error }, 'Ошибка при создании пользователя');
      throw error; // Передаём в errorHandler
    }
  }
);

// Получение пользователя
router.get(
  '/:id',
  validate(getUserSchema),
  async (req, res) => {
    const { id } = req.params;

    try {
      const user = await prisma.user.findUnique({
        where: { id: Number(id) },
      });

      if (!user) {
        logger.warn({ userId: id }, 'Пользователь не найден');
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      res.json(user);
    } catch (error) {
      logger.error({ error }, 'Ошибка при получении пользователя');
      throw error;
    }
  }
);

// Обновление пользователя
router.patch(
  '/:id',
  validate(updateUserSchema),
  async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    try {
      const user = await prisma.user.update({
        where: { id: Number(id) },
        data,
      });

      res.json(user);
    } catch (error) {
      logger.error({ error }, 'Ошибка при обновлении пользователя');
      throw error;
    }
  }
);

// Удаление пользователя
router.delete(
  '/:id',
  validate(getUserSchema),
  async (req, res) => {
    const { id } = req.params;

    try {
      await prisma.user.delete({
        where: { id: Number(id) },
      });

      res.status(204).send();
    } catch (error) {
      logger.error({ error }, 'Ошибка при удалении пользователя');
      throw error;
    }
  }
);

export default router;
```

**Пояснение:**
- `prisma.user.create()` — создание записи
- `prisma.user.findUnique()` — поиск по уникальному полю
- `prisma.user.update()` — обновление записи
- `prisma.user.delete()` — удаление записи
- Обработка ошибок через `try/catch` и передача в `errorHandler`

## Шаг 5: Создание дополнительных маршрутов

**Пример:** маршрут для получения списка пользователей

**Местоположение:** `src/routes/user.ts` (добавить перед `/:id`)

```typescript
// Получение списка пользователей
router.get(
  '/',
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        take: 10, // Лимит записей
        skip: 0,  // Пропустить записей (для пагинации)
      });

      res.json(users);
    } catch (error) {
      logger.error({ error }, 'Ошибка при получении списка пользователей');
      throw error;
    }
  }
);
```

**Пояснение:**
- `findMany()` — получение множества записей
- `take` и `skip` — для пагинации

## Проверка работоспособности

1. Запустите сервер:
```bash
npm run dev
```

2. Проверьте создание пользователя:
```bash
curl -X POST http://localhost:1480/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Иван","email":"ivan@example.com"}'
```

3. Проверьте получение пользователя:
```bash
curl http://localhost:1480/api/users/1
```

4. Проверьте валидацию (должна вернуться ошибка):
```bash
curl -X POST http://localhost:1480/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"invalid-email"}'
```

## Следующие шаги

- [Работа с БД](./05-database.md) — подробнее о Prisma и запросах
- [Middleware](./03-middleware.md) — дополнительные middleware для роутов
