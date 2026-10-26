import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { appConfig } from '@config/app.config';
import { jwtConfig } from '@config/jwt.config';
import type { User } from '@generated/prisma/client';
import { PrismaService } from '@infra/database/prisma.service';
import { SessionsRepository } from '@modules/sessions/sessions.repository';
import { toUserResponse } from '@modules/users/users.mapper';
import { UsersService } from '@modules/users/users.service';
import { BusinessException } from '@shared/exceptions/business.exception';
import { ErrorCode } from '@shared/exceptions/error-codes';
import { HashService } from '@shared/services/hash.service';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import type { AuthResult } from './types/auth-result';
import type {
  ClientMeta,
  JwtPayload,
  RefreshPayload,
} from './types/jwt-payload';

// Hash giả để so sánh khi email không tồn tại → thời gian phản hồi luôn như nhau
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$Zm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFy';

const RESET_TTL_MS = 15 * 60 * 1000;

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly sessions: SessionsRepository,
    private readonly hash: HashService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    @Inject(jwtConfig.KEY) private readonly cfg: ConfigType<typeof jwtConfig>,
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
  ) {}

  async register(dto: RegisterDto, meta: ClientMeta = {}): Promise<AuthResult> {
    const created = await this.users.create(dto);
    const user = await this.users.findEntityById(created.id);
    return this.startSession(user as User, meta);
  }

  async login(dto: LoginDto, meta: ClientMeta = {}): Promise<AuthResult> {
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
    return this.startSession(user, meta);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    meta: ClientMeta = {},
  ): Promise<AuthResult> {
    const user = await this.users.findEntityById(userId);
    if (
      !user ||
      !(await this.hash.verify(user.password, dto.currentPassword))
    ) {
      throw new BusinessException(
        ErrorCode.INVALID_CREDENTIALS,
        'Mật khẩu hiện tại không đúng',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.users.setPassword(userId, dto.newPassword);
    await this.sessions.revokeAllByUser(userId); // đăng xuất MỌI thiết bị khác
    return this.startSession(user, meta); // cấp session mới cho thiết bị hiện tại
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.users.findForAuth(email);
    if (!user) return; // im lặng: KHÔNG tiết lộ email có tồn tại hay không

    const token = randomBytes(32).toString('base64url'); // 256 bit ngẫu nhiên → SHA-256 là đủ (Bài 13)

    await this.prisma.$transaction([
      // vô hiệu hóa các link reset cũ còn hiệu lực
      this.prisma.passwordReset.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: sha256(token),
          expiresAt: new Date(Date.now() + RESET_TTL_MS),
        },
      }),
    ]);

    const link = `${this.app.frontendUrl}/reset-password?token=${token}`;
    // TODO Sprint 5: gửi email qua queue. Tạm thời chỉ log ở môi trường dev:
    if (this.app.env !== 'production') {
      this.logger.log(`[DEV] Reset link for ${user.email}: ${link}`);
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const record = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: sha256(dto.token) },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw this.invalidResetToken();
    }

    await this.prisma.$transaction(async (tx) => {
      // compare-and-swap: chỉ một request được dùng token này
      const { count } = await tx.passwordReset.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (count !== 1) throw this.invalidResetToken();

      await this.users.setPassword(record.userId, dto.newPassword, tx);
      await this.sessions.revokeAllByUser(record.userId, tx);
    });
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

  async refresh(token: string | undefined): Promise<AuthResult> {
    if (!token)
      throw this.unauthorized(
        ErrorCode.REFRESH_TOKEN_INVALID,
        'Thiếu refresh token',
      );

    // 1. Kiểm tra chữ ký và hạn, dùng SECRET RIÊNG của refresh
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(token, {
        secret: this.cfg.refreshSecret,
      });
    } catch {
      throw this.unauthorized(
        ErrorCode.REFRESH_TOKEN_INVALID,
        'Refresh token không hợp lệ',
      );
    }

    // 2. Session phải còn sống
    const session = await this.sessions.findById(payload.sid);
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw this.unauthorized(
        ErrorCode.SESSION_REVOKED,
        'Phiên đăng nhập đã kết thúc',
      );
    }

    // 3. User phải còn tồn tại; nếu đã bị xóa thì chặn TẠI ĐÂY (câu 3 Bài 12)
    const user = await this.users.findEntityById(session.userId);
    if (!user) {
      await this.sessions.revoke(session.id);
      throw this.unauthorized(
        ErrorCode.SESSION_REVOKED,
        'Tài khoản không còn hoạt động',
      );
    }

    // 4. Xoay token theo kiểu compare-and-swap
    const newRefresh = await this.signRefresh(user.id, session.id);
    const rotated = await this.sessions.rotate(
      session.id,
      sha256(token),
      sha256(newRefresh),
      this.refreshExpiry(),
    );

    if (!rotated) {
      // Token hợp lệ về chữ ký nhưng KHÔNG còn là token hiện tại → bị dùng lại → nghi bị đánh cắp
      await this.sessions.revokeAllByUser(user.id);
      this.logger.warn(
        `Refresh token reuse detected: user=${user.id} session=${session.id}`,
      );
      throw this.unauthorized(
        ErrorCode.SESSION_REVOKED,
        'Phát hiện phiên bất thường, vui lòng đăng nhập lại',
      );
    }

    return { ...(await this.accessFor(user)), refreshToken: newRefresh };
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    try {
      const { sid } = await this.jwt.verifyAsync<RefreshPayload>(token, {
        secret: this.cfg.refreshSecret,
      });
      await this.sessions.revoke(sid);
    } catch {
      // token hỏng hoặc hết hạn: coi như đã logout, không báo lỗi
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessions.revokeAllByUser(userId);
  }

  // ===== helpers =====
  private async startSession(
    user: User,
    meta: ClientMeta,
  ): Promise<AuthResult> {
    const sid = randomUUID();
    const refreshToken = await this.signRefresh(user.id, sid);
    await this.sessions.create({
      id: sid,
      userId: user.id,
      tokenHash: sha256(refreshToken),
      userAgent: meta.userAgent?.slice(0, 255),
      ip: meta.ip,
      expiresAt: this.refreshExpiry(),
    });
    return { ...(await this.accessFor(user)), refreshToken };
  }

  private async accessFor(user: User) {
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

  private signRefresh(userId: string, sid: string) {
    const payload: RefreshPayload = { sub: userId, sid, jti: randomUUID() };
    return this.jwt.signAsync(payload, {
      secret: this.cfg.refreshSecret,
      expiresIn: this.cfg.refreshTtl,
    });
  }

  private refreshExpiry() {
    return new Date(Date.now() + this.cfg.refreshTtl * 1000);
  }

  private unauthorized(code: ErrorCode, message: string) {
    return new BusinessException(code, message, HttpStatus.UNAUTHORIZED);
  }

  private invalidResetToken() {
    return new BusinessException(
      ErrorCode.TOKEN_INVALID,
      'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
      HttpStatus.BAD_REQUEST,
    );
  }
}
