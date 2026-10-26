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
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiOkWrapped,
  ApiPaginatedResponse,
} from '@shared/decorators/api-response.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { UsersService } from './users.service';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Danh sách user: phân trang, tìm kiếm, sắp xếp */
  @Get()
  @ApiPaginatedResponse(UserResponseDto)
  findAll(@Query() query: UsersQueryDto) {
    return this.usersService.findAll(query);
  }

  /** Chi tiết một user */
  @Get(':id')
  @ApiOkWrapped(UserResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  /** Tạo user */
  @Post()
  @ApiOkWrapped(UserResponseDto)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /** Cập nhật một phần */
  @Patch(':id')
  @ApiOkWrapped(UserResponseDto)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  /** Xóa mềm */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
