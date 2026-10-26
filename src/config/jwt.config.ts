import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET as string,
  accessTtl: Number(process.env.JWT_ACCESS_TTL ?? 900),
  refreshSecret: process.env.JWT_REFRESH_SECRET as string,
  refreshTtl: Number(process.env.JWT_REFRESH_TTL ?? 604800),
}));
