import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Role } from '@generated/prisma/client';
import { ROLES_KEY } from '@shared/decorators/roles.decorator';
import { BusinessException } from '@shared/exceptions/business.exception';
import { ErrorCode } from '@shared/exceptions/error-codes';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!required?.length) return true; //route không yêu cầu role -> chỉ cần đăng nhập

    const user = ctx.switchToHttp().getRequest<Request>().user;
    if (!user || !required.includes(user.role)) {
      throw new BusinessException(
        ErrorCode.FORBIDDEN,
        'Bạn không có quyền thực hiện thao tác này',
        HttpStatus.FORBIDDEN,
      );
    }
    return true;
  }
}
