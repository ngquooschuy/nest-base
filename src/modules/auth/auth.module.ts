import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { UsersModule } from '@modules/users/users.module';
import { HashService } from '@shared/services/hash.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { BullModule } from '@nestjs/bullmq';
import { QUEUE } from '@infra/queue/queue.constants';
import { MailModule } from '@infra/mail/mail.module';
import { SessionsModule } from '@modules/sessions/sessions.module';
import { RolesGuard } from '@core/guards/roles.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthProcessor } from './auth.processor';

@Module({
  imports: [
    UsersModule, // dùng UsersService đã được export
    SessionsModule, // dùng SessionsRepository
    JwtModule.register({}), // để trống: truyền secret riêng ở từng lần sign/verify (access ≠ refresh)
    MailModule,
    BullModule.registerQueue({ name: QUEUE.AUTH }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    HashService,
    AuthProcessor,
    // ⚠️ NƠI DUY NHẤT khai báo global guard. Thứ tự = thứ tự chạy.
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // 1. chặn spam trước, rẻ nhất
    { provide: APP_GUARD, useClass: JwtAuthGuard }, // 2. xác thực
    { provide: APP_GUARD, useClass: RolesGuard }, // 3. phân quyền
  ],
})
export class AuthModule {}
