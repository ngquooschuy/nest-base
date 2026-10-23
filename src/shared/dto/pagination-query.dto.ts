import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number) // query string luôn là chuỗi: "2" → 2
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // chặn client gọi ?limit=1000000 làm sập DB
  limit = 10;

  @IsOptional()
  @IsString()
  search?: string;
}
