import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  nextResponseJsonMock,
  getSessionMock,
  headersMock,
  revalidateImportedContentMock,
  settingsFindFirstMock,
  dbInsertMock,
  resetMockState,
  setReturningQueue,
  getInsertCalls,
  getUpsertCalls,
} = vi.hoisted(() => {
  const returningQueues: Record<string, unknown[][]> = {};
  const insertCalls: Array<{ token: string; values: unknown }> = [];
  const upsertCalls: Array<{ token: string; values: unknown; args: unknown }> = [];

  const getTableToken = (table: { id?: string; postId?: string }) => table.id ?? table.postId ?? 'unknown';

  const dbInsertMock = vi.fn((table: { id?: string; postId?: string }) => {
    const token = getTableToken(table);

    return {
      values: (values: unknown) => {
        insertCalls.push({ token, values });

        return {
          onConflictDoNothing: () => ({
            returning: async () => returningQueues[token]?.shift() ?? [],
          }),
          onConflictDoUpdate: async (args: unknown) => {
            upsertCalls.push({ token, values, args });
            return undefined;
          },
        };
      },
    };
  });

  return {
    nextResponseJsonMock: vi.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    })),
    getSessionMock: vi.fn(),
    headersMock: vi.fn(),
    revalidateImportedContentMock: vi.fn(),
    settingsFindFirstMock: vi.fn(),
    dbInsertMock,
    resetMockState: () => {
      for (const key of Object.keys(returningQueues)) {
        delete returningQueues[key];
      }
      insertCalls.length = 0;
      upsertCalls.length = 0;
    },
    setReturningQueue: (token: string, values: unknown[][]) => {
      returningQueues[token] = [...values];
    },
    getInsertCalls: () => insertCalls,
    getUpsertCalls: () => upsertCalls,
  };
});

vi.mock('next/server', () => ({
  NextResponse: {
    json: nextResponseJsonMock,
  },
}));

vi.mock('next/headers', () => ({
  headers: headersMock,
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock('@/lib/import-revalidation', () => ({
  revalidateImportedContent: revalidateImportedContentMock,
}));

vi.mock('@/db/schema', () => ({
  posts: { id: 'posts.id' },
  comments: { id: 'comments.id' },
  tags: { id: 'tags.id' },
  postsTags: { postId: 'postsTags.postId' },
  media: { id: 'media.id' },
  navItems: { id: 'navItems.id' },
  settings: { id: 'settings.id' },
}));

vi.mock('@/lib/db', () => ({
  db: {
    insert: dbInsertMock,
    query: {
      settings: {
        findFirst: settingsFindFirstMock,
      },
    },
  },
}));

describe('POST /api/import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockState();
    headersMock.mockResolvedValue(new Headers());
    getSessionMock.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    settingsFindFirstMock.mockResolvedValue({ id: 1 });
  });

  it('reports attempted, inserted, and skipped counts from actual inserts', async () => {
    const { POST } = await import('./route');

    setReturningQueue('tags.id', [[{ id: 'tag-1' }], []]);
    setReturningQueue('posts.id', [[{ id: 'post-1' }], []]);
    setReturningQueue('postsTags.postId', [[{ postId: 'post-1' }], []]);
    setReturningQueue('comments.id', [[{ id: 'comment-1' }], []]);
    setReturningQueue('navItems.id', [[{ id: 'nav-1' }]]);
    setReturningQueue('media.id', [[], [{ id: 'media-2' }]]);

    const request = new Request('http://localhost/api/import', {
      method: 'POST',
      body: JSON.stringify({
        version: '1',
        data: {
          tags: [
            { id: 'tag-1', name: 'Tag 1', slug: 'tag-1' },
            { id: 'tag-2', name: 'Tag 2', slug: 'tag-2' },
          ],
          posts: [
            { id: 'post-1', title: 'Post 1', slug: 'post-1', content: 'A', authorId: 'old-user' },
            { id: 'post-2', title: 'Post 2', slug: 'post-2', content: 'B', authorId: 'old-user' },
          ],
          postsTags: [
            { postId: 'post-1', tagId: 'tag-1' },
            { postId: 'post-2', tagId: 'tag-2' },
          ],
          comments: [
            { id: 'comment-1', content: 'First', postId: 'post-1', userId: 'old-user' },
            { id: 'comment-2', content: 'Second', postId: 'post-2' },
          ],
          navItems: [
            { id: 'nav-1', label: 'Home', url: '/', sortOrder: 0 },
          ],
          media: [
            { id: 'media-1', url: '/1.png', filename: '1.png' },
            { id: 'media-2', url: '/2.png', filename: '2.png' },
          ],
          settings: {
            siteTitle: 'Imported title',
          },
        },
      }),
    });

    const response = await POST(request);

    expect(response).toEqual({
      status: 200,
      body: {
        success: true,
        results: {
          tags: { attempted: 2, inserted: 1, skipped: 1 },
          posts: { attempted: 2, inserted: 1, skipped: 1 },
          postsTags: { attempted: 2, inserted: 1, skipped: 1 },
          comments: { attempted: 2, inserted: 1, skipped: 1 },
          navItems: { attempted: 1, inserted: 1, skipped: 0 },
          media: { attempted: 2, inserted: 1, skipped: 1 },
          settings: { imported: true, action: 'updated' },
        },
      },
    });

    expect(revalidateImportedContentMock).toHaveBeenCalledWith({
      posts: [{ id: 'post-1', title: 'Post 1', slug: 'post-1', content: 'A', authorId: 'old-user' }],
      comments: [{ id: 'comment-1', content: 'First', postId: 'post-1', userId: 'old-user' }],
      tags: [{ id: 'tag-1', name: 'Tag 1', slug: 'tag-1' }],
      navItemsImported: true,
      settingsImported: true,
    });
  });

  it('upserts the singleton settings row when the row does not already exist', async () => {
    const { POST } = await import('./route');

    settingsFindFirstMock.mockResolvedValue(null);

    const request = new Request('http://localhost/api/import', {
      method: 'POST',
      body: JSON.stringify({
        version: '1',
        data: {
          settings: {
            siteTitle: 'Imported title',
            siteDescription: 'Imported description',
            allowRegistration: false,
          },
        },
      }),
    });

    const response = await POST(request);

    expect(response).toEqual({
      status: 200,
      body: {
        success: true,
        results: {
          tags: { attempted: 0, inserted: 0, skipped: 0 },
          posts: { attempted: 0, inserted: 0, skipped: 0 },
          postsTags: { attempted: 0, inserted: 0, skipped: 0 },
          comments: { attempted: 0, inserted: 0, skipped: 0 },
          navItems: { attempted: 0, inserted: 0, skipped: 0 },
          media: { attempted: 0, inserted: 0, skipped: 0 },
          settings: { imported: true, action: 'created' },
        },
      },
    });

    expect(getInsertCalls().at(-1)).toEqual({
      token: 'settings.id',
      values: {
        id: 1,
        siteTitle: 'Imported title',
        siteDescription: 'Imported description',
        allowRegistration: false,
      },
    });
    expect(getUpsertCalls()).toEqual([
      {
        token: 'settings.id',
        values: {
          id: 1,
          siteTitle: 'Imported title',
          siteDescription: 'Imported description',
          allowRegistration: false,
        },
        args: {
          target: 'settings.id',
          set: {
            siteTitle: 'Imported title',
            siteDescription: 'Imported description',
            allowRegistration: false,
          },
        },
      },
    ]);
  });
});
