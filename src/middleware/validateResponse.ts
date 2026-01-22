import { Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { logger } from '../lib/logger';

export const validateResponse = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = (data: unknown) => {
      try {
        const validated = schema.parse(data);
        return originalJson(validated);
      } catch (error) {
        logger.error({ error }, 'Ошибка валидации ответа');
        return originalJson({ error: 'Ошибка формирования ответа' });
      }
    };

    next();
  };
};