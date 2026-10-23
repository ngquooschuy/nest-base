import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import type { ApiSuccess, Paginated } from '@shared/dto/api-response';

function isPaginated(value: unknown): value is Paginated<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'items' in value &&
    'meta' in value
  );
}

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccess<unknown>
> {
  intercept(
    _ctx: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccess<unknown>> {
    return next.handle().pipe(
      map((result) => {
        const timestamp = new Date().toISOString();
        if (isPaginated(result)) {
          return {
            success: true,
            data: result.items,
            meta: result.meta,
            timestamp,
          };
        }
        return { success: true, data: result, timestamp };
      }),
    );
  }
}
