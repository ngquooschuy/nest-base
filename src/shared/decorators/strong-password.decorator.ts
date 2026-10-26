import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const StrongPassword = () =>
  applyDecorators(
    IsString(),
    MinLength(8),
    MaxLength(72),
    Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
      message: 'Mật khẩu phải có cả chữ và số',
    }),
  );
