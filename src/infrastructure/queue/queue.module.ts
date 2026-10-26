import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { redisConfig } from '@config/redis.config';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [redisConfig.KEY],
      useFactory: (r: ConfigType<typeof redisConfig>) => ({
        connection: {
          host: r.host,
          port: r.port,
          username: r.username,
          password: r.password,
          db: r.db,
        },
        prefix: 'nest-base', // tách key của app này với app khác dùng chung Redis
        defaultJobOptions: {
          attempts: 3, // thử tối đa 3 lần
          backoff: { type: 'exponential', delay: 5_000 }, // chờ 5 giây, rồi 10 giây giữa các lần
          removeOnComplete: { count: 1000 }, // chỉ giữ 1000 job thành công gần nhất
          removeOnFail: { count: 5000 }, // giữ job lỗi lâu hơn để điều tra
        },
      }),
    }),
  ],
})
export class QueueModule {}
