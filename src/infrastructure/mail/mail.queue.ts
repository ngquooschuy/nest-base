import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { JobsOptions, Queue } from 'bullmq';
import { QUEUE } from '@infra/queue/queue.constants';
import type { TemplateData, TemplateName } from './mail.templates';

export interface SendMailJob<N extends TemplateName = TemplateName> {
  to: string;
  template: N;
  data: TemplateData<N>;
}

@Injectable()
export class MailQueue {
  constructor(
    @InjectQueue(QUEUE.MAIL) private readonly queue: Queue<SendMailJob>,
  ) {}

  /** Đẩy email vào hàng đợi, trả về ngay, không chờ gửi */
  send<N extends TemplateName>(
    to: string,
    template: N,
    data: TemplateData<N>,
    opts?: JobsOptions,
  ) {
    return this.queue.add(template, { to, template, data }, opts);
  }
}
