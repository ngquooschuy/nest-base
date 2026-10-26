import { HttpStatus, Injectable } from '@nestjs/common';
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

@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly hash: HashService,
    private readonly prisma: PrismaService,
    private readonly sessions: SessionsRepository,
  ) {}

  async findAll(q: UsersQueryDto): Promise<Paginated<UserResponseDto>> {
    const { items, total } = await this.repo.findMany({
      ...toSkipTake(q.page, q.limit),
      search: q.search,
      orderBy: { [q.sortBy]: q.order },
    });
    return {
      items: items.map(toUserResponse),
      meta: toPageMeta(q.page, q.limit, total),
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    return toUserResponse(await this.getOrThrow(id));
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

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
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

  async remove(id: string): Promise<void> {
    await this.getOrThrow(id);
    await this.prisma.$transaction(async (tx) => {
      await this.repo.softDelete(id, tx);
      await this.sessions.revokeAllByUser(id, tx);
    }); // cả hai cùng thành công, hoặc cùng rollback
  }

  /** CHỈ dùng nội bộ cho Auth: trả về entity CÓ password. Không bao giờ trả hàm này ra controller. */
  findForAuth(email: string) {
    return this.repo.findByEmail(email.toLowerCase());
  }

  /** Lấy entity theo id, dùng cho /auth/me */
  findEntityById(id: string) {
    return this.repo.findById(id);
  }

  // ===== helpers =====
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
