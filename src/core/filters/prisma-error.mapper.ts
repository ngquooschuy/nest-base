import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@generated/prisma/client';
import { ErrorCode } from '@shared/exceptions/error-codes';

interface MappedError {
  status: number;
  code: ErrorCode;
  message: string;
}

export function mapPrismaError(e: unknown): MappedError | null {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return null;

  switch (e.code) {
    case 'P2002': // vi phạm UNIQUE
      return {
        status: HttpStatus.CONFLICT,
        code: ErrorCode.CONFLICT,
        message: 'Dữ liệu đã tồn tại',
      };
    case 'P2025': // không tìm thấy bản ghi để update/delete
      return {
        status: HttpStatus.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
        message: 'Không tìm thấy dữ liệu',
      };
    case 'P2003': // vi phạm khóa ngoại
      return {
        status: HttpStatus.BAD_REQUEST,
        code: ErrorCode.BAD_REQUEST,
        message: 'Dữ liệu liên kết không hợp lệ',
      };
    default:
      return null; // mã lỗi khác vẫn là 500, vì đó là bug thật
  }
}

export function isUniqueViolation(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
  );
}
