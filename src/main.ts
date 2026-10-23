import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); // ~ platformBrowserDynamic().bootstrapModule(AppModule)
  await app.listen(process.env.PORT ?? 3000); // mở cổng HTTP để nhận request
}
void bootstrap();
