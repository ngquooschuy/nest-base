import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000), //Vì sao cần coerce? Mọi giá trị trong .env đều là chuỗi. coerce ép kiểu trước rồi mới kiểm tra.
  APP_NAME: z.string().min(1),
  CORS_ORIGINS: z.string().default('http://localhost:4200'),
  SWAGGER_ENABLED: z.enum(['true', 'false']).default('true'),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  DATABASE_URL: z.string().url(),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  DB_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  JWT_ACCESS_SECRET: z.string().min(32), // secret ngắn thì từ chối khởi động
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(604800),
  FRONTEND_URL: z.string().url(),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  REDIS_URL: z.string().url(),
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`❌ Invalid environment variables:\n${errors}`);
  }
  return result.data;
}
