# Документация по настройке сервера

Полное руководство по созданию и настройке Express сервера с использованием современных инструментов.

## Содержание

1. [Настройка сервера](./setup.md) — базовая настройка Express приложения
2. [Middleware](./middleware.md) — настройка CORS, Helmet, Compression, Rate Limiting
3. [Валидация с Zod](./validation.md) — валидация запросов и переменных окружения
4. [Логирование с Pino](./logging.md) — структурированное логирование

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install zod cors express-rate-limit pino pino-pretty compression helmet
npm install -D @types/cors @types/compression
```

### 2. Создание структуры файлов

```
src/
├── index.ts
├── app.ts
├── config/
│   └── env.ts
├── middleware/
│   ├── cors.ts
│   ├── helmet.ts
│   ├── compression.ts
│   ├── rateLimit.ts
│   ├── validate.ts
│   ├── requestLogger.ts
│   └── errorHandler.ts
├── lib/
│   ├── prisma.ts
│   └── logger.ts
└── routes/
    └── index.ts
```

### 3. Переменные окружения

Создайте файл `.env`:

```env
NODE_ENV=development
PORT=1480
DATABASE_URL=file:./.temp/database.db
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-secret-key-minimum-32-characters-long
```

### 4. Следующие шаги

Следуйте документации по порядку:
1. Начните с [setup.md](./setup.md) для базовой настройки
2. Настройте [middleware](./middleware.md) для безопасности
3. Добавьте [валидацию](./validation.md) для типобезопасности
4. Настройте [логирование](./logging.md) для отладки

## Технические требования

Все разделы учитывают следующие технологии:
- ✅ **Zod** — валидация данных
- ✅ **CORS** — настройка Cross-Origin запросов
- ✅ **express-rate-limit** — защита от DDoS
- ✅ **Pino** — быстрый JSON логгер
- ✅ **compression** — сжатие ответов
- ✅ **helmet** — безопасность HTTP заголовков

## Примеры кода

Все примеры кода в документации:
- Указывают точное расположение файлов
- Содержат краткие пояснения
- Минимизированы для понимания сути
- Готовы к использованию в проекте
