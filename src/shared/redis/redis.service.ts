import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import crypto from 'crypto';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(CACHE_MANAGER) private redisCache: Cache) {}

  async getCachedData<T>(key: string): Promise<T | null> {
    const cachedData = await this.redisCache.get<T>(key);

    if (!cachedData) this.logger.log('Cache missed!');
    else this.logger.log('Cache hit!');

    return cachedData;
  }

  async invalidate(key?: string) {
    if (key) this.redisCache.del(key);
    else this.redisCache.clear();
  }

  async cacheData<T>({
    key,
    data,
    ttl,
  }: {
    key: string;
    data: T;
    ttl: number;
  }): Promise<T> {
    return this.redisCache.set(key, data, ttl * 1000);
  }

  hashKey(prefix: string, data: Object) {
    let key = JSON.stringify(data);
    key = crypto.createHash('sha256').update(key).digest('hex');
    return `${prefix}:${key}`;
  }
}
