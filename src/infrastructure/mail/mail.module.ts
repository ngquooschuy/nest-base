import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QUEUE } from '@infra/queue/queue.constants';
import { MailProcessor } from './mail.processor';
import { MailQueue } from './mail.queue';
import { MailService } from './mail.service';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE.MAIL })],
  providers: [MailService, MailQueue, MailProcessor],
  exports: [MailQueue], // module khác CHỈ được đẩy job, không gọi SMTP trực tiếp
})
export class MailModule {}
