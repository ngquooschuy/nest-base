import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    const x = 'hello';
    return x;
  }
}
