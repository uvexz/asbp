/**
 * Redis Client
 * Only initialized when REDIS_URL is set
 */

import Redis from 'ioredis';

let redis: Redis | null = null;

/**
 * Get Redis client instance
 * Returns null if REDIS_URL is not configured
 */
export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }

  return redis;
}

/**
 * Check if Redis is available
 */
export function isRedisEnabled(): boolean {
  return !!process.env.REDIS_URL;
}

// Cache key prefixes
export const REDIS_KEYS = {
  SETTINGS: 'cache:settings',
  NAVIGATION: 'cache:navigation',
  TAGS: 'cache:tags',
  POST: (slug: string) => `cache:post:${slug}`,
  POSTS_LIST: (page: number, pageSize: number) => `cache:posts:${page}:${pageSize}`,
  SITEMAP_POSTS: 'cache:sitemap:posts',
  SITEMAP_TAGS: 'cache:sitemap:tags',
  FEED_POSTS: (limit: number) => `cache:feed:${limit}`,
} as const;

// Default TTL in seconds
export const REDIS_TTL = {
  SETTINGS: 3600,      // 1 hour
  NAVIGATION: 3600,    // 1 hour
  TAGS: 3600,          // 1 hour
  POST: 3600,          // 1 hour
  POSTS_LIST: 300,     // 5 minutes
  SITEMAP: 3600,       // 1 hour
  FEED: 300,           // 5 minutes
} as const;
