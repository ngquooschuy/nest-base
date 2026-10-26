import type { Role } from '@generated/prisma/client';

export interface JwtPayload {
  sub: string; // "subject" = user id, đây là tên chuẩn của JWT
  role: Role;
}

export interface RefreshPayload {
  sub: string; // user id
  sid: string; // session id
  jti: string; // id ngẫu nhiên → mỗi token là duy nhất, kể cả khi ký trong cùng 1 giây
}

export interface ClientMeta {
  userAgent?: string;
  ip?: string;
}
