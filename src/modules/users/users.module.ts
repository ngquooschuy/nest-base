import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { HashService } from '@shared/services/hash.service';
import { SessionsModule } from '@modules/sessions/sessions.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, HashService],
  exports: [UsersService], // Sprint 4: AuthModule sẽ dùng
  imports: [SessionsModule],
})
export class UsersModule {}
