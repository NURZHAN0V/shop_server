import { PrismaClient } from '../../prisma/generated/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { env } from '../config/env';

const sqlite = new PrismaBetterSqlite3({ url: env.DATABASE_URL });

/** Единый экземпляр Prisma с адаптером better-sqlite3. */
const prisma = new PrismaClient({ adapter: sqlite });

/** Type guard: ошибка «запись не найдена» (P2025). */
export function isPrismaNotFoundError(err: unknown): err is { code: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'P2025'
  );
}

export default prisma;