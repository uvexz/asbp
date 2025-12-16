/**
 * Cache Layer using Next.js unstable_cache
 * Provides caching for frequently accessed data with tag-based invalidation
 */

import { unstable_cache, revalidateTag } from 'next/cache';
import { db } from './db';
import { settings, navItems, tags, posts } from '@/db/schema';
import { eq, asc, and, desc } from 'drizzle-orm';
import { decrypt } from './crypto';

// Cache tags for invalidation
export const CACHE_TAGS = {
  SETTINGS: 'settings',
  NAVIGATION: 'navigation',
  TAGS: 'tags',
  POST: (slug: string) => `post:${slug}`,
  POSTS_LIST: 'posts-list',
} as const;

// Default cache options
const DEFAULT_REVALIDATE = 3600; // 1 hour

/**
 * Get site settings with caching
 * Sensitive fields are decrypted on read
 */
export const getCachedSettings = unstable_cache(
  async () => {
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
      };
    }
    
    const row = data[0];
    
    // Decrypt sensitive fields
    return {
      ...row,
      s3SecretKey: row.s3SecretKey ? decrypt(row.s3SecretKey) : '',
      s3AccessKey: row.s3AccessKey ? decrypt(row.s3AccessKey) : '',
      resendApiKey: row.resendApiKey ? decrypt(row.resendApiKey) : '',
    };
  },
  ['settings'],
  {
    tags: [CACHE_TAGS.SETTINGS],
    revalidate: DEFAULT_REVALIDATE,
  }
);

/**
 * Get navigation items with caching
 */
export const getCachedNavItems = unstable_cache(
  async () => {
    const items = await db.select().from(navItems).orderBy(asc(navItems.sortOrder));
    return items;
  },
  ['nav-items'],
  {
    tags: [CACHE_TAGS.NAVIGATION],
    revalidate: DEFAULT_REVALIDATE,
  }
);

/**
 * Get all tags with caching
 */
export const getCachedTags = unstable_cache(
  async () => {
    const data = await db.query.tags.findMany({
      orderBy: (tags, { asc }) => [asc(tags.name)],
    });
    return data;
  },
  ['tags'],
  {
    tags: [CACHE_TAGS.TAGS],
    revalidate: DEFAULT_REVALIDATE,
  }
);

/**
 * Get a single post by slug with caching
 */
export const getCachedPostBySlug = (slug: string) =>
  unstable_cache(
    async () => {
      const post = await db.query.posts.findFirst({
        where: eq(posts.slug, slug),
        with: {
          author: true,
          tags: {
            with: {
              tag: true,
            },
          },
        },
      });
      return post;
    },
    [`post-${slug}`],
    {
      tags: [CACHE_TAGS.POST(slug)],
      revalidate: DEFAULT_REVALIDATE,
    }
  )();

/**
 * Get published posts for public listing with caching
 */
export const getCachedPublishedPosts = unstable_cache(
  async (page: number = 1, pageSize: number = 10) => {
    const { count } = await import('drizzle-orm');
    
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
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    return { posts: data, total, totalPages };
  },
  ['published-posts'],
  {
    tags: [CACHE_TAGS.POSTS_LIST],
    revalidate: 300, // 5 minutes for listing
  }
);

// ============================================
// Cache Invalidation Helpers
// Next.js 16 revalidateTag requires a profile parameter
// Using 'default' profile for standard cache invalidation
// ============================================

const CACHE_PROFILE = 'default';

/**
 * Invalidate settings cache
 */
export function invalidateSettingsCache() {
  revalidateTag(CACHE_TAGS.SETTINGS, CACHE_PROFILE);
}

/**
 * Invalidate navigation cache
 */
export function invalidateNavigationCache() {
  revalidateTag(CACHE_TAGS.NAVIGATION, CACHE_PROFILE);
}

/**
 * Invalidate tags cache
 */
export function invalidateTagsCache() {
  revalidateTag(CACHE_TAGS.TAGS, CACHE_PROFILE);
}

/**
 * Invalidate a specific post cache
 */
export function invalidatePostCache(slug: string) {
  revalidateTag(CACHE_TAGS.POST(slug), CACHE_PROFILE);
}

/**
 * Invalidate posts list cache
 */
export function invalidatePostsListCache() {
  revalidateTag(CACHE_TAGS.POSTS_LIST, CACHE_PROFILE);
}

/**
 * Invalidate all post-related caches
 */
export function invalidateAllPostCaches(slug?: string) {
  invalidatePostsListCache();
  if (slug) {
    invalidatePostCache(slug);
  }
}

// ============================================
// SEO / Sitemap Cache Functions
// ============================================

/**
 * Get all published posts for sitemap with caching
 * Returns minimal data needed for sitemap generation
 */
export const getCachedSitemapPosts = unstable_cache(
  async () => {
    const data = await db
      .select({
        slug: posts.slug,
        updatedAt: posts.updatedAt,
        postType: posts.postType,
      })
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.updatedAt));
    return data;
  },
  ['sitemap-posts'],
  {
    tags: [CACHE_TAGS.POSTS_LIST],
    revalidate: DEFAULT_REVALIDATE,
  }
);

/**
 * Get all tag slugs for sitemap with caching
 */
export const getCachedSitemapTags = unstable_cache(
  async () => {
    const data = await db.select({ slug: tags.slug }).from(tags);
    return data;
  },
  ['sitemap-tags'],
  {
    tags: [CACHE_TAGS.TAGS],
    revalidate: DEFAULT_REVALIDATE,
  }
);

/**
 * Get published posts for RSS feed with caching
 * Returns data needed for feed generation (limited to recent posts)
 */
export const getCachedFeedPosts = unstable_cache(
  async (limit: number = 20) => {
    const data = await db.query.posts.findMany({
      where: and(eq(posts.published, true), eq(posts.postType, 'post')),
      orderBy: [desc(posts.publishedAt), desc(posts.createdAt)],
      limit,
      with: {
        author: true,
      },
    });
    return data;
  },
  ['feed-posts'],
  {
    tags: [CACHE_TAGS.POSTS_LIST],
    revalidate: 300, // 5 minutes
  }
);
