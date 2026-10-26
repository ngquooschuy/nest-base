import { Injectable } from '@nestjs/common';
import type { Prisma } from '@generated/prisma/client';
import { PrismaService } from '@infra/database/prisma.service';

type Db = PrismaService | Prisma.TransactionClient;

const GRACE_MS = 10_000;

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.SessionUncheckedCreateInput) {
    return this.prisma.session.create({ data });
  }

  findById(id: string) {
    return this.prisma.session.findUnique({ where: { id } });
  }

  /**
   * Xoay token theo kiểu compare-and-swap: chỉ cập nhật khi hash hiện tại ĐÚNG là hash cũ.
   * CAS 1: token hiện tại → xoay bình thường, bắt đầu tính đồng hồ grace
   * CAS 2: token vừa bị xoay < 10s (tab thứ 2) → cho phép, nhưng KHÔNG cập nhật rotatedAt
   * Trả về false nếu token cũ đã bị xoay trước đó ngoài grace period → dấu hiệu token bị dùng lại.
   */
  async rotate(
    id: string,
    oldHash: string,
    newHash: string,
    expiresAt: Date,
  ): Promise<boolean> {
    const now = new Date();

    // CAS 1: token hiện tại → xoay bình thường, bắt đầu tính đồng hồ grace
    const strict = await this.prisma.session.updateMany({
      where: { id, tokenHash: oldHash, revokedAt: null },
      data: {
        tokenHash: newHash,
        previousTokenHash: oldHash,
        rotatedAt: now,
        expiresAt,
        lastUsedAt: now,
      },
    });
    if (strict.count === 1) return true;

    // CAS 2: token vừa bị xoay < 10s (tab thứ 2) → cho phép, nhưng KHÔNG cập nhật rotatedAt
    const grace = await this.prisma.session.updateMany({
      where: {
        id,
        previousTokenHash: oldHash,
        rotatedAt: { gte: new Date(now.getTime() - GRACE_MS) },
        revokedAt: null,
      },
      data: { tokenHash: newHash, lastUsedAt: now },
    });
    return grace.count === 1;
  }

  revoke(id: string) {
    return this.prisma.session.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllByUser(userId: string, db: Db = this.prisma) {
    return db.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
