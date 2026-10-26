import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Request, Response } from 'express';
import { appConfig } from '@config/app.config';
import type { ApiError } from '@shared/dto/api-response';
import { BusinessException } from '@shared/exceptions/business.exception';
import { ErrorCode } from '@shared/exceptions/error-codes';
import { mapPrismaError } from './prisma-error.mapper';

function codeFromStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCode.BAD_REQUEST;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    case 408:
      return ErrorCode.REQUEST_TIMEOUT;
    case 429:
      return ErrorCode.TOO_MANY_REQUESTS;
    default:
      return status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST;
  }
}

@Catch() // không truyền tham số = bắt MỌI loại lỗi
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { status, error } = this.normalize(exception);

    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${req.method} ${req.url} → ${status} ${error.code}`);
    }

    const body: ApiError = {
      success: false,
      error,
      path: req.url,
      requestId: String(req.id), // pino-http gắn sẵn req.id
      timestamp: new Date().toISOString(),
    };
    res.status(status).json(body);
  }

  private normalize(exception: unknown): {
    status: number;
    error: ApiError['error'];
  } {
    // (1) Lỗi nghiệp vụ do mình chủ động throw: PHẢI kiểm tra trước tiên
    if (exception instanceof BusinessException) {
      return {
        status: exception.getStatus(),
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
        },
      };
    }

    // (1.5) Lỗi Prisma đã biết
    const prismaError = mapPrismaError(exception);
    if (prismaError) {
      const { status, code, message } = prismaError;
      return { status, error: { code, message } };
    }

    // (2) Lỗi HTTP có sẵn của Nest: NotFoundException, ForbiddenException...
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const raw =
        typeof body === 'string'
          ? body
          : (body as { message?: string | string[] }).message;
      return {
        status,
        error: {
          code: codeFromStatus(status),
          message: Array.isArray(raw)
            ? 'Validation failed'
            : (raw ?? exception.message),
          details: Array.isArray(raw) ? raw : undefined,
        },
      };
    }

    // (3) Lỗi không lường trước: bug, mất kết nối DB...
    const isProd = this.app.env === 'production';
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: isProd
          ? 'Internal server error'
          : exception instanceof Error
            ? exception.message
            : 'Unknown error',
      },
    };
  }
}
