import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { TransformResponseInterceptor } from './interceptors/transform-response.interceptor';
import { createValidationPipe } from './pipes/validation.pipe';
import { LoggerModule } from 'nestjs-pino';
import { appConfig } from '@config/app.config';
import { ConfigType } from '@nestjs/config';
import { loggerConfig } from './logger/logger.config';
@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [appConfig.KEY],
      useFactory: (app: ConfigType<typeof appConfig>) => loggerConfig(app),
    }),
  ],
  providers: [
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformResponseInterceptor },
  ],
})
export class CoreModule {}
