# Логирование с Pino

Настройка и использование Pino для структурированного логирования в Express приложении.

## Структура файлов

```
src/
├── lib/
│   └── logger.ts         → Конфигурация Pino
└── middleware/
    └── requestLogger.ts  → Middleware для логирования запросов
```

## 1. Базовая настройка логгера

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
            singleLine: false,
          },
        }
      : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
});
```

**Пояснение:** 
- В development используется `pino-pretty` для читаемого вывода
- В production — JSON формат для парсинга лог-агрегаторами
- `level` форматируется в верхний регистр для единообразия

## 2. Middleware для логирования запросов

**Расположение:** `src/middleware/requestLogger.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  // Логируем входящий запрос
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  }, 'Входящий запрос');

  // Перехватываем окончание ответа
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    // Разные уровни логирования в зависимости от статуса
    if (res.statusCode >= 500) {
      logger.error(logData, 'Ошибка сервера');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'Ошибка клиента');
    } else {
      logger.info(logData, 'Запрос выполнен');
    }
  });

  next();
};
```

**Пояснение:** Middleware логирует все входящие запросы с информацией о методе, URL, IP, времени выполнения и статусе ответа.

**Использование в app.ts:**

```typescript
import { requestLogger } from './middleware/requestLogger';

// Подключаем после базовых middleware, но до маршрутов
app.use(requestLogger);
```

## 3. Логирование ошибок

**Расположение:** `src/middleware/errorHandler.ts` (обновление)

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
  // Логируем ошибку с контекстом запроса
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
        body: req.body,
      },
    },
    'Необработанная ошибка'
  );

  if (err instanceof ZodError) {
    logger.warn(
      { errors: err.errors, url: req.url },
      'Ошибка валидации'
    );
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: err.errors,
    });
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Внутренняя ошибка сервера'
      : err.message,
  });
};
```

**Пояснение:** Все ошибки логируются с полным контекстом запроса для упрощения отладки.

## 4. Использование в контроллерах

**Расположение:** `src/routes/user.ts` (пример)

```typescript
import { Router } from 'express';
import { logger } from '../lib/logger';
import prisma from '../lib/prisma';

const router = Router();

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      logger.warn({ userId: id }, 'Пользователь не найден');
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    logger.debug({ userId: id }, 'Пользователь найден');
    res.json(user);
  } catch (error) {
    logger.error(
      { error, userId: id },
      'Ошибка при получении пользователя'
    );
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
```

**Пояснение:** Используйте разные уровни логирования:
- `debug` — детальная информация для разработки
- `info` — обычные операции
- `warn` — предупреждения (например, не найден ресурс)
- `error` — критические ошибки

## 5. Структурированное логирование

Pino использует структурированные логи (JSON), что позволяет легко фильтровать и анализировать:

```typescript
// ❌ Плохо — строка
logger.info('Пользователь создан с ID 123');

// ✅ Хорошо — структурированный объект
logger.info({ userId: '123', email: 'user@example.com' }, 'Пользователь создан');
```

**Преимущества:**
- Легко фильтровать по полям
- Можно добавлять метрики
- Удобно для лог-агрегаторов (ELK, Datadog, etc.)

## 6. Логирование с контекстом

**Расположение:** `src/middleware/contextLogger.ts` (опционально)

Для добавления контекста (например, ID пользователя) ко всем логам:

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger as baseLogger } from '../lib/logger';

export const contextLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Создаем дочерний логгер с контекстом запроса
  req.logger = baseLogger.child({
    requestId: req.headers['x-request-id'] || Math.random().toString(36),
    method: req.method,
    url: req.url,
  });

  next();
};
```

**Использование:**

```typescript
// В контроллере
router.get('/:id', async (req, res) => {
  req.logger.info({ userId: req.params.id }, 'Получение пользователя');
  // ...
});
```

## 7. Уровни логирования

```typescript
logger.trace('Самая детальная информация');
logger.debug('Отладочная информация');
logger.info('Обычная информация');
logger.warn('Предупреждение');
logger.error('Ошибка');
logger.fatal('Критическая ошибка');
```

**Рекомендации:**
- `trace` — очень детальная информация (обычно отключен)
- `debug` — отладочная информация в development
- `info` — обычные операции (запросы, создание ресурсов)
- `warn` — предупреждения (валидация, не найден ресурс)
- `error` — ошибки (исключения, ошибки БД)
- `fatal` — критические ошибки (сервер не может продолжить работу)

## 8. Настройка для production

**Расположение:** `src/lib/logger.ts` (расширенная версия)

```typescript
import pino from 'pino';
import { env } from '../config/env';

const isDevelopment = env.NODE_ENV === 'development';

export const logger = pino({
  level: env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  // В production можно отправлять логи в файл или внешний сервис
  ...(isDevelopment
    ? {}
    : {
        // Пример: отправка в файл
        // stream: pino.destination('./logs/app.log'),
      }),
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  // Добавляем базовые поля ко всем логам
  base: {
    env: env.NODE_ENV,
    service: 'shop-backend',
  },
});
```

**Пояснение:** В production логи можно отправлять в файлы, внешние сервисы (Datadog, CloudWatch) или использовать pino-транспорты.
