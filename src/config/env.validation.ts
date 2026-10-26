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
