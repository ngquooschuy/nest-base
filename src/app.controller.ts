import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller() // mọi route trong class này bắt đầu từ "/"
export class AppController {
  constructor(private readonly appService: AppService) {} //Dependencies Injection  giống angular

  @Get() // Xử lý request GET /
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('ping')
  ping() {
    return { status: 'ok', time: new Date().toISOString() };
  }
}
