import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { ConfigType } from '@nestjs/config';
import { appConfig } from '@config/app.config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY); // lấy config ngoài DI

  app.setGlobalPrefix('api'); // (1)
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' }); // (2)
  app.enableCors({ origin: config.corsOrigins, credentials: true }); // (3)
  app.enableShutdownHooks(); // (4)

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
