import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { logger } from '../lib/logger';

/** Валидирует тело ответа по Zod-схеме перед отправкой; при ошибке — JSON с error. */
export const validateResponse = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = (data: unknown) => {
      try {
        const validated = schema.parse(data);
        return originalJson(validated);
      } catch (error) {
        logger.error({ error }, 'Response validation error');
        return originalJson({ error: 'Response validation failed' });
      }
    };

    next();
  };
};