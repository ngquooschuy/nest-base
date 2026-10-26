import { randomUUID } from 'node:crypto';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiOkWrapped,
  ApiPaginatedResponse,
} from '@shared/decorators/api-response.decorator';
import type { Paginated } from '@shared/dto/api-response';
import { UserResponseDto } from './dto/user-response.dto';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  /** Lấy danh sách user có phân trang */
  @Get()
  @ApiPaginatedResponse(UserResponseDto)
  findAll(@Query() query: PaginationQueryDto): Paginated<UserResponseDto> {
    const items: UserResponseDto[] = [
      {
        id: randomUUID(),
        email: 'huy@example.com',
        fullName: 'Huy',
        createdAt: new Date(),
      },
    ];
    return {
      items,
      meta: { page: query.page, limit: query.limit, total: 1, totalPages: 1 },
    };
  }

  /** Tạo user mới */
  @Post()
  @ApiOkWrapped(UserResponseDto)
  create(@Body() dto: CreateUserDto) {
    return { received: dto, isInstance: dto instanceof CreateUserDto };
  }
}
