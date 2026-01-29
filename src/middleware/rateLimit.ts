import rateLimit from 'express-rate-limit';
import { logger } from '../lib/logger';

/** Общий лимит для всех API: 100 запросов с одного IP в минуту. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, try again later',
  standardHeaders: true, // Возвращает rate limit info в заголовках
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests, try again later',
    });
  },
});

/** Жёсткий лимит для auth (логин): 5 попыток за 15 мин, без учёта успешных. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Только 5 попыток входа
  skipSuccessfulRequests: true, // Не считаем успешные запросы
});