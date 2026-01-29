import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';

import { env } from './config/env';
import { corsMiddleware } from './middleware/cors';
import { helmetMiddleware } from './middleware/helmet';
import { compressionMiddleware } from './middleware/compression';
import { apiLimiter, authLimiter } from './middleware/rateLimit';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { expressjwt } from 'express-jwt';

import swaggerUi from 'swagger-ui-express';

import { logger } from './lib/logger';
import prisma from './lib/prisma';
import { openApiSpec } from './openapi/spec';
import authRouter from './routes/auth';
import userRouter from './routes/user';
import adminRouter from './routes/admin';
import { requireAdmin } from './middleware/requireAdmin';

const app = express();

app.use(helmetMiddleware);
app.use(compressionMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);
app.use(apiLimiter);
app.use(requestLogger);
app.use(
  expressjwt({
    secret: env.JWT_SECRET,
    algorithms: ['HS256'],
    audience: env.JWT_AUDIENCE,
    issuer: env.JWT_ISSUER,
  }).unless({
    path: [
      '/',
      '/api',
      '/api/users',
      '/api/auth/login',
      { url: '/api/auth/register', methods: ['POST'] },
      '/api-docs',
      '/api-docs.json',
      { url: /^\/api-docs\/.*/, methods: ['GET'] },
    ],
  })
);

app.get('/', (_, res) => {
  res.json({ message: 'Server is running!' });
});

// GET /api — информация об API и ссылки на разделы (публично)
app.get('/api', (_, res) => {
  res.json({
    api: 'Shop Backend API',
    version: '1.0.0',
    docs: '/api-docs',
    paths: {
      auth: '/api/auth',
      users: '/api/users',
      admin: '/api/admin/users',
    },
  });
});

// GET /api/users — описание раздела «пользователь» (JWT); сами методы — /api/users/me
app.get('/api/users', (_, res) => {
  res.json({
    description: 'Профиль текущего пользователя',
    me: '/api/users/me',
    methods: ['GET', 'PATCH', 'DELETE'],
  });
});

// OpenAPI: JSON-спецификация и Swagger UI (публично, без JWT)
app.get('/api-docs.json', (_, res) => {
  res.json(openApiSpec);
});
// Загрузка спеки по URL, чтобы Swagger UI получал валидный JSON и корректно отображал все операции по тегам
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerUrl: '/api-docs.json',
    swaggerOptions: { docExpansion: 'list' },
  })
);

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/users', userRouter);
app.use('/api/admin/users', requireAdmin, adminRouter);
app.use(errorHandler);

export { app };

// Запуск сервера только при прямом вызове (не при import в тестах)
const __filename = fileURLToPath(import.meta.url);
const isEntry = process.argv[1] === __filename || process.argv[1]?.endsWith('index.ts');

if (isEntry) {
  const server = app.listen(env.PORT, () => {
    logger.info(`Server started http://localhost:${env.PORT}`);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down...');
    server.close(() => {
      prisma.$disconnect().then(() => process.exit(0));
    });
  });
}
