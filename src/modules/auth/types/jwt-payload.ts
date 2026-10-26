import type { Role } from '@generated/prisma/client';

export interface JwtPayload {
  sub: string; // "subject" = user id, đây là tên chuẩn của JWT
  role: Role;
}
