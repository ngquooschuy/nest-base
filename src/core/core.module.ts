import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { TransformResponseInterceptor } from './interceptors/transform-response.interceptor';
import { createValidationPipe } from './pipes/validation.pipe';
import { LoggerModule } from 'nestjs-pino';
import { appConfig } from '@config/app.config';
import { ConfigType } from '@nestjs/config';
import { loggerConfig } from './logger/logger.config';
import { TimeoutInterceptor } from './interceptors/timeout.interceptor';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { redisConfig } from '@config/redis.config';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [appConfig.KEY],
      useFactory: (app: ConfigType<typeof appConfig>) => loggerConfig(app),
    }),
    ThrottlerModule.forRootAsync({
      inject: [appConfig.KEY, redisConfig.KEY],
      useFactory: (
        app: ConfigType<typeof appConfig>,
        redis: ConfigType<typeof redisConfig>,
      ) => ({
        throttlers: [{ ttl: app.throttleTtlMs, limit: app.throttleLimit }], // mặc định 100 request / 60 giây / IP
        storage: new ThrottlerStorageRedisService(redis.url),
      }),
    }),
  ],
  providers: [
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformResponseInterceptor },
  ],
})
export class CoreModule {}
