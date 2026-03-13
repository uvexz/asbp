import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isPubliclyVisiblePost, invalidatePostsListCache, chunkKeys } from './cache-layer';

const {
  revalidateTagMock,
  isRedisEnabledMock,
  getRedisMock,
} = vi.hoisted(() => ({
  revalidateTagMock: vi.fn(),
  isRedisEnabledMock: vi.fn(),
  getRedisMock: vi.fn(),
}));

vi.mock('next/cache', () => ({
  unstable_cache: (fn: unknown) => fn,
  revalidateTag: revalidateTagMock,
}));

vi.mock('./db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
  },
}));

vi.mock('./crypto', () => ({
  decrypt: vi.fn((value: string) => value),
}));

vi.mock('./redis', () => ({
  getRedis: getRedisMock,
  isRedisEnabled: isRedisEnabledMock,
  REDIS_KEYS: {
    SETTINGS: 'cache:settings',
    NAVIGATION: 'cache:navigation',
    TAGS: 'cache:tags',
    POST: (slug: string) => `cache:post:v2:${slug}`,
    POSTS_LIST: (page: number, pageSize: number) => `cache:posts:${page}:${pageSize}`,
    MEMOS_LIST: (page: number, pageSize: number) => `cache:memos:${page}:${pageSize}`,
    COMMENTS: (postId: string) => `cache:comments:${postId}`,
    TAG_POSTS: (slug: string) => `cache:tag:${slug}:posts`,
    SITEMAP_POSTS: 'cache:sitemap:posts',
    SITEMAP_TAGS: 'cache:sitemap:tags',
    FEED_POSTS: (limit: number) => `cache:feed:${limit}`,
  },
  REDIS_WILDCARD_PATTERNS: {
    POSTS_LIST: 'cache:posts:*',
    MEMOS_LIST: 'cache:memos:*',
    TAG_POSTS: 'cache:tag:*',
    FEED_POSTS: 'cache:feed:*',
  },
  REDIS_TTL: {
    SETTINGS: 3600,
    NAVIGATION: 3600,
    TAGS: 3600,
    POST: 3600,
    POSTS_LIST: 300,
    MEMOS_LIST: 300,
    COMMENTS: 60,
    TAG_POSTS: 300,
    SITEMAP: 3600,
    FEED: 300,
  },
}));

describe('cache-layer helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true for published posts', () => {
    expect(isPubliclyVisiblePost({ published: true, postType: 'post' })).toBe(true);
  });

  it('returns true for published pages', () => {
    expect(isPubliclyVisiblePost({ published: true, postType: 'page' })).toBe(true);
  });

  it('returns false for unpublished records', () => {
    expect(isPubliclyVisiblePost({ published: false, postType: 'post' })).toBe(false);
    expect(isPubliclyVisiblePost({ published: null, postType: 'page' })).toBe(false);
  });

  it('returns false for unsupported public post types', () => {
    expect(isPubliclyVisiblePost({ published: true, postType: 'memo' })).toBe(false);
    expect(isPubliclyVisiblePost({ published: true, postType: null })).toBe(false);
  });

  it('returns false for missing posts', () => {
    expect(isPubliclyVisiblePost(null)).toBe(false);
    expect(isPubliclyVisiblePost(undefined)).toBe(false);
  });

  it('uses SCAN-based wildcard invalidation for current cache groups', async () => {
    const scanMock = vi.fn(async (_cursor: string, _match: string, pattern: string) => {
      if (pattern === 'cache:posts:*') {
        return ['0', ['cache:posts:1:10', 'cache:posts:2:10', 'cache:posts:3:10']];
      }

      return ['0', []];
    });
    const delMock = vi.fn().mockResolvedValue(1);

    isRedisEnabledMock.mockReturnValue(true);
    getRedisMock.mockReturnValue({
      scan: scanMock,
      del: delMock,
    });

    invalidatePostsListCache();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(scanMock).toHaveBeenCalledWith('0', 'MATCH', 'cache:posts:*', 'COUNT', 100);
    expect(scanMock).toHaveBeenCalledWith('0', 'MATCH', 'cache:memos:*', 'COUNT', 100);
    expect(scanMock).toHaveBeenCalledWith('0', 'MATCH', 'cache:tag:*', 'COUNT', 100);
    expect(scanMock).toHaveBeenCalledWith('0', 'MATCH', 'cache:feed:*', 'COUNT', 100);
    expect(delMock).toHaveBeenCalledWith('cache:posts:1:10', 'cache:posts:2:10', 'cache:posts:3:10');
    expect(delMock).toHaveBeenCalledWith('cache:sitemap:posts');
    expect(revalidateTagMock).toHaveBeenCalledWith('posts-list', 'default');
  });

  describe('chunkKeys', () => {
    it('returns empty array when input is empty', () => {
      expect(chunkKeys([], 2)).toEqual([]);
    });

    it('returns the same array as a single chunk if chunkSize is larger than array length', () => {
      const keys = ['a', 'b', 'c'];
      expect(chunkKeys(keys, 5)).toEqual([['a', 'b', 'c']]);
    });

    it('returns the same array as a single chunk if chunkSize equals array length', () => {
      const keys = ['a', 'b', 'c'];
      expect(chunkKeys(keys, 3)).toEqual([['a', 'b', 'c']]);
    });

    it('chunks array correctly when chunkSize is 1', () => {
      const keys = ['a', 'b', 'c'];
      expect(chunkKeys(keys, 1)).toEqual([['a'], ['b'], ['c']]);
    });

    it('chunks array correctly when it is divisible by chunkSize', () => {
      const keys = ['a', 'b', 'c', 'd'];
      expect(chunkKeys(keys, 2)).toEqual([['a', 'b'], ['c', 'd']]);
    });

    it('chunks array correctly when it is NOT divisible by chunkSize', () => {
      const keys = ['a', 'b', 'c', 'd', 'e'];
      expect(chunkKeys(keys, 2)).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
    });

    it('returns the whole array as a single chunk if chunkSize is 0 or negative', () => {
      const keys = ['a', 'b', 'c'];
      expect(chunkKeys(keys, 0)).toEqual([['a', 'b', 'c']]);
      expect(chunkKeys(keys, -1)).toEqual([['a', 'b', 'c']]);
    });
  });
});
