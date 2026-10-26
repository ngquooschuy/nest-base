import { HttpStatus, Injectable } from '@nestjs/common';
import { Role, type Prisma } from '@generated/prisma/client';
import type { JwtPayload } from '@modules/auth/types/jwt-payload';
import type { Paginated } from '@shared/dto/api-response';
import { BusinessException } from '@shared/exceptions/business.exception';
import { ErrorCode } from '@shared/exceptions/error-codes';
import { HashService } from '@shared/services/hash.service';
import { toPageMeta, toSkipTake } from '@shared/utils/pagination.util';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UserResponseDto } from './dto/user-response.dto';
import type { UsersQueryDto } from './dto/users-query.dto';
import { toUserResponse } from './users.mapper';
import { UsersRepository } from './users.repository';
import { isUniqueViolation } from '@core/filters/prisma-error.mapper';
import { PrismaService } from '@infra/database/prisma.service';
import { SessionsRepository } from '@modules/sessions/sessions.repository';
import { CacheService } from '@infra/cache/cache.service';

const USER_TTL = 5 * 60_000; // 5 phút
const LIST_TTL = 60_000; // 1 phút

@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly hash: HashService,
    private readonly prisma: PrismaService,
    private readonly sessions: SessionsRepository,
    private readonly cache: CacheService,
  ) { }

  async findAll(q: UsersQueryDto): Promise<Paginated<UserResponseDto>> {
    const v = await this.cache.version('users:list');
    const key = `users:list:v${v}:${q.page}:${q.limit}:${q.sortBy}:${q.order}:${q.search ?? ''}`;
    return this.cache.getOrSet(key, LIST_TTL, async () => {
      const { items, total } = await this.repo.findMany({
        ...toSkipTake(q.page, q.limit),
        search: q.search,
        orderBy: { [q.sortBy]: q.order },
      });
      return {
        items: items.map(toUserResponse),
        meta: toPageMeta(q.page, q.limit, total),
      };
    });
  }

  async findOne(actor: JwtPayload, id: string): Promise<UserResponseDto> {
    this.assertCanManage(actor, id); // ⚠️ kiểm tra quyền TRƯỚC khi đọc cache
    return this.cache.getOrSet(`user:${id}`, USER_TTL, async () =>
      toUserResponse(await this.getOrThrow(id)),
    );
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const email = dto.email.toLowerCase();
    await this.ensureEmailAvailable(email);

    try {
      const user = await this.repo.create({
        ...dto,
        email,
        password: await this.hash.hash(dto.password),
      });
      await this.invalidate();
      return toUserResponse(user);
    } catch (e) {
      if (isUniqueViolation(e)) {
        throw new BusinessException(
          ErrorCode.EMAIL_ALREADY_EXISTS,
          'Email đã được sử dụng',
          HttpStatus.CONFLICT,
        );
      }
      throw e;
    }
  }

  async update(
    actor: JwtPayload,
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    this.assertCanManage(actor, id);
    const current = await this.getOrThrow(id);
    const { password, email, ...rest } = dto;

    if (email && email.toLowerCase() !== current.email) {
      await this.ensureEmailAvailable(email.toLowerCase());
    }

    try {
      const user = await this.repo.update(id, {
        ...rest,
        ...(email ? { email: email.toLowerCase() } : {}),
        ...(password ? { password: await this.hash.hash(password) } : {}),
      });
      await this.invalidate(id);
      return toUserResponse(user);
    } catch (e) {
      if (isUniqueViolation(e)) {
        throw new BusinessException(
          ErrorCode.EMAIL_ALREADY_EXISTS,
          'Email đã được sử dụng',
          HttpStatus.CONFLICT,
        );
      }
      throw e;
    }
  }

  async changeRole(
    actor: JwtPayload,
    id: string,
    role: Role,
  ): Promise<UserResponseDto> {
    if (actor.sub === id) {
      throw new BusinessException(
        ErrorCode.FORBIDDEN,
        'Không thể tự đổi role của chính mình',
        HttpStatus.FORBIDDEN,
      );
    }
    await this.getOrThrow(id);
    const updated = await this.repo.update(id, { role });

    await this.sessions.revokeAllByUser(id);

    await this.invalidate(id);
    return toUserResponse(updated);
  }

  async remove(actor: JwtPayload, id: string): Promise<void> {
    this.assertCanManage(actor, id);
    await this.getOrThrow(id);
    await this.prisma.$transaction(async (tx) => {
      await this.repo.softDelete(id, tx);
      await this.sessions.revokeAllByUser(id, tx);
    }); // cả hai cùng thành công, hoặc cùng rollback
    await this.invalidate(id);
  }

  /** CHỈ dùng nội bộ cho Auth: trả về entity CÓ password. Không bao giờ trả hàm này ra controller. */
  findForAuth(email: string) {
    return this.repo.findByEmail(email.toLowerCase());
  }

  /** Lấy entity theo id, dùng cho /auth/me */
  findEntityById(id: string) {
    return this.repo.findById(id);
  }

  /** Đặt mật khẩu mới (đã tự hash). Có thể chạy trong transaction. */
  async setPassword(id: string, plain: string, db?: Prisma.TransactionClient) {
    await this.repo.update(id, { password: await this.hash.hash(plain) }, db);
    await this.invalidate(id);
  }

  // ===== helpers =====
  // Gọi sau MỌI thao tác ghi: create, update, changeRole, remove, setPassword
  private async invalidate(id?: string) {
    await Promise.all([
      this.cache.bump('users:list'),
      id ? this.cache.del(`user:${id}`) : undefined,
    ]);
  }
  /** ADMIN thao tác được với mọi user; USER chỉ thao tác được với chính mình */
  private assertCanManage(actor: JwtPayload, targetId: string) {
    if (actor.role !== Role.ADMIN && actor.sub !== targetId) {
      throw new BusinessException(
        ErrorCode.FORBIDDEN,
        'Bạn chỉ có thể thao tác với tài khoản của mình',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async getOrThrow(id: string) {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new BusinessException(
        ErrorCode.USER_NOT_FOUND,
        'Không tìm thấy người dùng',
        HttpStatus.NOT_FOUND,
      );
    }
    return user;
  }

  private async ensureEmailAvailable(email: string) {
    if (await this.repo.findByEmail(email)) {
      throw new BusinessException(
        ErrorCode.EMAIL_ALREADY_EXISTS,
        'Email đã được sử dụng',
        HttpStatus.CONFLICT,
      );
    }
  }
}
