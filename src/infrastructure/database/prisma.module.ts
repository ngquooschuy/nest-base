import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // module nào cũng inject được PrismaService mà không cần import
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
