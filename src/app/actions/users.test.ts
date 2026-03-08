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

vi.mock('@/lib/server-utils', () => ({
  isAdminAuthorized: vi.fn((session) => Boolean(session?.user && session.user.role === 'admin')),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({ from: vi.fn(() => ({ orderBy: vi.fn(), where: vi.fn() })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    delete: vi.fn(() => ({ where: vi.fn() })),
  },
}));

vi.mock('@/db/schema', () => ({
  users: { id: 'users.id', createdAt: 'users.createdAt' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ field, value })),
  desc: vi.fn((field) => ({ field })),
}));

describe('deleteUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue(new Headers());
    getSessionMock.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    getTranslationsMock.mockResolvedValue(vi.fn((key: string) => ({
      cannotDeleteOwnAccount: 'You cannot delete your own account',
    }[key] ?? key)));
  });

  it('throws a translated error when deleting the current admin account', async () => {
    const { deleteUser } = await import('./users');

    await expect(deleteUser('admin-1')).rejects.toThrow('You cannot delete your own account');
  });
});
