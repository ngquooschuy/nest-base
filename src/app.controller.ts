import {
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  Inject,
  Param,
  Version,
} from '@nestjs/common';
import { AppService } from './app.service';
import { appConfig } from '@config/app.config';
import type { ConfigType } from '@nestjs/config';
import { BusinessException } from '@shared/exceptions/business.exception';
import { ErrorCode } from '@shared/exceptions/error-codes';

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

  @Get('ping')
  @Version('2')
  pingV2() {
    return { status: 'ok', version: 2, uptime: process.uptime() };
  }

  @Get('error-demo/:type')
  errorDemo(@Param('type') type: string) {
    if (type === 'business') {
      throw new BusinessException(
        ErrorCode.USER_NOT_FOUND,
        'Không tìm thấy người dùng',
        HttpStatus.NOT_FOUND,
      );
    }
    if (type === 'http') throw new ForbiddenException();
    throw new Error('Boom! Lỗi không lường trước');
  }

  @Get('slow')
  async slow() {
    await new Promise((r) => setTimeout(r, 5000));
    return 'done';
  }
}
