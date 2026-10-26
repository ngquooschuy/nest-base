import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class HashService {
  hash(plain: string): Promise<string> {
    return argon2.hash(plain);
  }

  verify(hashed: string, plain: string): Promise<boolean> {
    return argon2.verify(hashed, plain);
  }
}
