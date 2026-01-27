import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';

import { env } from './config/env';
import { corsMiddleware } from './middleware/cors';
import { helmetMiddleware } from './middleware/helmet';
import { compressionMiddleware } from './middleware/compression';
import { apiLimiter } from './middleware/rateLimit';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { expressjwt } from 'express-jwt';

import { logger } from './lib/logger';
import prisma from './lib/prisma';
import authRouter from './routes/auth';
import userRouter from './routes/user';
import adminRouter from './routes/admin';
import { requireAdmin } from './middleware/requireAdmin';

const app = express();

app.use(helmet());
app.use(compressionMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);
app.use(apiLimiter);
app.use(helmetMiddleware);
app.use(
  cors({
    origin: env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
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
      '/api/auth/login',
      { url: '/api/auth/register', methods: ['POST'] },
    ],
  })
);

app.get('/', (_, res) => {
  res.json({ message: 'Сервер работает!' });
});
app.use('/api/auth', authRouter);
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

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM получен, завершение работы...');
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}
