import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { appConfig } from './config/app.config';
import type { ConfigType } from '@nestjs/config';

@Controller() // mọi route trong class này bắt đầu từ "/"
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('ping')
  ping() {
    return { status: 'ok', app: this.app.name, env: this.app.env };
  }
}
