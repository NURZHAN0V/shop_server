import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Ошибки валидации Zod
  if (err instanceof ZodError) {
    logger.warn({ errors: err.issues }, 'Ошибка валидации');
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: err.issues,
    });
  }

  // Ошибки Prisma
  if (err.name === 'PrismaClientKnownRequestError') {
    logger.error({ error: err }, 'Ошибка базы данных');
    return res.status(500).json({
      error: 'Ошибка базы данных',
    });
  }

  // Остальные ошибки
  logger.error({ error: err, stack: err.stack }, 'Необработанная ошибка');
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Внутренняя ошибка сервера' 
      : err.message,
  });
};