import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig } from '@config/app.config';
import { validateEnv } from './config/env.validation';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from '@core/core.module';
import { UsersModule } from './modules/users/users.module';
import { databaseConfig } from '@config/database.config';
import { jwtConfig } from '@config/jwt.config';
import { redisConfig } from '@config/redis.config';
import { mailConfig } from '@config/mail.config';
import { PrismaModule } from '@infra/database/prisma.module';
import { AppCacheModule } from '@infra/cache/cache.module';
import { QueueModule } from '@infra/queue/queue.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ~ providedIn: 'root', module nào cũng inject được
      cache: true,
      validate: validateEnv,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, mailConfig],
    }),
    CoreModule,
    PrismaModule,
    AppCacheModule,
    QueueModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
