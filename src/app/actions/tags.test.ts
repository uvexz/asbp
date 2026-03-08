import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const headersMock = vi.fn();
const revalidatePathMock = vi.fn();
const invalidatePostCacheMock = vi.fn();
const invalidatePostsListCacheMock = vi.fn();
const invalidateTagsCacheMock = vi.fn();

const postsTagsFindManyMock = vi.fn();
const postsFindFirstMock = vi.fn();
const tagsFindManyMock = vi.fn();
const deleteWhereMock = vi.fn();
const dbDeleteMock = vi.fn(() => ({ where: deleteWhereMock }));
const insertValuesMock = vi.fn();
const dbInsertMock = vi.fn(() => ({ values: insertValuesMock }));

vi.mock('next/headers', () => ({
  headers: headersMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock('@/lib/cache-layer', () => ({
  getCachedTags: vi.fn(),
  getCachedPostsByTag: vi.fn(),
  invalidatePostCache: invalidatePostCacheMock,
  invalidatePostsListCache: invalidatePostsListCacheMock,
  invalidateTagsCache: invalidateTagsCacheMock,
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      postsTags: {
        findMany: postsTagsFindManyMock,
      },
      posts: {
        findFirst: postsFindFirstMock,
      },
      tags: {
        findMany: tagsFindManyMock,
      },
    },
    delete: dbDeleteMock,
    insert: dbInsertMock,
  },
}));

vi.mock('@/db/schema', () => ({
  tags: { id: 'tags.id' },
  posts: { id: 'posts.id' },
  postsTags: { postId: 'postsTags.postId' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ field, value })),
  inArray: vi.fn((field, values) => ({ field, values })),
}));

vi.mock('@/lib/validations', () => ({ tagSchema: { safeParse: vi.fn() } }));
vi.mock('@/lib/server-utils', () => ({ generateSlug: vi.fn() }));

describe('updatePostTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue(new Headers());
    getSessionMock.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    postsTagsFindManyMock.mockResolvedValue([
      { tagId: 'old-tag', tag: { slug: 'old-slug' } },
    ]);
    postsFindFirstMock.mockResolvedValue({ slug: 'post-slug' });
    tagsFindManyMock.mockResolvedValue([{ slug: 'new-slug' }]);
    deleteWhereMock.mockResolvedValue(undefined);
    insertValuesMock.mockResolvedValue(undefined);
  });

  it('invalidates public post and tag caches when tags are updated', async () => {
    const { updatePostTags } = await import('./tags');

    await expect(updatePostTags('post-1', ['new-tag'])).resolves.toEqual({ success: true });

    expect(invalidatePostsListCacheMock).toHaveBeenCalledTimes(1);
    expect(invalidateTagsCacheMock).toHaveBeenCalledTimes(1);
    expect(invalidatePostCacheMock).toHaveBeenCalledWith('post-slug');
    expect(revalidatePathMock).toHaveBeenCalledWith('/post-slug');
    expect(revalidatePathMock).toHaveBeenCalledWith('/tag/old-slug');
    expect(revalidatePathMock).toHaveBeenCalledWith('/tag/new-slug');
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/posts');
  });
});
