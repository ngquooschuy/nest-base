import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { ConfigType } from '@nestjs/config';
import { appConfig } from '@config/app.config';
import { AppModule } from './app.module';
import { Logger as PinoLogger } from 'nestjs-pino';
import { setupSwagger } from '@core/swagger/swagger.setup';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(PinoLogger));

  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY); // lấy config ngoài DI

  if (config.trustProxy > 0) app.set('trust proxy', config.trustProxy); // số tầng proxy đứng trước app

  app.use(
    helmet({
      // CSP chủ yếu bảo vệ trang HTML. API trả JSON nên chỉ bật CSP ở production;
      // tắt ở dev để Swagger UI không bị chặn script
      contentSecurityPolicy: config.env === 'production' ? undefined : false,
    }),
  );

  app.setGlobalPrefix('api'); // (1)
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' }); // (2)
  app.enableCors({ origin: config.corsOrigins, credentials: true }); // (3)
  app.enableShutdownHooks(); // (4)

  setupSwagger(app, config);
  app.use(cookieParser());
  await app.listen(config.port);
  Logger.log(
    `🏃‍♂️${config.name} [${config.env}] is running at: http://localhost:${config.port}/api/v1`,
    'Bootstrap',
  );
}

bootstrap().catch((err) => {
  console.error('Failed to start app', err);
  process.exit(1);
});
