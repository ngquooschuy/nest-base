import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@generated/prisma/client';
import type { JwtPayload } from '@modules/auth/types/jwt-payload';
import {
  ApiOkWrapped,
  ApiPaginatedResponse,
} from '@shared/decorators/api-response.decorator';
import { Auth } from '@shared/decorators/auth.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { ChangeRoleDto } from './dto/change-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Auth(Role.ADMIN) // chỉ admin được xem danh sách
  @ApiPaginatedResponse(UserResponseDto)
  findAll(@Query() query: UsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Auth() // ai đăng nhập cũng gọi được, service kiểm tra ownership
  @ApiOkWrapped(UserResponseDto)
  findOne(
    @CurrentUser() actor: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.findOne(actor, id);
  }

  @Post()
  @Auth(Role.ADMIN) // người dùng tự đăng ký qua /auth/register
  @ApiOkWrapped(UserResponseDto)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Auth()
  @ApiOkWrapped(UserResponseDto)
  update(
    @CurrentUser() actor: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(actor, id, dto);
  }

  @Patch(':id/role')
  @Auth(Role.ADMIN)
  @ApiOkWrapped(UserResponseDto)
  changeRole(
    @CurrentUser() actor: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.usersService.changeRole(actor, id, dto.role);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() actor: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.remove(actor, id);
  }
}
