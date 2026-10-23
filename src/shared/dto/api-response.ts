export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PageMeta;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string; details?: unknown };
  path: string;
  requestId: string;
  timestamp: string;
}
