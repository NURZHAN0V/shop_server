/**
 * OpenAPI 3.0 спецификация API.
 * Используется для Swagger UI по /api-docs и для экспорта JSON по /api-docs.json.
 */

/** Минимальный тип документа OpenAPI 3.0 для типобезопасности (без any). */
interface OpenApiDoc {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers?: Array<{ url: string; description?: string }>;
  /** Порядок и видимость секций в Swagger UI. */
  tags?: Array<{ name: string; description?: string }>;
  paths: Record<string, Record<string, unknown>>;
  components?: {
    securitySchemes?: Record<string, unknown>;
    schemas?: Record<string, unknown>;
  };
}

export const openApiSpec: OpenApiDoc = {
  openapi: '3.0.3',
  info: {
    title: 'Shop Backend API',
    version: '1.0.0',
    description: 'API интернет-магазина: аутентификация, профиль пользователя, админка пользователей.',
  },
  servers: [{ url: '/', description: 'Текущий сервер' }],
  tags: [
    { name: 'Сервер', description: 'Проверка работы API' },
    { name: 'Аутентификация', description: 'Регистрация и вход' },
    { name: 'Пользователь', description: 'Профиль текущего пользователя (JWT)' },
    { name: 'Админ', description: 'Управление пользователями (роль admin)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Токен, полученный при POST /api/auth/login',
      },
    },
    schemas: {
      User: {
        type: 'object',
        description: 'Пользователь (без поля password)',
        properties: {
          id: { type: 'integer', example: 1 },
          role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          name: { type: 'string', example: 'Иван Иванов' },
          email_verified: { type: 'boolean', nullable: true },
          phone: { type: 'string', nullable: true },
          city: { type: 'string', nullable: true },
          avatar: { type: 'string', nullable: true },
          updated_at: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      RegisterBody: {
        type: 'object',
        required: ['email', 'name', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 2 },
          password: { type: 'string', minLength: 8 },
        },
      },
      LoginBody: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'JWT для заголовка Authorization' },
          user: {
            type: 'object',
            properties: { id: { type: 'integer' }, name: { type: 'string' }, email: { type: 'string' } },
          },
        },
      },
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
      UpdateMeBody: {
        type: 'object',
        properties: { name: { type: 'string', minLength: 2 } },
      },
      UpdateUserBody: {
        type: 'object',
        properties: { name: { type: 'string', minLength: 2 } },
      },
    },
  },
  paths: {
    '/': {
      get: {
        summary: 'Проверка работы сервера',
        tags: ['Сервер'],
        responses: { 200: { description: 'Server is running', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
      },
    },
    '/api': {
      get: {
        summary: 'Информация об API',
        description: 'Версия, ссылка на документацию и базовые пути (auth, users, admin). Публичный маршрут.',
        tags: ['Сервер'],
        responses: {
          200: {
            description: 'Описание API',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    api: { type: 'string', example: 'Shop Backend API' },
                    version: { type: 'string', example: '1.0.0' },
                    docs: { type: 'string', example: '/api-docs' },
                    paths: {
                      type: 'object',
                      properties: {
                        auth: { type: 'string', example: '/api/auth' },
                        users: { type: 'string', example: '/api/users' },
                        admin: { type: 'string', example: '/api/admin/users' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/users': {
      get: {
        summary: 'Раздел «Пользователь»',
        description: 'Описание и ссылка на профиль: GET/PATCH/DELETE /api/users/me. Публичный маршрут.',
        tags: ['Пользователь'],
        responses: {
          200: {
            description: 'Описание раздела и доступных методов',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    me: { type: 'string', example: '/api/users/me' },
                    methods: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'Регистрация пользователя',
        description: 'Публичный маршрут, JWT не требуется.',
        tags: ['Аутентификация'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } } },
        responses: {
          201: { description: 'Пользователь создан', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          400: { description: 'Ошибка валидации', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Вход по email и паролю',
        description: 'Возвращает JWT и данные пользователя. Публичный маршрут.',
        tags: ['Аутентификация'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } } },
        responses: {
          200: { description: 'Успешный вход', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
          401: { description: 'Неверный email или пароль', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          400: { description: 'Ошибка валидации', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/users/me': {
      get: {
        summary: 'Текущий пользователь',
        description: 'Данные по JWT. Требуется заголовок Authorization: Bearer <token>.',
        tags: ['Пользователь'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Профиль пользователя', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { description: 'Токен отсутствует или недействителен', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Пользователь не найден', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        summary: 'Обновить текущего пользователя',
        description: 'Обновление полей (например name). Требуется JWT.',
        tags: ['Пользователь'],
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateMeBody' } } } },
        responses: {
          200: { description: 'Обновлённый пользователь', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          400: { description: 'Ошибка валидации', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Токен отсутствует или недействителен', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        summary: 'Удалить текущего пользователя',
        description: 'Удаление аккаунта по JWT.',
        tags: ['Пользователь'],
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Пользователь удалён' },
          401: { description: 'Токен отсутствует или недействителен', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Пользователь не найден', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/admin/users': {
      get: {
        summary: 'Список всех пользователей',
        description: 'Только для роли admin. Требуется JWT с role: admin.',
        tags: ['Админ'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Массив пользователей (без паролей)', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } },
          401: { description: 'Токен отсутствует или недействителен', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Доступ запрещён (не admin)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/admin/users/{id}': {
      get: {
        summary: 'Получить пользователя по id',
        tags: ['Админ'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Пользователь', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { description: 'Токен отсутствует или недействителен', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Доступ запрещён', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Пользователь не найден', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        summary: 'Обновить пользователя по id',
        tags: ['Админ'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUserBody' } } } },
        responses: {
          200: { description: 'Обновлённый пользователь', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          400: { description: 'Ошибка валидации', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Токен отсутствует или недействителен', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Доступ запрещён', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Пользователь не найден', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        summary: 'Удалить пользователя по id',
        tags: ['Админ'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          204: { description: 'Пользователь удалён' },
          401: { description: 'Токен отсутствует или недействителен', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Доступ запрещён', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Пользователь не найден', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  }
}};
