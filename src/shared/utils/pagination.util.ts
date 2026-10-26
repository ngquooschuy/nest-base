import type { PageMetaDto } from '@shared/dto/page-meta.dto';

export function toSkipTake(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}

export function toPageMeta(
  page: number,
  limit: number,
  total: number,
): PageMetaDto {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
