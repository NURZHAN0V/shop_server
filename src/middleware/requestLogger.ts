import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  // Логируем входящий запрос
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  }, 'Входящий запрос');

  // Перехватываем окончание ответа
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    // Разные уровни логирования в зависимости от статуса
    if (res.statusCode >= 500) {
      logger.error(logData, 'Ошибка сервера');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'Ошибка клиента');
    } else {
      logger.info(logData, 'Запрос выполнен');
    }
  });

  next();
};