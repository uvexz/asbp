import { beforeEach, describe, expect, it, vi } from 'vitest';

const countWhereMock = vi.fn();
const countFromMock = vi.fn(() => ({ where: countWhereMock }));
const selectMock = vi.fn(() => ({ from: countFromMock }));
const findManyMock = vi.fn();

const descMock = vi.fn((value) => ({ type: 'desc', value }));
const eqMock = vi.fn((field, value) => ({ type: 'eq', field, value }));
const ilikeMock = vi.fn((field, value) => ({ type: 'ilike', field, value }));
const orMock = vi.fn((...conditions) => ({ type: 'or', conditions }));
const andMock = vi.fn((...conditions) => ({ type: 'and', conditions }));
const countMock = vi.fn(() => ({ type: 'count' }));

vi.mock('drizzle-orm', () => ({
  desc: descMock,
  eq: eqMock,
  count: countMock,
  and: andMock,
  ilike: ilikeMock,
  or: orMock,
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: selectMock,
    query: {
      posts: {
        findMany: findManyMock,
      },
    },
  },
}));

vi.mock('@/db/schema', () => ({
  posts: {
    title: 'posts.title',
    content: 'posts.content',
    postType: 'posts.postType',
    createdAt: 'posts.createdAt',
  },
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('@/lib/validations', () => ({ postSchema: { safeParse: vi.fn() } }));
vi.mock('@/lib/cache-layer', () => ({
  getCachedPostBySlug: vi.fn(),
  getCachedPublishedPosts: vi.fn(),
  getCachedPublishedMemos: vi.fn(),
  invalidatePostCache: vi.fn(),
  invalidatePostsListCache: vi.fn(),
  isPubliclyVisiblePost: vi.fn(),
}));

describe('getPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    countWhereMock.mockResolvedValue([{ count: 2 }]);
    findManyMock.mockResolvedValue([{ id: 'post-1' }, { id: 'post-2' }]);
  });

  it('applies postType filtering before pagination', async () => {
    const { getPosts } = await import('./posts');

    const result = await getPosts(2, 10, undefined, 'page');

    expect(eqMock).toHaveBeenCalledWith('posts.postType', 'page');
    expect(countWhereMock).toHaveBeenCalledWith({ type: 'eq', field: 'posts.postType', value: 'page' });
    expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({
      where: { type: 'eq', field: 'posts.postType', value: 'page' },
      limit: 10,
      offset: 10,
    }));
    expect(result.total).toBe(2);
    expect(result.currentPage).toBe(2);
  });

  it('combines search and postType filters in the underlying query', async () => {
    const { getPosts } = await import('./posts');

    await getPosts(1, 10, 'hello', 'post');

    expect(ilikeMock).toHaveBeenNthCalledWith(1, 'posts.title', '%hello%');
    expect(ilikeMock).toHaveBeenNthCalledWith(2, 'posts.content', '%hello%');
    expect(orMock).toHaveBeenCalledWith(
      { type: 'ilike', field: 'posts.title', value: '%hello%' },
      { type: 'ilike', field: 'posts.content', value: '%hello%' },
    );
    expect(andMock).toHaveBeenCalledWith(
      { type: 'or', conditions: [
        { type: 'ilike', field: 'posts.title', value: '%hello%' },
        { type: 'ilike', field: 'posts.content', value: '%hello%' },
      ] },
      { type: 'eq', field: 'posts.postType', value: 'post' },
    );
    expect(countWhereMock).toHaveBeenCalledWith({
      type: 'and',
      conditions: [
        { type: 'or', conditions: [
          { type: 'ilike', field: 'posts.title', value: '%hello%' },
          { type: 'ilike', field: 'posts.content', value: '%hello%' },
        ] },
        { type: 'eq', field: 'posts.postType', value: 'post' },
      ],
    });
  });
});
