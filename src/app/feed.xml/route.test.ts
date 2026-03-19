import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  feedConstructorMock,
  addItemMock,
  rss2Mock,
  getCachedSettingsMock,
  getCachedFeedPostsMock,
  getLocaleMock,
} = vi.hoisted(() => ({
  feedConstructorMock: vi.fn(),
  addItemMock: vi.fn(),
  rss2Mock: vi.fn(() => '<rss />'),
  getCachedSettingsMock: vi.fn(),
  getCachedFeedPostsMock: vi.fn(),
  getLocaleMock: vi.fn(),
}));

vi.mock('feed', () => ({
  Feed: class Feed {
    constructor(options: unknown) {
      feedConstructorMock(options);
    }

    addItem = addItemMock;
    rss2 = rss2Mock;
  },
}));

vi.mock('@/lib/cache-layer', () => ({
  getCachedSettings: getCachedSettingsMock,
  getCachedFeedPosts: getCachedFeedPostsMock,
}));

vi.mock('next-intl/server', () => ({
  getLocale: getLocaleMock,
}));

describe('GET /feed.xml', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCachedSettingsMock.mockResolvedValue({
      siteTitle: 'My Blog',
      siteDescription: 'Blog description',
    });
    getCachedFeedPostsMock.mockResolvedValue([
      {
        slug: 'hello-world',
        title: 'Hello World',
        content: 'Hello world content',
        createdAt: '2024-01-01T00:00:00.000Z',
        publishedAt: null,
        author: { name: 'Jane', website: 'https://example.com' },
      },
    ]);
  });

  it('uses the active locale for feed language metadata', async () => {
    const { GET } = await import('./route');

    getLocaleMock.mockResolvedValue('en');

    const response = await GET();

    expect(feedConstructorMock).toHaveBeenCalledWith(expect.objectContaining({
      language: 'en-US',
    }));
    expect(addItemMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Hello World',
    }));
    expect(response.headers.get('Content-Type')).toBe('application/xml; charset=utf-8');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('maps zh locale to zh-CN feed metadata', async () => {
    const { GET } = await import('./route');

    getLocaleMock.mockResolvedValue('zh');

    await GET();

    expect(feedConstructorMock).toHaveBeenCalledWith(expect.objectContaining({
      language: 'zh-CN',
    }));
  });
});
