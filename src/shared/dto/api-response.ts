import { PageMetaDto } from './page-meta.dto';

export interface Paginated<T> {
  items: T[];
  meta: PageMetaDto;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PageMetaDto;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string; details?: unknown };
  path: string;
  requestId: string;
  timestamp: string;
}
