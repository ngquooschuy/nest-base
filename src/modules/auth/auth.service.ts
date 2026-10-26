import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig } from '@config/jwt.config';
import type { User } from '@generated/prisma/client';
import { toUserResponse } from '@modules/users/users.mapper';
import { UsersService } from '@modules/users/users.service';
import { BusinessException } from '@shared/exceptions/business.exception';
import { ErrorCode } from '@shared/exceptions/error-codes';
import { HashService } from '@shared/services/hash.service';
import type { AuthResponseDto } from './dto/auth-response.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './types/jwt-payload';

// Hash giả để so sánh khi email không tồn tại → thời gian phản hồi luôn như nhau
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$Zm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFy';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly hash: HashService,
    private readonly jwt: JwtService,
    @Inject(jwtConfig.KEY) private readonly cfg: ConfigType<typeof jwtConfig>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const created = await this.users.create(dto); // tái dùng toàn bộ logic: check trùng, hash, map
    const user = await this.users.findEntityById(created.id);
    return this.issueTokens(user as User);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.users.findForAuth(dto.email);

    // Luôn chạy verify, kể cả khi user không tồn tại → chống timing attack
    const ok = await this.hash
      .verify(user?.password ?? DUMMY_HASH, dto.password)
      .catch(() => false);
    if (!user || !ok) {
      throw new BusinessException(
        ErrorCode.INVALID_CREDENTIALS,
        'Email hoặc mật khẩu không đúng', // cố ý KHÔNG nói rõ sai ở đâu
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.issueTokens(user);
  }

  async me(userId: string) {
    const user = await this.users.findEntityById(userId);
    if (!user)
      throw new BusinessException(
        ErrorCode.UNAUTHORIZED,
        'Tài khoản không còn tồn tại',
        HttpStatus.UNAUTHORIZED,
      );
    return toUserResponse(user);
  }

  private async issueTokens(user: User): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.cfg.accessSecret,
      expiresIn: this.cfg.accessTtl,
    });
    return {
      accessToken,
      expiresIn: this.cfg.accessTtl,
      user: toUserResponse(user),
    };
  }
}
