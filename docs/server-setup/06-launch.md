# Запуск и деплой

Настройка сервера для запуска в различных окружениях.

## Шаг 1: Настройка скриптов

**Местоположение:** `package.json`

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy",
    "postinstall": "prisma generate"
  }
}
```

**Пояснение:**
- `dev` — запуск в режиме разработки (с автоперезагрузкой)
- `build` — компиляция TypeScript в JavaScript
- `start` — запуск скомпилированного кода
- `postinstall` — автоматическая генерация Prisma Client после установки зависимостей

## Шаг 2: Компиляция TypeScript

**Местоположение:** `tsconfig.json` (обновлённая версия)

```json
{
  "compilerOptions": {
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "lib": ["esnext"],
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "target": "ES2020"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Пояснение:**
- `rootDir` — исходная папка
- `outDir` — папка для скомпилированного кода
- `include` — файлы для компиляции
- `exclude` — файлы для исключения

## Шаг 3: Переменные окружения для production

**Местоположение:** `.env.production` (создать в корне)

```env
NODE_ENV=production
PORT=1480
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
```

**Пояснение:**
- Отдельный файл для production
- Используйте PostgreSQL или другую production-ready БД
- Укажите реальный домен для CORS

## Шаг 4: Обработка ошибок при запуске

**Местоположение:** `src/index.ts` (обновлённая версия)

```typescript
import 'dotenv/config';
import app from './app';
import { logger } from './lib/logger';
import { env } from './config/env';
import prisma from './lib/prisma';
import userRouter from './routes/user';

app.get('/', (_, res) => {
  res.json({ message: 'Сервер работает!' });
});

app.use('/api/users', userRouter);

const server = app.listen(env.PORT, () => {
  logger.info(`Сервер запущен на http://localhost:${env.PORT}`);
});

// Обработка ошибок при запуске
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Порт ${env.PORT} уже занят`);
  } else {
    logger.error({ error }, 'Ошибка при запуске сервера');
  }
  process.exit(1);
});

// Корректное завершение работы
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} получен, завершение работы...`);
  
  server.close(async () => {
    logger.info('HTTP сервер закрыт');
    
    try {
      await prisma.$disconnect();
      logger.info('Подключение к БД закрыто');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Ошибка при закрытии БД');
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

**Пояснение:**
- `server.on('error')` — обработка ошибок при запуске
- `gracefulShutdown` — корректное завершение работы
- `SIGTERM` и `SIGINT` — обработка сигналов завершения

## Шаг 5: Запуск в режиме разработки

**Местоположение:** корень проекта

```bash
npm run dev
```

**Пояснение:**
- Использует `tsx` для запуска TypeScript без компиляции
- Автоматическая перезагрузка при изменении файлов (если настроен nodemon)

## Шаг 6: Сборка для production

**Местоположение:** корень проекта

```bash
# 1. Компиляция TypeScript
npm run build

# 2. Генерация Prisma Client
npm run prisma:generate

# 3. Применение миграций (если нужно)
npm run prisma:migrate
```

**Пояснение:**
- Создаётся папка `dist/` с JavaScript файлами
- Prisma Client генерируется в `prisma/generated/client/`

## Шаг 7: Запуск в production

**Местоположение:** корень проекта

```bash
NODE_ENV=production npm start
```

Или с использованием `.env.production`:

```bash
# Установка dotenv-cli (если нужно)
npm install -D dotenv-cli

# Запуск с указанием файла окружения
dotenv -e .env.production npm start
```

## Шаг 8: Использование PM2 (Process Manager)

**Установка:**
```bash
npm install -g pm2
```

**Создание конфигурации PM2:**

**Местоположение:** `ecosystem.config.js` (корень проекта)

```javascript
module.exports = {
  apps: [
    {
      name: 'shop-backend',
      script: 'dist/index.js',
      instances: 2, // Количество процессов
      exec_mode: 'cluster', // Режим кластера
      env: {
        NODE_ENV: 'production',
        PORT: 1480,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
    },
  ],
};
```

**Команды PM2:**
```bash
# Запуск
pm2 start ecosystem.config.js

# Остановка
pm2 stop shop-backend

# Перезапуск
pm2 restart shop-backend

# Просмотр логов
pm2 logs shop-backend

# Мониторинг
pm2 monit

# Сохранение конфигурации для автозапуска
pm2 save
pm2 startup
```

## Шаг 9: Docker (опционально)

**Местоположение:** `Dockerfile` (корень проекта)

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Установка зависимостей
RUN npm ci --only=production

# Генерация Prisma Client
RUN npx prisma generate

# Копирование исходного кода
COPY dist ./dist

# Применение миграций при запуске
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

**Местоположение:** `.dockerignore` (корень проекта)

```
node_modules
dist
.env
.env.local
*.log
```

**Сборка и запуск:**
```bash
# Сборка образа
docker build -t shop-backend .

# Запуск контейнера
docker run -p 1480:1480 --env-file .env.production shop-backend
```

## Шаг 10: Проверка работоспособности

1. **Проверка запуска:**
```bash
npm run build
npm start
```

2. **Проверка здоровья сервера:**
```bash
curl http://localhost:1480/
```

3. **Проверка API:**
```bash
curl http://localhost:1480/api/users
```

4. **Проверка логов:**
   - В development: логи в консоли
   - В production: логи в файлах (если настроено)

## Рекомендации для production

1. **Используйте reverse proxy (Nginx):**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:1480;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

2. **Настройте HTTPS** через Let's Encrypt

3. **Используйте мониторинг** (например, Sentry для ошибок)

4. **Настройте резервное копирование БД**

5. **Используйте переменные окружения** вместо хардкода

## Следующие шаги

- Настройка CI/CD для автоматического деплоя
- Настройка мониторинга и алертов
- Оптимизация производительности
