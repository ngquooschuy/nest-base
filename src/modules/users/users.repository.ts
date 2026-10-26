import { Injectable } from '@nestjs/common';
import type { Prisma } from '@generated/prisma/client';
import { PrismaService } from '@infra/database/prisma.service';

const notDeleted = { deletedAt: null } satisfies Prisma.UserWhereInput;

interface FindManyParams {
  skip: number;
  take: number;
  search?: string;
  orderBy: Prisma.UserOrderByWithRelationInput;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findFirst({ where: { id, ...notDeleted } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findFirst({ where: { email, ...notDeleted } });
  }

  async findMany({ skip, take, search, orderBy }: FindManyParams) {
    const where: Prisma.UserWhereInput = {
      ...notDeleted,
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { fullName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    // Hai query cùng chạy trong một transaction, nên items và total khớp nhau
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, skip, take, orderBy }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total };
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
