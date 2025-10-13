import { DIDDocument } from '../types';
import { CacheEntry, DIDDocumentMetadata } from './types';

/**
 * Abstract cache interface for DID resolution
 */
export interface ResolverCache {
  get(did: string): Promise<CacheEntry | null>;
  set(did: string, entry: CacheEntry): Promise<void>;
  delete(did: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * In-memory cache implementation
 * Suitable for single-instance deployments or development
 */
export class InMemoryCache implements ResolverCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(cleanupIntervalMs: number = 60000) {
    // Periodic cleanup of expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, cleanupIntervalMs);
  }

  async get(did: string): Promise<CacheEntry | null> {
    const entry = this.cache.get(did);
    if (!entry) return null;

    // Check if expired
    const now = Date.now();
    const expiryTime = entry.timestamp + (entry.ttl * 1000);

    if (now > expiryTime) {
      this.cache.delete(did);
      return null;
    }

    return entry;
  }

  async set(did: string, entry: CacheEntry): Promise<void> {
    this.cache.set(did, entry);
  }

  async delete(did: string): Promise<void> {
    this.cache.delete(did);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [did, entry] of this.cache.entries()) {
      const expiryTime = entry.timestamp + (entry.ttl * 1000);
      if (now > expiryTime) {
        this.cache.delete(did);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

/**
 * Redis cache implementation
 * Suitable for multi-instance deployments and production
 */
export class RedisCache implements ResolverCache {
  private redis: any; // Type from ioredis
  private keyPrefix: string;

  constructor(redis: any, keyPrefix: string = 'did:resolve:') {
    this.redis = redis;
    this.keyPrefix = keyPrefix;
  }

  async get(did: string): Promise<CacheEntry | null> {
    const key = this.keyPrefix + did;
    const data = await this.redis.get(key);

    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse cached DID document:', error);
      await this.delete(did);
      return null;
    }
  }

  async set(did: string, entry: CacheEntry): Promise<void> {
    const key = this.keyPrefix + did;
    const data = JSON.stringify(entry);

    // Set with TTL
    await this.redis.setex(key, entry.ttl, data);
  }

  async delete(did: string): Promise<void> {
    const key = this.keyPrefix + did;
    await this.redis.del(key);
  }

  async clear(): Promise<void> {
    const pattern = this.keyPrefix + '*';
    const keys = await this.redis.keys(pattern);

    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

/**
 * Factory for creating cache instances
 */
export class CacheFactory {
  static createInMemory(cleanupIntervalMs?: number): ResolverCache {
    return new InMemoryCache(cleanupIntervalMs);
  }

  static createRedis(redis: any, keyPrefix?: string): ResolverCache {
    return new RedisCache(redis, keyPrefix);
  }
}
