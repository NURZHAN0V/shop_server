import { PrismaClient } from '../../prisma/generated/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const sqlite = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });

const prisma = new PrismaClient({ adapter: sqlite });

export default prisma;