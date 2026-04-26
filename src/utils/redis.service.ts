import { redis } from '../config/redis.config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  /**
   * Set a key-value pair with optional expiration
   * @param key - The cache key
   * @param value - The value to store
   * @param ttl - Time to live in seconds (optional)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serializedValue);
    } else {
      await redis.set(key, serializedValue);
    }
  }

  /**
   * Get a value by key
   * @param key - The cache key
   * @returns The cached value or null if not found
   */
  async get<T = any>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  /**
   * Delete a key from cache
   * @param key - The cache key
   */
  async delete(key: string): Promise<void> {
    await redis.del(key);
  }

  /**
   * Check if a key exists
   * @param key - The cache key
   * @returns true if key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  }

  /**
   * Get all keys matching a pattern
   * @param pattern - The key pattern (e.g., 'user:*')
   * @returns Array of matching keys
   */
  async keys(pattern: string): Promise<string[]> {
    return redis.keys(pattern);
  }

  /**
   * Delete all keys matching a pattern
   * @param pattern - The key pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    return redis.del(...keys);
  }

  /**
   * Clear all data from Redis
   */
  async flush(): Promise<void> {
    await redis.flushall();
  }

  /**
   * Increment a numeric value
   * @param key - The cache key
   * @param increment - Amount to increment by (default: 1)
   * @returns The new value
   */
  async increment(key: string, increment: number = 1): Promise<number> {
    return redis.incrby(key, increment);
  }

  /**
   * Decrement a numeric value
   * @param key - The cache key
   * @param decrement - Amount to decrement by (default: 1)
   * @returns The new value
   */
  async decrement(key: string, decrement: number = 1): Promise<number> {
    return redis.decrby(key, decrement);
  }

  /**
   * Append a value to a list
   * @param key - The list key
   * @param value - The value to append
   */
  async pushToList(key: string, value: any): Promise<void> {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    await redis.rpush(key, serializedValue);
  }

  /**
   * Get all values from a list
   * @param key - The list key
   * @returns Array of list values
   */
  async getList<T = any>(key: string): Promise<T[]> {
    const values = await redis.lrange(key, 0, -1);
    return values.map((v) => {
      try {
        return JSON.parse(v) as T;
      } catch {
        return v as unknown as T;
      }
    });
  }

  /**
   * Add a value to a set
   * @param key - The set key
   * @param value - The value to add
   */
  async addToSet(key: string, value: any): Promise<void> {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    await redis.sadd(key, serializedValue);
  }

  /**
   * Get all values from a set
   * @param key - The set key
   * @returns Array of set values
   */
  async getSet<T = any>(key: string): Promise<T[]> {
    const values = await redis.smembers(key);
    return values.map((v) => {
      try {
        return JSON.parse(v) as T;
      } catch {
        return v as unknown as T;
      }
    });
  }

  /**
   * Check if value exists in a set
   * @param key - The set key
   * @param value - The value to check
   */
  async setContains(key: string, value: any): Promise<boolean> {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    const result = await redis.sismember(key, serializedValue);
    return result === 1;
  }

  /**
   * Get the current connection status
   */
  isConnected(): boolean {
    return redis.status === 'ready';
  }
}