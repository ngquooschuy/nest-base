import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiOkWrapped } from '@shared/decorators/api-response.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { Public } from '@shared/decorators/public.decorator';
import { UserResponseDto } from '@modules/users/dto/user-response.dto';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Đăng ký tài khoản */
  @Public()
  @Post('register')
  @ApiOkWrapped(AuthResponseDto)
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  /** Đăng nhập */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK) // POST mặc định trả 201; login không "tạo" tài nguyên nên trả 200
  @ApiOkWrapped(AuthResponseDto)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  /** Thông tin người dùng hiện tại */
  @ApiBearerAuth()
  @Get('me')
  @ApiOkWrapped(UserResponseDto)
  me(@CurrentUser('sub') userId: string) {
    return this.auth.me(userId);
  }
}
