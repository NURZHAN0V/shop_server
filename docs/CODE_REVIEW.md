# Код-ревью бэкенда магазина

Дата: 2025-01-29. Стек: Express 5, TypeScript, Prisma, Zod, JWT, Pino. Критерии: AGENTS.md, безопасность, валидация, обработка ошибок, продакшен.

---

## Соответствие AGENTS.md и стеку

### Типы, запрет any

- **Ок.** В `src` тип `any` не используется.
- **[Сделано]** В `lib/prisma.ts` добавлен type guard `isPrismaNotFoundError`; в user и admin в catch используется он вместо `error as { code?: string }`.

### Комментарии на русском

- **[Сделано]** Было: нет русских комментариев у экспортов в lib и middleware. Добавлены JSDoc на русском для jwt, password, prisma, validate, validateResponse, errorHandler, cors, helmet, compression, rateLimit, requestLogger.
- **Ок.** Роуты: комментарии в формате `// METHOD /path — описание` на русском; `requireAdmin` с JSDoc на русском.

### Единообразие стиля комментариев к маршрутам

- **Ок.** В `auth`, `user`, `admin` используется формат `// METHOD /api/... — описание`. В `admin` дополнительно есть блоковый комментарий про префикс и requireAdmin.

---

## Безопасность

### Пароли и служебные поля в ответах

- **Ок.** Перед каждым `res.json` с объектом пользователя пароль исключается: `const { password: _p, ...rest } = user` (auth, user, admin). В ответах не отдаются хеши паролей.

### JWT и requireAdmin

- **Ок.** JWT: express-jwt с секретом и опциями из `env`; `unless` для `/`, `/api/auth/login`, POST `/api/auth/register`. Токен выдаётся через `signAccessToken` с `sub`, `email`, `role`. Админ-маршруты монтируются с `requireAdmin` после JWT; проверка `auth?.role === 'admin'`.

### Секреты только в конфиге

- **[Сделано]** `lib/prisma.ts` переведён на `env.DATABASE_URL`; в `errorHandler` для production используется `env.NODE_ENV`.

---

## Валидация и ошибки

### Zod и validate

- **Ок.** Вход валидируется схемами из `src/schemas` со структурой `body`/`params`/`query`; middleware `validate(schema)` используется на всех маршрутах с телом/параметрами. Типы из схем: `CreateUserInput`, `UpdateUserInput` через `z.infer`.

### Централизованная обработка ошибок

- **Ок.** `errorHandler` обрабатывает UnauthorizedError (401), ZodError (400), остальное — 500; в production не отдаётся `err.message` (только «Internal server error»).
- **[Сделано]** Порядок в `errorHandler`: сначала UnauthorizedError и ZodError (возврат ответа), затем один раз логирование неизвестной ошибки и 500; добавлен `return` перед `res.status(500).json(...)`.

### Логирование через logger

- **Ок.** Везде используется `logger` из `src/lib/logger` (validate, validateResponse, errorHandler, requestLogger, rateLimit, роуты user/admin).

---

## Prisma и типы из схем

- **Ок.** Один экземпляр Prisma из `src/lib/prisma`; в роутах импортируется этот же модуль. Типы для тела запроса из схем (`CreateUserInput` и т.д.).
- **[Сделано]** В `schemas/user.ts` экспортирован тип `GetUserParams` из схемы; в admin используется `req.params as GetUserParams`, убрано `id as unknown as number`.

---

## Middleware, SIGTERM, завершение

### Порядок middleware

- **[Сделано]** В `index.ts` оставлены один helmet (`helmetMiddleware`) и один CORS (`corsMiddleware`); в cors при отсутствии `CORS_ORIGIN` разрешаются все origin.

### Обработка SIGTERM и отключение Prisma

- **[Сделано]** На SIGTERM вызывается `server.close(callback)`; в callback — `prisma.$disconnect().then(() => process.exit(0))`, чтобы дождаться закрытия сервера перед отключением БД.

---

## Дублирования и практики

- **[Сделано]** **authLimiter** подключён к `/api/auth` в `index.ts`: `app.use('/api/auth', authLimiter, authRouter)`.
- **[Сделано]** В rateLimit.ts комментарий исправлен: 1 минута (не «15 минут»).
- **[Сделано]** В user.ts и admin.ts после `res.status(500).json(...)` добавлен `return`.

---

## Критические ошибки (исправить в первую очередь)

1. **[Сделано]** **validateResponse.ts** — добавлен импорт `Request` из `express`.
2. **[Сделано]** **index.ts** — убрано дублирование helmet и CORS.
3. **[Сделано]** **lib/prisma.ts** — используется `env.DATABASE_URL`.

---

## Резюме

| Критерий | Статус |
|----------|--------|
| Отсутствие any | Ок |
| Русские комментарии у экспортов | Сделано |
| Стиль комментариев к маршрутам | Ок |
| Пароли не в ответах | Ок |
| JWT и requireAdmin | Ок |
| Секреты из конфига | Сделано |
| Валидация Zod + validate | Ок |
| errorHandler централизован | Сделано |
| logger везде | Ок |
| Один экземпляр Prisma | Ок |
| Типы из z.infer | Ок; GetUserParams в admin — сделано |
| Порядок middleware | Сделано |
| SIGTERM и prisma.$disconnect | Сделано |
| Дубли, утечки | Сделано (authLimiter, комментарий rateLimit, return) |

---

## Сделано (2025-01-29)

- **validateResponse.ts** — добавлен импорт `Request` из `express`.
- **index.ts** — убраны дубли: один `helmetMiddleware`, один `corsMiddleware`; удалены импорты `cors` и `helmet`.
- **cors.ts** — при отсутствии `CORS_ORIGIN` разрешаются все origin; добавлен русский комментарий к экспорту.
- **lib/prisma.ts** — используется `env.DATABASE_URL` из `src/config/env.ts`.
- **errorHandler.ts** — порядок проверок: UnauthorizedError → ZodError → логирование и 500; для 500 используется `env.NODE_ENV` и `return res.status(500).json(...)`; добавлен русский комментарий.
- **SIGTERM** — `prisma.$disconnect()` и `process.exit(0)` вызываются в callback `server.close(...)`.
- **rateLimit.ts** — исправлен комментарий (1 минута); добавлены русские комментарии к `apiLimiter` и `authLimiter`.
- **user.ts / admin.ts** — после `res.status(500).json(...)` добавлен `return`.
- **Русские комментарии** — добавлены JSDoc на русском для экспортов в `lib` (jwt, password, prisma) и `middleware` (validate, validateResponse, errorHandler, cors, helmet, compression, rateLimit, requestLogger).
- **authLimiter** — подключён к `/api/auth`: `app.use('/api/auth', authLimiter, authRouter)`.
- **Типизация params в admin** — экспортирован `GetUserParams` из схемы; в admin используется `req.params as GetUserParams`, убрано `id as unknown as number`.
- **Ошибки Prisma в catch** — добавлен type guard `isPrismaNotFoundError` в `lib/prisma.ts`; в user и admin в catch используется он вместо приведения типа.

---

## Не сделано

Нет оставшихся пунктов; все замечания из ревью учтены.
