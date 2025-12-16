/**
 * Cache Layer with Redis support
 * Uses Redis when REDIS_URL is set, falls back to Next.js unstable_cache
 */

import { unstable_cache, revalidateTag } from 'next/cache';
import { db } from './db';
import { settings, navItems, tags, posts } from '@/db/schema';
import { eq, asc, and, desc, count } from 'drizzle-orm';
import { decrypt } from './crypto';
import { getRedis, isRedisEnabled, REDIS_KEYS, REDIS_TTL } from './redis';

// Cache tags for Next.js invalidation (fallback mode)
export const CACHE_TAGS = {
  SETTINGS: 'settings',
  NAVIGATION: 'navigation',
  TAGS: 'tags',
  POST: (slug: string) => `post:${slug}`,
  POSTS_LIST: 'posts-list',
} as const;

// Default cache options
const DEFAULT_REVALIDATE = 3600; // 1 hour

// ============================================
// Redis Cache Helpers
// ============================================

async function getFromRedis<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Redis get error:', err);
    return null;
  }
}

async function setToRedis<T>(key: string, value: T, ttl: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.error('Redis set error:', err);
  }
}

async function deleteFromRedis(pattern: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  
  try {
    if (pattern.includes('*')) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      await redis.del(pattern);
    }
  } catch (err) {
    console.error('Redis delete error:', err);
  }
}

// ============================================
// Settings Cache
// ============================================

async function fetchSettings() {
  const data = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  
  if (data.length === 0) {
    return {
      siteTitle: 'My Awesome Blog',
      siteDescription: 'A blog about tech...',
      allowRegistration: false,
      s3Bucket: '',
      s3Region: '',
      s3AccessKey: '',
      s3SecretKey: '',
      s3Endpoint: '',
      s3CdnUrl: '',
      resendApiKey: '',
      resendFromEmail: '',
      aiBaseUrl: '',
      aiApiKey: '',
      aiModel: '',
      umamiEnabled: false,
      umamiCloud: false,
      umamiHostUrl: '',
      umamiWebsiteId: '',
      umamiApiKey: '',
      umamiApiUserId: '',
      umamiApiSecret: '',
    };
  }
  
  const row = data[0];
  return {
    ...row,
    s3SecretKey: row.s3SecretKey ? decrypt(row.s3SecretKey) : '',
    s3AccessKey: row.s3AccessKey ? decrypt(row.s3AccessKey) : '',
    resendApiKey: row.resendApiKey ? decrypt(row.resendApiKey) : '',
    aiApiKey: row.aiApiKey ? decrypt(row.aiApiKey) : '',
    umamiApiKey: row.umamiApiKey ? decrypt(row.umamiApiKey) : '',
    umamiApiSecret: row.umamiApiSecret ? decrypt(row.umamiApiSecret) : '',
  };
}

const getCachedSettingsFallback = unstable_cache(
  fetchSettings,
  ['settings'],
  { tags: [CACHE_TAGS.SETTINGS], revalidate: DEFAULT_REVALIDATE }
);

export async function getCachedSettings() {
  if (isRedisEnabled()) {
    const cached = await getFromRedis<Awaited<ReturnType<typeof fetchSettings>>>(REDIS_KEYS.SETTINGS);
    if (cached) return cached;
    
    const data = await fetchSettings();
    await setToRedis(REDIS_KEYS.SETTINGS, data, REDIS_TTL.SETTINGS);
    return data;
  }
  return getCachedSettingsFallback();
}

// ============================================
// Navigation Cache
// ============================================

async function fetchNavItems() {
  return db.select().from(navItems).orderBy(asc(navItems.sortOrder));
}

const getCachedNavItemsFallback = unstable_cache(
  fetchNavItems,
  ['nav-items'],
  { tags: [CACHE_TAGS.NAVIGATION], revalidate: DEFAULT_REVALIDATE }
);

export async function getCachedNavItems() {
  if (isRedisEnabled()) {
    const cached = await getFromRedis<Awaited<ReturnType<typeof fetchNavItems>>>(REDIS_KEYS.NAVIGATION);
    if (cached) return cached;
    
    const data = await fetchNavItems();
    await setToRedis(REDIS_KEYS.NAVIGATION, data, REDIS_TTL.NAVIGATION);
    return data;
  }
  return getCachedNavItemsFallback();
}

// ============================================
// Tags Cache
// ============================================

async function fetchTags() {
  return db.query.tags.findMany({
    orderBy: (tags, { asc }) => [asc(tags.name)],
  });
}

const getCachedTagsFallback = unstable_cache(
  fetchTags,
  ['tags'],
  { tags: [CACHE_TAGS.TAGS], revalidate: DEFAULT_REVALIDATE }
);

export async function getCachedTags() {
  if (isRedisEnabled()) {
    const cached = await getFromRedis<Awaited<ReturnType<typeof fetchTags>>>(REDIS_KEYS.TAGS);
    if (cached) return cached;
    
    const data = await fetchTags();
    await setToRedis(REDIS_KEYS.TAGS, data, REDIS_TTL.TAGS);
    return data;
  }
  return getCachedTagsFallback();
}

// ============================================
// Single Post Cache
// ============================================

async function fetchPostBySlug(slug: string) {
  return db.query.posts.findFirst({
    where: eq(posts.slug, slug),
    with: {
      author: true,
      tags: { with: { tag: true } },
    },
  });
}

export async function getCachedPostBySlug(slug: string) {
  if (isRedisEnabled()) {
    const cached = await getFromRedis<Awaited<ReturnType<typeof fetchPostBySlug>>>(REDIS_KEYS.POST(slug));
    if (cached) return cached;
    
    const data = await fetchPostBySlug(slug);
    if (data) {
      await setToRedis(REDIS_KEYS.POST(slug), data, REDIS_TTL.POST);
    }
    return data;
  }
  
  return unstable_cache(
    () => fetchPostBySlug(slug),
    [`post-${slug}`],
    { tags: [CACHE_TAGS.POST(slug)], revalidate: DEFAULT_REVALIDATE }
  )();
}

// ============================================
// Published Posts List Cache
// ============================================

async function fetchPublishedPosts(page: number = 1, pageSize: number = 10) {
  const validPage = Math.max(1, page);
  const validPageSize = Math.max(1, Math.min(100, pageSize));
  const offset = (validPage - 1) * validPageSize;

  const [totalResult] = await db
    .select({ count: count() })
    .from(posts)
    .where(and(eq(posts.published, true), eq(posts.postType, 'post')));
  
  const total = totalResult?.count ?? 0;
  const totalPages = Math.ceil(total / validPageSize);

  const data = await db.query.posts.findMany({
    where: and(eq(posts.published, true), eq(posts.postType, 'post')),
    orderBy: [desc(posts.publishedAt), desc(posts.createdAt)],
    limit: validPageSize,
    offset: offset,
    with: {
      author: true,
      tags: { with: { tag: true } },
    },
  });

  return { posts: data, total, totalPages };
}

const getCachedPublishedPostsFallback = unstable_cache(
  fetchPublishedPosts,
  ['published-posts'],
  { tags: [CACHE_TAGS.POSTS_LIST], revalidate: 300 }
);

export async function getCachedPublishedPosts(page: number = 1, pageSize: number = 10) {
  if (isRedisEnabled()) {
    const cacheKey = REDIS_KEYS.POSTS_LIST(page, pageSize);
    const cached = await getFromRedis<Awaited<ReturnType<typeof fetchPublishedPosts>>>(cacheKey);
    if (cached) return cached;
    
    const data = await fetchPublishedPosts(page, pageSize);
    await setToRedis(cacheKey, data, REDIS_TTL.POSTS_LIST);
    return data;
  }
  return getCachedPublishedPostsFallback(page, pageSize);
}

// ============================================
// Sitemap Cache
// ============================================

async function fetchSitemapPosts() {
  return db
    .select({
      slug: posts.slug,
      updatedAt: posts.updatedAt,
      postType: posts.postType,
    })
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.updatedAt));
}

const getCachedSitemapPostsFallback = unstable_cache(
  fetchSitemapPosts,
  ['sitemap-posts'],
  { tags: [CACHE_TAGS.POSTS_LIST], revalidate: DEFAULT_REVALIDATE }
);

export async function getCachedSitemapPosts() {
  if (isRedisEnabled()) {
    const cached = await getFromRedis<Awaited<ReturnType<typeof fetchSitemapPosts>>>(REDIS_KEYS.SITEMAP_POSTS);
    if (cached) return cached;
    
    const data = await fetchSitemapPosts();
    await setToRedis(REDIS_KEYS.SITEMAP_POSTS, data, REDIS_TTL.SITEMAP);
    return data;
  }
  return getCachedSitemapPostsFallback();
}

async function fetchSitemapTags() {
  return db.select({ slug: tags.slug }).from(tags);
}

const getCachedSitemapTagsFallback = unstable_cache(
  fetchSitemapTags,
  ['sitemap-tags'],
  { tags: [CACHE_TAGS.TAGS], revalidate: DEFAULT_REVALIDATE }
);

export async function getCachedSitemapTags() {
  if (isRedisEnabled()) {
    const cached = await getFromRedis<Awaited<ReturnType<typeof fetchSitemapTags>>>(REDIS_KEYS.SITEMAP_TAGS);
    if (cached) return cached;
    
    const data = await fetchSitemapTags();
    await setToRedis(REDIS_KEYS.SITEMAP_TAGS, data, REDIS_TTL.SITEMAP);
    return data;
  }
  return getCachedSitemapTagsFallback();
}

// ============================================
// Feed Cache
// ============================================

async function fetchFeedPosts(limit: number = 20) {
  return db.query.posts.findMany({
    where: and(eq(posts.published, true), eq(posts.postType, 'post')),
    orderBy: [desc(posts.publishedAt), desc(posts.createdAt)],
    limit,
    with: { author: true },
  });
}

const getCachedFeedPostsFallback = unstable_cache(
  fetchFeedPosts,
  ['feed-posts'],
  { tags: [CACHE_TAGS.POSTS_LIST], revalidate: 300 }
);

export async function getCachedFeedPosts(limit: number = 20) {
  if (isRedisEnabled()) {
    const cacheKey = REDIS_KEYS.FEED_POSTS(limit);
    const cached = await getFromRedis<Awaited<ReturnType<typeof fetchFeedPosts>>>(cacheKey);
    if (cached) return cached;
    
    const data = await fetchFeedPosts(limit);
    await setToRedis(cacheKey, data, REDIS_TTL.FEED);
    return data;
  }
  return getCachedFeedPostsFallback(limit);
}

// ============================================
// Cache Invalidation Helpers
// ============================================

const CACHE_PROFILE = 'default';

export function invalidateSettingsCache() {
  if (isRedisEnabled()) {
    deleteFromRedis(REDIS_KEYS.SETTINGS);
  }
  revalidateTag(CACHE_TAGS.SETTINGS, CACHE_PROFILE);
}

export function invalidateNavigationCache() {
  if (isRedisEnabled()) {
    deleteFromRedis(REDIS_KEYS.NAVIGATION);
  }
  revalidateTag(CACHE_TAGS.NAVIGATION, CACHE_PROFILE);
}

export function invalidateTagsCache() {
  if (isRedisEnabled()) {
    deleteFromRedis(REDIS_KEYS.TAGS);
    deleteFromRedis(REDIS_KEYS.SITEMAP_TAGS);
  }
  revalidateTag(CACHE_TAGS.TAGS, CACHE_PROFILE);
}

export function invalidatePostCache(slug: string) {
  if (isRedisEnabled()) {
    deleteFromRedis(REDIS_KEYS.POST(slug));
  }
  revalidateTag(CACHE_TAGS.POST(slug), CACHE_PROFILE);
}

export function invalidatePostsListCache() {
  if (isRedisEnabled()) {
    deleteFromRedis('cache:posts:*');
    deleteFromRedis(REDIS_KEYS.SITEMAP_POSTS);
    deleteFromRedis('cache:feed:*');
  }
  revalidateTag(CACHE_TAGS.POSTS_LIST, CACHE_PROFILE);
}

export function invalidateAllPostCaches(slug?: string) {
  invalidatePostsListCache();
  if (slug) {
    invalidatePostCache(slug);
  }
}
