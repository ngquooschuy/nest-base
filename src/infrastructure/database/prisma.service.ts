import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { databaseConfig } from '@config/database.config';
import { PrismaClient } from '@generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(
    @Inject(databaseConfig.KEY) db: ConfigType<typeof databaseConfig>,
  ) {
    super({
      adapter: new PrismaPg({
        connectionString: db.url,
        max: db.poolMax, // số kết nối tối đa trong pool
        statement_timeout: db.statementTimeoutMs, // Postgres tự hủy query chạy quá lâu
      }),
    });
  }

  async onModuleInit() {
    await this.$connect(); // fail fast: DB chết thì app không khởi động
    this.logger.log('Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect(); // graceful shutdown từ Bài 4 phát huy tác dụng ở đây
  }
}
