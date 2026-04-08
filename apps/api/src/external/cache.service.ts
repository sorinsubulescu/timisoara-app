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
  private readonly inFlight = new Map<string, Promise<unknown>>();

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

    const activeFetch = this.inFlight.get(key) as Promise<T> | undefined;
    if (activeFetch) {
      this.logger.debug(`Cache WAIT: ${key} — joining in-flight fetch`);
      return activeFetch;
    }

    this.logger.log(`Cache MISS: ${key} — fetching from source`);
    const pendingFetch = (async () => {
      const data = await fetcher();
      const isEmpty = Array.isArray(data) && data.length === 0;
      if (!isEmpty) {
        await this.set(key, data, ttlSeconds);
      } else {
        this.logger.warn(`Cache SKIP: ${key} — empty result, will retry next request`);
      }
      return data;
    })();

    this.inFlight.set(key, pendingFetch);

    try {
      return await pendingFetch;
    } finally {
      if (this.inFlight.get(key) === pendingFetch) {
        this.inFlight.delete(key);
      }
    }
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.store.clear();
      this.inFlight.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (key.startsWith(pattern)) this.store.delete(key);
    }
    for (const key of this.inFlight.keys()) {
      if (key.startsWith(pattern)) this.inFlight.delete(key);
    }
  }
}
