import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL as string,
  poolMax: Number(process.env.DB_POOL_MAX ?? 10),
  statementTimeoutMs: Number(process.env.DB_STATEMENT_TIMEOUT_MS ?? 10000),
}));
