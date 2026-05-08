import { redis } from "./redis";

// Fallback in-memory cache in case Redis is unavailable
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

export const CacheService = {
  /**
   * Gets a value from the cache.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (redis.status === "ready") {
        const cached = await redis.get(key);
        if (cached) {
          return JSON.parse(cached) as T;
        }
        return null;
      }
    } catch (err) {
      console.warn(`[CacheService] Redis get error for key "${key}", falling back to memory:`, err);
    }

    // Fallback to memory
    const memEntry = memoryCache.get(key);
    if (memEntry) {
      if (Date.now() < memEntry.expiresAt) {
        return memEntry.value as T;
      } else {
        memoryCache.delete(key);
      }
    }

    return null;
  },

  /**
   * Saves a value to the cache with an expiration time (in seconds).
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      if (redis.status === "ready") {
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
        return; // Successfully saved in Redis
      }
    } catch (err) {
      console.warn(`[CacheService] Redis set error for key "${key}", falling back to memory:`, err);
    }

    // Fallback to memory
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  /**
   * Gets a value from the cache. If it doesn't exist, executes the fetcher, saves the result, and returns it.
   */
  async getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const freshData = await fetcher();
    
    // Avoid saving null/undefined unless explicitly allowed.
    // We assume that if the fetcher fails, it handles errors internally.
    if (freshData !== null && freshData !== undefined) {
      await this.set(key, freshData, ttlSeconds);
    }
    
    return freshData;
  }
};
