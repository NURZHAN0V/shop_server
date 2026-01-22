# Конфигурация сервера

Настройка переменных окружения и валидации конфигурации.

## Шаг 1: Создание файла переменных окружения

**Местоположение:** `.env` (корень проекта)

```env
NODE_ENV=development
PORT=1480
DATABASE_URL=file:./.temp/database.db
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
```

**Пояснение:**
- `NODE_ENV` — окружение (development/production/test)
- `PORT` — порт сервера
- `DATABASE_URL` — URL базы данных
- `CORS_ORIGIN` — разрешённые источники для CORS
- `JWT_SECRET` — секретный ключ для JWT (минимум 32 символа)

## Шаг 2: Создание схемы валидации

**Местоположение:** `src/config/env.ts`

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

**Пояснение:**
- `z.object()` — создаёт схему объекта
- `z.enum()` — ограничивает значения списком
- `z.string().regex()` — проверяет формат строки
- `transform()` — преобразует значение (строка → число)
- `parse()` — валидирует и выбрасывает ошибку при несоответствии

## Шаг 3: Использование конфигурации

**Местоположение:** `src/index.ts`

```typescript
import 'dotenv/config';
import app from './app';
import { env } from './config/env';

app.get('/', (_, res) => {
  res.json({ message: 'Сервер работает!' });
});

const server = app.listen(env.PORT, () => {
  console.log(`Сервер запущен на http://localhost:${env.PORT}`);
});
```

**Пояснение:**
- `env.PORT` — типобезопасный доступ к порту
- При отсутствии или неверном значении переменной приложение не запустится

## Шаг 4: Добавление новых переменных

**Пример:** добавление переменной для логирования

**Местоположение:** `src/config/env.ts`

```typescript
const envSchema = z.object({
  // ... существующие переменные ...
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});
```

**Местоположение:** `.env`

```env
LOG_LEVEL=debug
```

## Проверка работоспособности

1. Убедитесь, что файл `.env` существует и содержит все обязательные переменные
2. Запустите сервер:
```bash
npm run dev
```

3. Если переменная отсутствует или неверна, приложение выдаст ошибку валидации

## Обработка ошибок валидации

При ошибке валидации Zod выведет понятное сообщение:

```
Error: [
  {
    "code": "too_small",
    "minimum": 32,
    "type": "string",
    "path": ["JWT_SECRET"],
    "message": "JWT_SECRET должен быть минимум 32 символа"
  }
]
```

## Следующие шаги

- [Middleware](./03-middleware.md) — использование конфигурации в middleware
- [Работа с БД](./05-database.md) — настройка подключения к БД
