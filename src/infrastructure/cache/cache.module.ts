import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createKeyv } from '@keyv/redis';
import { redisConfig } from '@config/redis.config';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      inject: [redisConfig.KEY],
      useFactory: (redis: ConfigType<typeof redisConfig>) => ({
        stores: [createKeyv(redis.url)],
        ttl: 60_000, // mặc định 60 giây, tính bằng MILLI giây
      }),
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class AppCacheModule {}
