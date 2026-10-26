import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => {
  const u = new URL(process.env.REDIS_URL as string);
  return {
    url: u.toString(),
    host: u.hostname,
    port: Number(u.port || 6379),
    username: u.username || undefined,
    password: u.password || undefined,
    db: Number(u.pathname.slice(1) || 0),
  };
});
