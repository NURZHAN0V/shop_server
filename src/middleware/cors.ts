import cors from 'cors';
import { env } from '../config/env';

/** CORS: при отсутствии CORS_ORIGIN разрешаются все origin; иначе — список из env. */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!env.CORS_ORIGIN) return callback(null, true);

    const allowedOrigins = env.CORS_ORIGIN.split(',');

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true, // Разрешаем отправку cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});