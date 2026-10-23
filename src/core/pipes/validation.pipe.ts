import {
  HttpStatus,
  ValidationPipe,
  type ValidationError,
} from '@nestjs/common';
import { BusinessException } from '@shared/exceptions/business.exception';
import { ErrorCode } from '@shared/exceptions/error-codes';

export interface FieldError {
  field: string;
  errors: string[];
}

// Làm phẳng lỗi lồng nhau: address.city, items.0.quantity...
function flatten(errors: ValidationError[], parent = ''): FieldError[] {
  return errors.flatMap((e) => {
    const field = parent ? `${parent}.${e.property}` : e.property;
    const own = e.constraints
      ? [{ field, errors: Object.values(e.constraints) }]
      : [];
    return [...own, ...flatten(e.children ?? [], field)];
  });
}

export function createValidationPipe() {
  return new ValidationPipe({
    whitelist: true, // (1) tự xóa field không khai báo trong DTO
    forbidNonWhitelisted: true, // (2) báo lỗi luôn nếu gửi field lạ
    transform: true, // (3) biến JSON thô thành instance DTO, ép kiểu theo @Type
    exceptionFactory: (errors) =>
      new BusinessException(
        ErrorCode.VALIDATION_FAILED,
        'Validation failed',
        HttpStatus.BAD_REQUEST,
        flatten(errors),
      ),
  });
}
