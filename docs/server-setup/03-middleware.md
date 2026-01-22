# Middleware (Промежуточное ПО)

Настройка middleware для безопасности, логирования и валидации.

## Структура middleware

**Местоположение:** `src/middleware/`

```
middleware/
├── cors.ts              # Настройка CORS
├── helmet.ts            # Заголовки безопасности
├── compression.ts       # Сжатие ответов
├── rateLimit.ts         # Ограничение запросов
├── errorHandler.ts      # Обработка ошибок
├── requestLogger.ts     # Логирование запросов
├── validate.ts          # Валидация запросов
└── validateResponse.ts  # Валидация ответов
```

## 1. Логирование

**Местоположение:** `src/lib/logger.ts`

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

**Пояснение:**
- `level` — уровень логирования (debug/info/warn/error)
- `transport` — форматирование логов (только в development)
- `pino-pretty` — красивое отображение в консоли

**Использование:**

```typescript
import { logger } from './lib/logger';

logger.info('Сервер запущен');
logger.error({ error }, 'Ошибка при обработке запроса');
```

## 2. Логирование запросов

**Местоположение:** `src/middleware/requestLogger.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
      },
      'HTTP запрос'
    );
  });

  next();
};
```

**Пояснение:**
- Логирует метод, URL, статус и время выполнения
- `res.on('finish')` — срабатывает после отправки ответа

## 3. Обработка ошибок

**Местоположение:** `src/middleware/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(
    {
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      request: {
        method: req.method,
        url: req.url,
        ip: req.ip,
      },
    },
    'Необработанная ошибка'
  );

  // Обработка ошибок валидации Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: err.issues,
    });
  }

  // Общая ошибка
  res.status(500).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Внутренняя ошибка сервера'
        : err.message,
  });
};
```

**Пояснение:**
- Перехватывает все необработанные ошибки
- Логирует ошибку с контекстом запроса
- Возвращает понятный ответ клиенту
- В production скрывает детали ошибки

## 4. CORS (Cross-Origin Resource Sharing)

**Местоположение:** `src/middleware/cors.ts`

```typescript
import cors from 'cors';
import { env } from '../config/env';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowedOrigins = env.CORS_ORIGIN
      ? env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000'];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Не разрешено политикой CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Пояснение:**
- Проверяет origin запроса
- Разрешает запросы без origin (мобильные приложения, Postman)
- `credentials: true` — разрешает отправку cookies

## 5. Безопасность (Helmet)

**Местоположение:** `src/middleware/helmet.ts`

```typescript
import helmet from 'helmet';

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
});
```

**Пояснение:**
- Устанавливает безопасные HTTP-заголовки
- Защищает от XSS, clickjacking и других атак

## 6. Сжатие ответов

**Местоположение:** `src/middleware/compression.ts`

```typescript
import compression from 'compression';

export const compressionMiddleware = compression({
  level: 6,
  threshold: 1024, // Сжимать только ответы > 1KB
});
```

**Пояснение:**
- Сжимает ответы сервера (gzip)
- Уменьшает размер передаваемых данных

## 7. Ограничение запросов (Rate Limiting)

**Местоположение:** `src/middleware/rateLimit.ts`

```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // Максимум 100 запросов за окно
  message: 'Слишком много запросов, попробуйте позже',
  standardHeaders: true,
  legacyHeaders: false,
});
```

**Пояснение:**
- Ограничивает количество запросов с одного IP
- Защищает от DDoS и злоупотреблений

## 8. Валидация запросов

**Местоположение:** `src/middleware/validate.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      next(error); // Передаём ошибку в errorHandler
    }
  };
};
```

**Пояснение:**
- Принимает схему Zod
- Валидирует body, query и params
- Передаёт ошибку в errorHandler при несоответствии

## Подключение middleware

**Местоположение:** `src/app.ts`

```typescript
import express from 'express';
import { corsMiddleware } from './middleware/cors';
import { helmetMiddleware } from './middleware/helmet';
import { compressionMiddleware } from './middleware/compression';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

const app = express();

// Порядок важен!
app.use(helmetMiddleware);
app.use(compressionMiddleware);
app.use(express.json());
app.use(corsMiddleware);
app.use(apiLimiter);
app.use(requestLogger);

// Обработчик ошибок должен быть последним
app.use(errorHandler);

export default app;
```

**Пояснение:**
- Порядок подключения важен
- `errorHandler` должен быть последним
- `requestLogger` должен быть до маршрутов

## Проверка работоспособности

1. Запустите сервер:
```bash
npm run dev
```

2. Проверьте логи в консоли — должны появляться записи о запросах

3. Проверьте заголовки ответа (в DevTools):
   - `Content-Encoding: gzip` — сжатие работает
   - `X-Content-Type-Options: nosniff` — Helmet работает

## Следующие шаги

- [Роутинг](./04-routing.md) — создание маршрутов с валидацией
- [Работа с БД](./05-database.md) — подключение к базе данных
