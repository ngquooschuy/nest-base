import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QUEUE } from '@infra/queue/queue.constants';
import type { SendMailJob } from './mail.queue';
import { MailService } from './mail.service';
import { templates } from './mail.templates';

@Processor(QUEUE.MAIL, { concurrency: 5 }) // xử lý tối đa 5 email song song
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mail: MailService) {
    super();
  }

  async process(job: Job<SendMailJob>): Promise<void> {
    const render = templates[job.data.template] as (d: unknown) => {
      subject: string;
      html: string;
      text: string;
    };
    await this.mail.send({ to: job.data.to, ...render(job.data.data) });
    // KHÔNG log địa chỉ email (thông tin cá nhân), chỉ log id và loại template
    this.logger.log(
      `Sent "${job.name}" (job ${job.id}, attempt ${job.attemptsMade + 1})`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<SendMailJob> | undefined, err: Error) {
    this.logger.warn(
      `Mail job ${job?.id} "${job?.name}" failed (attempt ${job?.attemptsMade}): ${err.message}`,
    );
  }
}
