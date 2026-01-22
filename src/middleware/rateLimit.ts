import rateLimit from 'express-rate-limit';
import { logger } from '../lib/logger';

// Общий лимит для всех API
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 15 минут
  max: 100, // 100 запросов с одного IP
  message: 'Слишком много запросов с этого IP, попробуйте позже',
  standardHeaders: true, // Возвращает rate limit info в заголовках
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Слишком много запросов, попробуйте позже',
    });
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Только 5 попыток входа
  skipSuccessfulRequests: true, // Не считаем успешные запросы
});