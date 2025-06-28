import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import crypto from 'crypto';
import { COURSE_CACHE_KEY } from '../constant/constants';

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

  async clearCache(keyPattern: string) {
    const store = this.redisCache.stores[0];
    if (store?.iterator) {
      for await (const [key, _] of store.iterator({})) {
        if (key.startsWith(keyPattern)) {
          this.redisCache.del(key);
        }
      }
      this.logger.log(`Cleared cached data ${keyPattern}*`);
    }
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
