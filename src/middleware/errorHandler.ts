import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.name === 'UnauthorizedError') {
    logger.warn({ url: req.url, ip: req.ip }, 'Неверный или отсутствующий токен');
    return res.status(401).json({ error: 'Неверный или отсутствующий токен' });
  }

  logger.error(
    {
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      request: {
        method: req.method,
        url: req.url,
        ip: req.ip,
        body: req.body,
      },
    },
    'Необработанная ошибка'
  );

  if (err instanceof ZodError) {
    logger.warn(
      { errors: err.issues, url: req.url },
      'Ошибка валидации'
    );
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: err.issues,
    });
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Внутренняя ошибка сервера'
      : err.message,
  });
};
