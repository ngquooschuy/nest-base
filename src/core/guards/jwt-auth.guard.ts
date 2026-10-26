import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { jwtConfig } from '@config/jwt.config';
import type { JwtPayload } from '@modules/auth/types/jwt-payload';
import { IS_PUBLIC_KEY } from '@shared/decorators/public.decorator';
import { BusinessException } from '@shared/exceptions/business.exception';
import { ErrorCode } from '@shared/exceptions/error-codes';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    @Inject(jwtConfig.KEY) private readonly cfg: ConfigType<typeof jwtConfig>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    // 1. Route có nhãn @Public() thì cho qua (kiểm tra cả ở method lẫn class)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    // 2. Lấy token từ header "Authorization: Bearer xxx"
    const req = ctx.switchToHttp().getRequest<Request>();
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new BusinessException(
        ErrorCode.UNAUTHORIZED,
        'Thiếu access token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 3. Kiểm tra chữ ký và thời hạn
    try {
      req.user = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.cfg.accessSecret,
      });
      return true;
    } catch (e) {
      const expired = e instanceof Error && e.name === 'TokenExpiredError';
      throw new BusinessException(
        expired ? ErrorCode.TOKEN_EXPIRED : ErrorCode.TOKEN_INVALID,
        expired ? 'Access token đã hết hạn' : 'Access token không hợp lệ',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
