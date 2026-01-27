import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { logger } from '../lib/logger';

type ValidatedRequest = {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string | string[]>;
};

export const validate = (schema: z.ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = (await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      })) as ValidatedRequest;

      if (validated.body !== undefined) req.body = validated.body;
      if (validated.params !== undefined) req.params = validated.params;
      if (validated.query !== undefined) req.query = validated.query;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ errors: error.issues }, 'Validation error');
        return res.status(400).json({
          error: 'Validation error',
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