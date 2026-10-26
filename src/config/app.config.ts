import { registerAs } from '@nestjs/config';

/**
 * Lớp 2: Cấu hình theo namespace
 *
 * Gợi ý:
 * - Dùng `registerAs('app', ...)` để gom các biến cấu hình liên quan
 *   vào namespace `app`, giúp truy cập thống nhất qua `ConfigService`.
 * - Các cấu hình mới cần tuân theo cùng khuôn mẫu, mỗi nhóm có một
 *   namespace riêng, ví dụ: `database`, `jwt`, `redis`.
 * - Các sprint tiếp theo sẽ lần lượt bổ sung các file
 *   `database.config.ts`, `jwt.config.ts` và `redis.config.ts`.
 */
export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  name: process.env.APP_NAME as string,
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(','),
  swaggerEnabled: (process.env.SWAGGER_ENABLED ?? 'true') === 'true',
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS ?? 10000),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:4200',
}));
