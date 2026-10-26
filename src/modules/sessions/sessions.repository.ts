import { Injectable } from '@nestjs/common';
import type { Prisma } from '@generated/prisma/client';
import { PrismaService } from '@infra/database/prisma.service';

type Db = PrismaService | Prisma.TransactionClient;

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
   * Trả về false nếu token cũ đã bị xoay trước đó → dấu hiệu token bị dùng lại.
   */

  async rotate(
    id: string,
    oldHash: string,
    newHash: string,
    expiresAt: Date,
  ): Promise<boolean> {
    const { count } = await this.prisma.session.updateMany({
      where: { id, tokenHash: oldHash, revokedAt: null },
      data: { tokenHash: newHash, expiresAt, lastUsedAt: new Date() },
    });
    return count === 1;
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
