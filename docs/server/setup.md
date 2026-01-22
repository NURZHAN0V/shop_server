# Настройка Express сервера

Полное руководство по созданию и настройке Express сервера с использованием современных инструментов безопасности, валидации и логирования.

## Структура проекта

```
src/
├── index.ts              → Точка входа сервера
├── app.ts                → Конфигурация Express приложения
├── config/
│   └── env.ts            → Валидация переменных окружения
├── middleware/
│   ├── cors.ts           → Настройка CORS
│   ├── helmet.ts         → Настройка Helmet
│   ├── compression.ts    → Настройка сжатия
│   ├── rateLimit.ts      → Настройка rate limiting
│   └── errorHandler.ts   → Обработка ошибок
├── lib/
│   ├── prisma.ts         → Подключение к БД
│   └── logger.ts         → Настройка Pino логгера
└── routes/
    └── index.ts          → Основные маршруты
```

## 1. Установка зависимостей

**Расположение:** `package.json`

```bash
npm install zod cors express-rate-limit pino pino-pretty compression helmet
npm install -D @types/cors @types/compression
```

## 2. Валидация переменных окружения

**Расположение:** `src/config/env.ts`

Создайте файл для валидации переменных окружения с помощью Zod:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('1480'),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
```

**Пояснение:** Zod проверяет типы и значения переменных окружения при старте приложения, предотвращая ошибки конфигурации.

## 3. Настройка логгера Pino

**Расположение:** `src/lib/logger.ts`

```typescript
import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
```

**Пояснение:** Pino — быстрый JSON-логгер. В development режиме использует pino-pretty для читаемого вывода, в production — JSON формат.

## 4. Создание Express приложения

**Расположение:** `src/app.ts`

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { logger } from './lib/logger';
import { env } from './config/env';

const app = express();

// Базовые middleware (порядок важен!)
app.use(helmet()); // Защита заголовков безопасности
app.use(compression()); // Сжатие ответов
app.use(express.json()); // Парсинг JSON
app.use(express.urlencoded({ extended: true })); // Парсинг URL-encoded

// CORS настройка
app.use(
  cors({
    origin: env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: 'Слишком много запросов, попробуйте позже',
});
app.use('/api/', limiter);

export default app;
```

**Пояснение:** 
- `helmet()` — устанавливает безопасные HTTP заголовки
- `compression()` — сжимает ответы для уменьшения трафика
- `cors()` — настраивает Cross-Origin Resource Sharing
- `rateLimit()` — ограничивает количество запросов для защиты от DDoS

## 5. Точка входа сервера

**Расположение:** `src/index.ts`

```typescript
import 'dotenv/config';
import app from './app';
import { logger } from './lib/logger';
import { env } from './config/env';
import prisma from './lib/prisma';

// Базовый маршрут
app.get('/', (_, res) => {
  res.json({ message: 'Сервер работает!' });
});

// Graceful shutdown
const server = app.listen(env.PORT, () => {
  logger.info(`Сервер запущен на порту ${env.PORT} ✅`);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM получен, завершение работы...');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
});
```

**Пояснение:** Graceful shutdown корректно завершает работу сервера и закрывает соединения с БД при получении сигнала завершения.

## 6. Обновление package.json

**Расположение:** `package.json`

Добавьте скрипты:

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

## Следующие шаги

- [Настройка middleware](./middleware.md) — детальная настройка всех middleware
- [Валидация с Zod](./validation.md) — валидация запросов и ответов
- [Логирование с Pino](./logging.md) — продвинутое логирование
