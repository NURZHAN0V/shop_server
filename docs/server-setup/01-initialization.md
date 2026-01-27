# Инициализация проекта

Создание базовой структуры Express.js сервера с TypeScript.

## Шаг 1: Инициализация проекта

**Местоположение:** корень проекта

```bash
npm init -y
```

## Шаг 2: Установка зависимостей

**Местоположение:** корень проекта (`package.json`)

### Основные зависимости

```bash
npm install express cors helmet compression express-rate-limit
npm install pino pino-pretty zod
npm install @prisma/client
npm install dotenv
```

### Зависимости для разработки

```bash
npm install -D typescript tsx @types/express @types/node @types/cors
npm install -D @types/compression prisma
```

## Шаг 3: Настройка TypeScript

**Местоположение:** `tsconfig.json` (корень проекта)

```json
{
  "compilerOptions": {
    "sourceMap": true,
    "outDir": "dist",
    "strict": true,
    "lib": ["esnext"],
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true
  }
}
```

**Пояснение:**
- `outDir` — папка для скомпилированного кода
- `strict` — строгая проверка типов
- `module: ESNext` — использование современных модулей

## Шаг 4: Создание структуры папок

**Местоположение:** корень проекта

```
src/
├── index.ts            # Точка входа: приложение, маршруты, запуск
├── config/             # Конфигурационные файлы
├── lib/                # Вспомогательные библиотеки
├── middleware/         # Промежуточное ПО
├── routes/             # Маршруты API
└── schemas/            # Схемы валидации
```

## Шаг 5: Точка входа и приложение

**Местоположение:** `src/index.ts`

Приложение Express, маршруты и запуск сервера объединены в одном файле. `app` экспортируется для тестов (например, supertest). Сервер запускается только при прямом вызове файла, а не при import.

```typescript
import 'dotenv/config';
import express from 'express';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_, res) => {
  res.json({ message: 'Сервер работает!' });
});

export { app };

// Запуск только при прямом вызове (не при import в тестах)
const isEntry = process.argv[1]?.endsWith('index.ts');
if (isEntry) {
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
  });
  process.on('SIGTERM', () => {
    server.close();
    process.exit(0);
  });
}
```

**Пояснение:**
- `dotenv/config` — загружает переменные из `.env`
- `app.listen()` — запускает сервер на указанном порту
- `SIGTERM` — обработка сигнала завершения для корректного закрытия

## Шаг 7: Настройка скриптов

**Местоположение:** `package.json`

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

**Пояснение:**
- `dev` — запуск в режиме разработки с автоперезагрузкой
- `build` — компиляция TypeScript в JavaScript
- `start` — запуск скомпилированного кода

## Проверка работоспособности

1. Создайте файл `.env` в корне проекта:
```env
PORT=3000
```

2. Запустите сервер:
```bash
npm run dev
```

3. Проверьте в браузере: `http://localhost:3000`

Должен вернуться ответ: `{ "message": "Сервер работает!" }`

## Следующие шаги

- [Конфигурация](./02-configuration.md) — настройка переменных окружения
- [Middleware](./03-middleware.md) — добавление промежуточного ПО
