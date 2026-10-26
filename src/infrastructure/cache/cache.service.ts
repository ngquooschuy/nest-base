import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  /** Có trong cache thì trả về luôn; không có thì chạy fn(), lưu lại, rồi trả về */
  async getOrSet<T>(
    key: string,
    ttlMs: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    try {
      const hit = await this.cache.get<T>(key);
      if (hit !== undefined && hit !== null) return hit;
    } catch (e) {
      this.logger.warn(`Cache GET failed for ${key}: ${String(e)}`); // Redis chết → vẫn phục vụ từ DB
    }

    const value = await fn();
    this.cache
      .set(key, value, ttlMs)
      .catch((e) => this.logger.warn(`Cache SET failed: ${String(e)}`));
    return value;
  }

  async del(...keys: string[]): Promise<void> {
    await Promise.all(keys.map((k) => this.cache.del(k))).catch(
      () => undefined,
    );
  }

  /** Version cho một nhóm key: tăng version = vô hiệu hóa cả nhóm cùng lúc */
  async version(group: string): Promise<number> {
    return (await this.cache.get<number>(`v:${group}`)) ?? 1;
  }

  async bump(group: string): Promise<void> {
    const v = await this.version(group);
    await this.cache.set(`v:${group}`, v + 1, 0).catch(() => undefined); // ttl 0 = không hết hạn
  }
}
