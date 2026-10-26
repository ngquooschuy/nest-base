import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Role } from '@generated/prisma/client';
import { Roles } from './roles.decorator';

/** Yêu cầu đăng nhập (+ role nếu truyền vào), đồng thời ghi chú cho Swagger */
export const Auth = (...roles: Role[]) =>
  applyDecorators(
    Roles(...roles),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Chưa đăng nhập hoặc token hết hạn',
    }),
    ApiForbiddenResponse({ description: 'Không đủ quyền' }),
  );
