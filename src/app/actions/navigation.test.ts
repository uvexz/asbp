import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getSessionMock,
  headersMock,
  getTranslationsMock,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  headersMock: vi.fn(),
  getTranslationsMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: headersMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: getTranslationsMock,
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock('@/lib/cache-layer', () => ({
  getCachedNavItems: vi.fn(),
  invalidateNavigationCache: vi.fn(),
}));

vi.mock('@/lib/public-revalidation', () => ({
  revalidatePublicShell: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({ from: vi.fn() })),
    insert: vi.fn(() => ({ values: vi.fn() })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    delete: vi.fn(() => ({ where: vi.fn() })),
  },
}));

vi.mock('@/db/schema', () => ({
  navItems: { id: 'navItems.id', sortOrder: 'navItems.sortOrder' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ field, value })),
  asc: vi.fn((field) => ({ field })),
}));

describe('navigation actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue(new Headers());
    getSessionMock.mockResolvedValue({ user: { role: 'admin' } });
    getTranslationsMock.mockResolvedValue(vi.fn((key: string) => ({
      labelAndUrlRequired: 'Display Name and Link URL are required',
    }[key] ?? key)));
  });

  it('throws a translated error when creating a nav item without required fields', async () => {
    const { createNavItem } = await import('./navigation');

    const formData = new FormData();
    formData.set('label', '');
    formData.set('url', '');

    await expect(createNavItem(formData)).rejects.toThrow('Display Name and Link URL are required');
  });

  it('throws a translated error when updating a nav item without required fields', async () => {
    const { updateNavItem } = await import('./navigation');

    const formData = new FormData();
    formData.set('label', '');
    formData.set('url', '');

    await expect(updateNavItem('nav-1', formData)).rejects.toThrow('Display Name and Link URL are required');
  });
});
