import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig } from '@config/app.config';
import { validateEnv } from './config/env.validation';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from '@core/core.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ~ providedIn: 'root', module nào cũng inject được
      cache: true,
      validate: validateEnv,
      load: [appConfig],
    }),
    CoreModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
