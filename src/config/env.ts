import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default(1480),
  DATABASE_URL: z.string().url('DATABASE_URL должен быть валидным URL'),
  CORS_ORIGIN: z.string().url().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET должен быть минимум 32 символа'),
});

export type Env = z.infer<typeof envSchema>;

// Валидация при импорте
export const env = envSchema.parse(process.env);