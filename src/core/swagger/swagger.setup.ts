import type { INestApplication } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { appConfig } from '@config/app.config';

export function setupSwagger(
  app: INestApplication,
  cfg: ConfigType<typeof appConfig>,
) {
  if (!cfg.swaggerEnabled) return;

  const config = new DocumentBuilder()
    .setTitle(cfg.name)
    .setDescription(`${cfg.name} API documentation`)
    .setVersion('1.0')
    .addBearerAuth() // nút "Authorize" để dán JWT, dùng từ Sprint 4
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json', // file OpenAPI để sinh client Angular
    swaggerOptions: { persistAuthorization: true }, // F5 không mất token đã dán
  });
}
