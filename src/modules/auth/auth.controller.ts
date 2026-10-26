import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { appConfig } from '@config/app.config';
import { jwtConfig } from '@config/jwt.config';
import { UserResponseDto } from '@modules/users/dto/user-response.dto';
import { ApiOkWrapped } from '@shared/decorators/api-response.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { Public } from '@shared/decorators/public.decorator';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { AuthResult } from './types/auth-result';
import type { ClientMeta } from './types/jwt-payload';
import { Auth } from '@shared/decorators/auth.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const REFRESH_COOKIE = 'refresh_token';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
    @Inject(jwtConfig.KEY)
    private readonly jwtCfg: ConfigType<typeof jwtConfig>,
  ) {}

  @Public()
  @Post('register')
  @ApiOkWrapped(AuthResponseDto)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(res, await this.auth.register(dto, this.meta(req)));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkWrapped(AuthResponseDto)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(res, await this.auth.login(dto, this.meta(req)));
  }

  /** Đổi refresh token (trong cookie) lấy cặp token mới */
  @Public() // access token đã hết hạn thì mới cần gọi route này, nên không thể bắt access token
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkWrapped(AuthResponseDto)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      return this.respond(
        res,
        await this.auth.refresh(req.cookies?.[REFRESH_COOKIE]),
      );
    } catch (e) {
      this.clearCookie(res); // refresh thất bại thì dọn cookie hỏng
      throw e;
    }
  }

  /** Đăng xuất thiết bị hiện tại */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    this.clearCookie(res);
  }

  /** Đăng xuất mọi thiết bị */
  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(
    @CurrentUser('sub') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logoutAll(userId);
    this.clearCookie(res);
  }

  /** Thông tin người dùng hiện tại */
  @ApiBearerAuth()
  @Get('me')
  @ApiOkWrapped(UserResponseDto)
  me(@CurrentUser('sub') userId: string) {
    return this.auth.me(userId);
  }

  @Auth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOkWrapped(AuthResponseDto)
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(
      res,
      await this.auth.changePassword(userId, dto, this.meta(req)),
    );
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto);
  }

  // ===== helpers =====
  private respond(res: Response, { refreshToken, ...body }: AuthResult) {
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true, // JavaScript KHÔNG đọc được → XSS không lấy cắp được
      secure: this.app.env === 'production', // chỉ gửi qua HTTPS (localhost dev thì tắt)
      sameSite: 'strict', // trang web khác không thể kích hoạt gửi cookie → chống CSRF
      path: '/api/v1/auth', // cookie CHỈ được gửi tới các route auth
      maxAge: this.jwtCfg.refreshTtl * 1000,
    });
    return body; // body chỉ còn accessToken, expiresIn, user
  }

  private clearCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  }

  private meta(req: Request): ClientMeta {
    return { userAgent: req.headers['user-agent'], ip: req.ip };
  }
}
