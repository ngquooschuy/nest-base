import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class AppService implements OnApplicationShutdown {
  getHello(): string {
    return 'Hello World!';
  }

  onApplicationShutdown(signal?: string) {
    Logger.log(`Shutting down (signal: ${signal})`, 'AppService');
  }
}
