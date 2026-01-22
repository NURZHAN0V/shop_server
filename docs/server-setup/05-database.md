# Работа с базой данных

Настройка Prisma и работа с базой данных.

## Шаг 1: Инициализация Prisma

**Местоположение:** корень проекта

```bash
npx prisma init
```

Создастся файл `prisma/schema.prisma` и папка для миграций.

## Шаг 2: Настройка схемы базы данных

**Местоположение:** `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "./generated/client"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  age       Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Пояснение:**
- `generator` — настройка генерации клиента Prisma
- `datasource` — тип БД и URL подключения
- `model` — описание таблицы
- `@id` — первичный ключ
- `@default(autoincrement())` — автоинкремент
- `@unique` — уникальное поле
- `@default(now())` — значение по умолчанию (текущее время)

## Шаг 3: Создание миграций

**Местоположение:** корень проекта

```bash
npx prisma migrate dev --name init
```

**Пояснение:**
- Создаёт файл миграции в `prisma/migrations/`
- Применяет миграцию к БД
- Генерирует Prisma Client

## Шаг 4: Генерация Prisma Client

**Местоположение:** корень проекта

```bash
npx prisma generate
```

**Пояснение:**
- Генерирует TypeScript типы на основе схемы
- Создаёт клиент в `prisma/generated/client/`

## Шаг 5: Подключение к базе данных

**Местоположение:** `src/lib/prisma.ts`

### Для SQLite (текущая настройка)

```typescript
import { PrismaClient } from '../../prisma/generated/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const sqlite = new PrismaBetterSqlite3({ 
  url: process.env.DATABASE_URL! 
});

const prisma = new PrismaClient({ adapter: sqlite });

export default prisma;
```

### Для PostgreSQL

```typescript
import { PrismaClient } from '../../prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export default prisma;
```

**Пояснение:**
- Используется адаптер для конкретной БД
- Создаётся единственный экземпляр Prisma Client (singleton)
- Экспортируется для использования во всём приложении

## Шаг 6: Базовые операции с БД

### Создание записи

```typescript
const user = await prisma.user.create({
  data: {
    name: 'Иван',
    email: 'ivan@example.com',
    age: 25,
  },
});
```

### Получение записи по ID

```typescript
const user = await prisma.user.findUnique({
  where: { id: 1 },
});
```

### Получение всех записей

```typescript
const users = await prisma.user.findMany();
```

### Получение с фильтрацией

```typescript
const users = await prisma.user.findMany({
  where: {
    age: { gte: 18 }, // age >= 18
    email: { contains: '@gmail.com' },
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0,
});
```

### Обновление записи

```typescript
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    name: 'Пётр',
    age: 30,
  },
});
```

### Удаление записи

```typescript
await prisma.user.delete({
  where: { id: 1 },
});
```

## Шаг 7: Связи между моделями

**Местоположение:** `prisma/schema.prisma`

```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  posts     Post[]   // Один ко многим
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}
```

**Пояснение:**
- `Post[]` — массив постов (один пользователь — много постов)
- `@relation` — связь между моделями
- `fields` — поле в текущей модели
- `references` — поле в связанной модели

### Использование связей

```typescript
// Получить пользователя с постами
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: true },
});

// Создать пост с автором
const post = await prisma.post.create({
  data: {
    title: 'Заголовок',
    content: 'Содержание',
    author: {
      connect: { id: 1 }, // Связать с существующим пользователем
    },
  },
});
```

## Шаг 8: Транзакции

```typescript
// Последовательные операции
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { name: 'Иван', email: 'ivan@example.com' },
  });

  const post = await tx.post.create({
    data: {
      title: 'Первый пост',
      authorId: user.id,
    },
  });

  return { user, post };
});
```

**Пояснение:**
- Все операции выполняются атомарно
- При ошибке в любой операции откатываются все изменения

## Шаг 9: Корректное закрытие подключения

**Местоположение:** `src/index.ts`

```typescript
import prisma from './lib/prisma';

const server = app.listen(env.PORT, () => {
  console.log(`Сервер запущен на http://localhost:${env.PORT}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM получен, завершение работы...');
  server.close();
  await prisma.$disconnect(); // Закрываем подключение к БД
  process.exit(0);
});
```

**Пояснение:**
- `prisma.$disconnect()` — закрывает все подключения к БД
- Важно для корректного завершения работы приложения

## Шаг 10: Prisma Studio (визуальный редактор)

**Местоположение:** корень проекта

```bash
npx prisma studio
```

**Пояснение:**
- Открывает веб-интерфейс для просмотра и редактирования данных
- Доступен по адресу `http://localhost:5555`

## Проверка работоспособности

1. Убедитесь, что файл `.env` содержит `DATABASE_URL`

2. Создайте и примените миграцию:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

3. Запустите сервер и проверьте создание пользователя:
```bash
npm run dev
```

4. Откройте Prisma Studio для просмотра данных:
```bash
npx prisma studio
```

## Полезные команды

```bash
# Создать новую миграцию
npx prisma migrate dev --name migration_name

# Применить миграции в production
npx prisma migrate deploy

# Сбросить БД и применить все миграции заново
npx prisma migrate reset

# Обновить схему из существующей БД
npx prisma db pull

# Отправить схему в БД без миграций
npx prisma db push
```

## Следующие шаги

- [Роутинг](./04-routing.md) — использование Prisma в маршрутах
- [Запуск и деплой](./06-launch.md) — настройка для production
