import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '@modules/auth/types/jwt-payload';

export const CurrentUser = createParamDecorator(
  (field: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest<Request>().user;
    return field ? user?.[field] : user;
  },
);
// Cách dùng: @CurrentUser() user: JwtPayload   hoặc   @CurrentUser('sub') userId: string
