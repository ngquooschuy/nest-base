import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';

export const USER_SORT_FIELDS = ['createdAt', 'email', 'fullName'] as const;

export class UsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(USER_SORT_FIELDS)
  sortBy: (typeof USER_SORT_FIELDS)[number] = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';
}
