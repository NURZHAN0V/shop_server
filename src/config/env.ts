import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default(1480),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  CORS_ORIGIN: z.string().url().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_AUDIENCE: z.string().default('shop-api'),
  JWT_ISSUER: z.string().default('shop-backend'),
});

export type Env = z.infer<typeof envSchema>;

// Валидация при импорте
export const env = envSchema.parse(process.env);
