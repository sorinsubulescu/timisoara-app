import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * In-memory TTL cache (short-lived read buffer — DB is the durable store).
 * Swap with Redis (ioredis) when Redis is available.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    this.logger.debug(`Cache HIT: ${key}`);
    return entry.data;
  }

  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
    this.logger.debug(`Cache SET: ${key} (TTL ${ttlSeconds}s)`);
  }

  async getOrFetch<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    this.logger.log(`Cache MISS: ${key} — fetching from source`);
    const data = await fetcher();
    const isEmpty = Array.isArray(data) && data.length === 0;
    if (!isEmpty) {
      await this.set(key, data, ttlSeconds);
    } else {
      this.logger.warn(`Cache SKIP: ${key} — empty result, will retry next request`);
    }
    return data;
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.store.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (key.startsWith(pattern)) this.store.delete(key);
    }
  }
}
