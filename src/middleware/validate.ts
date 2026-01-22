import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../lib/logger';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Валидируем и преобразуем весь запрос (body, params, query)
      const validated = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // Сохраняем преобразованные значения обратно в req
      if (validated.body) req.body = validated.body;
      if (validated.params) req.params = validated.params;
      if (validated.query) req.query = validated.query;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ errors: error.issues }, 'Ошибка валидации');
        return res.status(400).json({
          error: 'Ошибка валидации',
          details: error.issues.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};