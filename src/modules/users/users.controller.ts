import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  @Post()
  create(@Body() dto: CreateUserDto) {
    return { received: dto, isInstance: dto instanceof CreateUserDto };
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    this.logger.log(`Finding users page=${query.page} limit=${query.limit}`);
    return { query, pageType: typeof query.page };
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return { id, dto };
  }
}
