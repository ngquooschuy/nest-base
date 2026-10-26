import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { UsersModule } from '@modules/users/users.module';
import { HashService } from '@shared/services/hash.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UsersModule, // dùng UsersService đã được export
    JwtModule.register({}), // để trống: truyền secret riêng ở từng lần sign/verify (access ≠ refresh)
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    HashService,
    { provide: APP_GUARD, useClass: JwtAuthGuard }, // khóa TOÀN BỘ app
  ],
})
export class AuthModule {}
