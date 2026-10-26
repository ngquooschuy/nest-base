import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { mailConfig } from '@config/mail.config';

@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly transporter: Transporter;

  constructor(
    @Inject(mailConfig.KEY) private readonly cfg: ConfigType<typeof mailConfig>,
  ) {
    this.transporter = createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    });
  }

  async send(msg: { to: string; subject: string; html: string; text: string }) {
    await this.transporter.sendMail({ from: this.cfg.from, ...msg });
  }

  onModuleDestroy() {
    this.transporter.close();
  }
}
