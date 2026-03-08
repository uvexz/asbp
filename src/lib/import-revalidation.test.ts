import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  revalidatePathMock,
  invalidateCommentsCacheMock,
  invalidateNavigationCacheMock,
  invalidatePostCacheMock,
  invalidatePostsListCacheMock,
  invalidateSettingsCacheMock,
  invalidateTagsCacheMock,
  findManyMock,
  inArrayMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  invalidateCommentsCacheMock: vi.fn(),
  invalidateNavigationCacheMock: vi.fn(),
  invalidatePostCacheMock: vi.fn(),
  invalidatePostsListCacheMock: vi.fn(),
  invalidateSettingsCacheMock: vi.fn(),
  invalidateTagsCacheMock: vi.fn(),
  findManyMock: vi.fn(),
  inArrayMock: vi.fn((field, values) => ({ field, values })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock('drizzle-orm', () => ({
  inArray: inArrayMock,
}));

vi.mock('@/db/schema', () => ({
  posts: {
    id: 'posts.id',
  },
}));

vi.mock('@/lib/cache-layer', () => ({
  invalidateCommentsCache: invalidateCommentsCacheMock,
  invalidateNavigationCache: invalidateNavigationCacheMock,
  invalidatePostCache: invalidatePostCacheMock,
  invalidatePostsListCache: invalidatePostsListCacheMock,
  invalidateSettingsCache: invalidateSettingsCacheMock,
  invalidateTagsCache: invalidateTagsCacheMock,
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      posts: {
        findMany: findManyMock,
      },
    },
  },
}));

import { revalidateImportedContent } from './import-revalidation';

describe('revalidateImportedContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue([]);
  });

  it('invalidates imported content caches and revalidates affected routes', async () => {
    await revalidateImportedContent({
      posts: [{ id: 'post-1', slug: 'hello-world' }],
      comments: [{ postId: 'post-1' }],
      tags: [{ slug: 'news' }],
      navItemsImported: true,
      settingsImported: true,
    });

    expect(invalidateSettingsCacheMock).toHaveBeenCalledTimes(1);
    expect(invalidateNavigationCacheMock).toHaveBeenCalledTimes(1);
    expect(invalidatePostsListCacheMock).toHaveBeenCalledTimes(1);
    expect(invalidateTagsCacheMock).toHaveBeenCalledTimes(1);
    expect(invalidatePostCacheMock).toHaveBeenCalledWith('hello-world');
    expect(invalidateCommentsCacheMock).toHaveBeenCalledWith('post-1');
    expect(findManyMock).not.toHaveBeenCalled();

    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/settings');
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/navigation');
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    expect(revalidatePathMock).toHaveBeenCalledWith('/');
    expect(revalidatePathMock).toHaveBeenCalledWith('/memo');
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/posts');
    expect(revalidatePathMock).toHaveBeenCalledWith('/hello-world');
    expect(revalidatePathMock).toHaveBeenCalledWith('/tag/news');
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/comments');
  });

  it('looks up existing post slugs for comment-only imports and revalidates their pages', async () => {
    findManyMock.mockResolvedValue([{ id: 'existing-post', slug: 'existing-slug' }]);

    await revalidateImportedContent({
      comments: [{ postId: 'existing-post' }, { postId: 'existing-post' }],
    });

    expect(invalidateCommentsCacheMock).toHaveBeenCalledTimes(1);
    expect(invalidateCommentsCacheMock).toHaveBeenCalledWith('existing-post');
    expect(inArrayMock).toHaveBeenCalledWith('posts.id', ['existing-post']);
    expect(findManyMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith('/existing-slug');
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/comments');
  });
});
