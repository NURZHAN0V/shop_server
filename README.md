# Backend для интернет магазина

## Технический стек
- Node v24.13.0
- NPM 11.6.2
- Prisma 7.2.0

## Архититекрутра проекта

```
SHOP_BACKEND/
│
├── .env                  → Файл с секретами (например, URL базы данных)
├── .gitignore            → Что не нужно отправлять в GitHub
├── package.json          → Список всех библиотек и команд проекта
├── package-lock.json     → Точные версии библиотек (автоматически)
├── tsconfig.json         → Настройки TypeScript
├── prisma.config.ts      → Конфигурация Prisma (как подключаться к БД)
├── README.md             → Инструкция по запуску и о проекте
│
├── .temp/                → Временная папка для базы данных (если используешь SQLite)
│   └── database.db       → Сама база данных (файл)
│
├── node_modules/         → Папка с установленными библиотеками (не трогать!)
│
├── prisma/               → Папка для работы с базой данных через Prisma
│   ├── schema.prisma     → Здесь описываем таблицы (модели) базы данных
│   ├── migrations/       → История изменений базы данных (как лог изменения)
│   └── generated/        → Автоматически созданный код для работы с БД (не редактируем!)
│
├── src/                  → Главная папка с нашим кодом
│   ├── lib/              → Вспомогательные файлы (библиотеки)
│   │   ├── prisma.ts     → Подключение к базе данных (Prisma Client)
│   │   └── index.ts      → Экспортируем всё из lib (если нужно)
│   ├── openapi/          → Документация API (OpenAPI 3.0)
│   │   └── spec.ts       → Спецификация для Swagger UI (/api-docs)
│   │
│   └── index.ts          → Главный файл сервера (здесь запускается Express)
│
└── public/               → Если будут статические файлы (картинки, HTML) — но пока не нужно
```

## Команды

### Быстрый старт

Установите зависимости

```bash
npm install
```

Создайте файл `.env` в корне проекта и добавьте URL базы данных:

```bash
DATABASE_URL="file:./.temp/database.db"
```

Создайте/обновите базу данных и сгенерируйте клиент Prisma:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Запустите приложение:

```bash
npm run dev
```

### Установка зависимостей

```bash
# Установить основные зависимости
npm install

# Установить Prisma (если ещё не установлен)
npm install prisma @prisma/client
npm install -D prisma

# Установить адаптер для SQLite (обязательно!)
npm install @prisma/adapter-better-sqlite3 better-sqlite3

# Установить dotenv (для переменных окружения)
npm install dotenv
npm install -D dotenv
```

### Работа с базой данных

```bash
# Сгенерировать миграции (создать/обновить схему БД)
npx prisma migrate dev --name init

# Сгенерировать клиент Prisma (после изменений в schema.prisma)
npx prisma generate

# Открыть Prisma Studio (визуальный интерфейс для БД)
npx prisma studio

# Сбросить базу данных (удалить всё и применить миграции заново)
npx prisma migrate reset

# Применить миграции без создания новой
npx prisma migrate deploy
```

### Запуск приложения

```bash
# Запустить в режиме разработки
npm run dev

# Или запустить напрямую
tsx --env-file=.env src/index.ts

# Для отслеживания изменений
tsx watch --env-file=.env src/index.ts
```

### OpenAPI (документация API)

В проекте подключена документация API в формате OpenAPI 3.0 и интерактивный UI Swagger.

| Что | Адрес |
|-----|--------|
| Swagger UI (интерфейс для запросов) | `http://localhost:1480/api-docs` |
| Спецификация в JSON | `http://localhost:1480/api-docs.json` |

После запуска сервера (`npm run dev`) откройте в браузере `/api-docs`. В Swagger UI можно:

- Просматривать все маршруты и схемы запросов/ответов.
- Выполнять запросы к API (кнопка «Try it out» у каждого метода).
- Для защищённых маршрутов (например `/api/users/me`, `/api/admin/users`): нажать «Authorize», ввести полученный при логине JWT (без слова `Bearer` — подставлено автоматически), затем отправлять запросы.

Спецификация лежит в `src/openapi/spec.ts`. При добавлении новых маршрутов или изменении контрактов обновляйте этот файл, чтобы документация совпадала с реальным API.

> Если Swagger UI не открывается, выполните `npm install` (в проект добавлены зависимости `swagger-ui-express` и `@types/swagger-ui-express`).

