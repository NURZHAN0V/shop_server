# Настройка Middleware

Детальная настройка всех middleware для Express сервера.

## Структура файлов

```
src/
└── middleware/
    ├── cors.ts           → CORS конфигурация
    ├── helmet.ts         → Helmet конфигурация
    ├── compression.ts    → Compression конфигурация
    ├── rateLimit.ts      → Rate limiting конфигурация
    └── errorHandler.ts   → Обработка ошибок
```

## 1. CORS (Cross-Origin Resource Sharing)

**Расположение:** `src/middleware/cors.ts`

```typescript
import cors from 'cors';
import { env } from '../config/env';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (мобильные приложения, Postman)
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
  credentials: true, // Разрешаем отправку cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Пояснение:** CORS контролирует доступ к API с других доменов. `credentials: true` позволяет отправлять cookies и заголовки авторизации.

**Использование в app.ts:**

```typescript
import { corsMiddleware } from './middleware/cors';
app.use(corsMiddleware);
```

## 2. Helmet (Безопасность заголовков)

**Расположение:** `src/middleware/helmet.ts`

```typescript
import helmet from 'helmet';

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false, // Отключаем для API
  hsts: {
    maxAge: 31536000, // 1 год
    includeSubDomains: true,
  },
});
```

**Пояснение:** Helmet устанавливает безопасные HTTP заголовки, защищая от XSS, clickjacking и других атак.

**Использование в app.ts:**

```typescript
import { helmetMiddleware } from './middleware/helmet';
app.use(helmetMiddleware);
```

## 3. Compression (Сжатие ответов)

**Расположение:** `src/middleware/compression.ts`

```typescript
import compression from 'compression';

export const compressionMiddleware = compression({
  level: 6, // Уровень сжатия (1-9, 6 оптимально)
  filter: (req, res) => {
    // Не сжимаем если клиент не поддерживает
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Используем стандартный фильтр compression
    return compression.filter(req, res);
  },
});
```

**Пояснение:** Compression сжимает ответы сервера (gzip/deflate), уменьшая размер передаваемых данных на 70-90%.

**Использование в app.ts:**

```typescript
import { compressionMiddleware } from './middleware/compression';
app.use(compressionMiddleware);
```

## 4. Rate Limiting (Ограничение запросов)

**Расположение:** `src/middleware/rateLimit.ts`

```typescript
import rateLimit from 'express-rate-limit';
import { logger } from '../lib/logger';

// Общий лимит для всех API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // 100 запросов с одного IP
  message: 'Слишком много запросов с этого IP, попробуйте позже',
  standardHeaders: true, // Возвращает rate limit info в заголовках
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit превышен для IP: ${req.ip}`);
    res.status(429).json({
      error: 'Слишком много запросов, попробуйте позже',
    });
  },
});

// Строгий лимит для авторизации
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Только 5 попыток входа
  skipSuccessfulRequests: true, // Не считаем успешные запросы
});
```

**Пояснение:** Rate limiting защищает от DDoS атак и злоупотреблений API, ограничивая количество запросов с одного IP.

**Использование в app.ts:**

```typescript
import { apiLimiter, authLimiter } from './middleware/rateLimit';

// Применяем ко всем API маршрутам
app.use('/api/', apiLimiter);

// Применяем к маршрутам авторизации
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

## 5. Обработка ошибок

**Расположение:** `src/middleware/errorHandler.ts`

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
  // Ошибки валидации Zod
  if (err instanceof ZodError) {
    logger.warn({ errors: err.errors }, 'Ошибка валидации');
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: err.errors,
    });
  }

  // Ошибки Prisma
  if (err.name === 'PrismaClientKnownRequestError') {
    logger.error({ error: err }, 'Ошибка базы данных');
    return res.status(500).json({
      error: 'Ошибка базы данных',
    });
  }

  // Остальные ошибки
  logger.error({ error: err, stack: err.stack }, 'Необработанная ошибка');
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Внутренняя ошибка сервера' 
      : err.message,
  });
};
```

**Пояснение:** Централизованный обработчик ошибок логирует все ошибки и возвращает понятные ответы клиенту.

**Использование в app.ts (в конце, после всех маршрутов):**

```typescript
import { errorHandler } from './middleware/errorHandler';

// ... все маршруты ...

// Обработчик ошибок должен быть последним
app.use(errorHandler);
```

## Порядок подключения middleware

**Расположение:** `src/app.ts`

Правильный порядок важен для корректной работы:

```typescript
import express from 'express';
import { helmetMiddleware } from './middleware/helmet';
import { compressionMiddleware } from './middleware/compression';
import { corsMiddleware } from './middleware/cors';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// 1. Безопасность (helmet)
app.use(helmetMiddleware);

// 2. Сжатие
app.use(compressionMiddleware);

// 3. Парсинг тела запроса
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. CORS
app.use(corsMiddleware);

// 5. Rate limiting
app.use('/api/', apiLimiter);

// ... маршруты ...

// 6. Обработка ошибок (в самом конце)
app.use(errorHandler);

export default app;
```
