import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { env } from '../config/env';
import { ZodError } from 'zod';

/** Централизованный обработчик ошибок: UnauthorizedError → 401, ZodError → 400, остальное → 500. */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.name === 'UnauthorizedError') {
    logger.warn({ url: req.url, ip: req.ip }, 'Invalid or missing token');
    return res.status(401).json({ error: 'Invalid or missing token' });
  }

  if (err instanceof ZodError) {
    logger.warn(
      { errors: err.issues, url: req.url },
      'Validation error'
    );
    return res.status(400).json({
      error: 'Validation error',
      details: err.issues,
    });
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
    'Unhandled error'
  );

  return res.status(500).json({
    error: env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
};
