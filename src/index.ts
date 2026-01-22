import 'dotenv/config';
import app from './app';
import { logger } from './lib/logger';
import { env } from './config/env';
import prisma from './lib/prisma';
import userRouter from './routes/user';

app.get('/', (_, res) => {
  res.json({ message: 'Сервер работает!' });
});

// Маршруты пользователей
app.use('/api/users', userRouter);

const server = app.listen(env.PORT, () => {
  logger.info(`Server starter http://localhost:${env.PORT}`);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM получен, завершение работы...');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
});