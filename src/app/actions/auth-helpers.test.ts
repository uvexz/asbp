import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  userFindFirstMock,
  settingsFindFirstMock,
  dbUpdateWhereMock,
  dbUpdateSetMock,
  dbUpdateMock,
  dbInsertOnConflictDoUpdateMock,
  dbInsertValuesMock,
  dbInsertMock,
  poolQueryMock,
  poolReleaseMock,
  poolConnectMock,
  eqMock,
  ascMock,
} = vi.hoisted(() => {
  const userFindFirstMock = vi.fn();
  const settingsFindFirstMock = vi.fn();
  const dbUpdateWhereMock = vi.fn();
  const dbUpdateSetMock = vi.fn(() => ({ where: dbUpdateWhereMock }));
  const dbUpdateMock = vi.fn(() => ({ set: dbUpdateSetMock }));
  const dbInsertOnConflictDoUpdateMock = vi.fn();
  const dbInsertValuesMock = vi.fn(() => ({ onConflictDoUpdate: dbInsertOnConflictDoUpdateMock }));
  const dbInsertMock = vi.fn(() => ({ values: dbInsertValuesMock }));
  const poolQueryMock = vi.fn();
  const poolReleaseMock = vi.fn();
  const poolConnectMock = vi.fn(async () => ({
    query: poolQueryMock,
    release: poolReleaseMock,
  }));
  const eqMock = vi.fn((field, value) => ({ field, value }));
  const ascMock = vi.fn((field) => ({ direction: 'asc', field }));

  return {
    userFindFirstMock,
    settingsFindFirstMock,
    dbUpdateWhereMock,
    dbUpdateSetMock,
    dbUpdateMock,
    dbInsertOnConflictDoUpdateMock,
    dbInsertValuesMock,
    dbInsertMock,
    poolQueryMock,
    poolReleaseMock,
    poolConnectMock,
    eqMock,
    ascMock,
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: {
        findFirst: userFindFirstMock,
      },
      settings: {
        findFirst: settingsFindFirstMock,
      },
    },
    update: dbUpdateMock,
    insert: dbInsertMock,
  },
  pool: {
    connect: poolConnectMock,
  },
}));

vi.mock('@/db/schema', () => ({
  users: {
    id: 'users.id',
    email: 'users.email',
    role: 'users.role',
    createdAt: 'users.createdAt',
  },
  settings: {
    id: 'settings.id',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: eqMock,
  asc: ascMock,
}));

describe('auth helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses an advisory lock around bootstrap-sensitive work', async () => {
    const { withRegistrationBootstrapLock } = await import('./auth-helpers');

    const result = await withRegistrationBootstrapLock(async () => 'done');

    expect(result).toBe('done');
    expect(poolConnectMock).toHaveBeenCalledTimes(1);
    expect(poolQueryMock).toHaveBeenNthCalledWith(1, 'SELECT pg_advisory_lock($1)', [841921]);
    expect(poolQueryMock).toHaveBeenNthCalledWith(2, 'SELECT pg_advisory_unlock($1)', [841921]);
    expect(poolReleaseMock).toHaveBeenCalledTimes(1);
  });

  it('uses lightweight existence checks for registration status', async () => {
    const { checkRegistrationStatus } = await import('./auth-helpers');

    userFindFirstMock.mockResolvedValueOnce(null);

    await expect(checkRegistrationStatus()).resolves.toEqual({
      allowed: true,
      isFirstUser: true,
    });

    expect(userFindFirstMock).toHaveBeenCalledWith({
      columns: { id: true },
    });
    expect(settingsFindFirstMock).not.toHaveBeenCalled();

    userFindFirstMock.mockResolvedValueOnce({ id: 'user-1' });
    settingsFindFirstMock.mockResolvedValueOnce({ allowRegistration: false });

    await expect(checkRegistrationStatus()).resolves.toEqual({
      allowed: false,
      isFirstUser: false,
    });

    expect(settingsFindFirstMock).toHaveBeenCalledWith({
      columns: { allowRegistration: true },
    });
  });

  it('promotes the earliest user only for the first-user bootstrap path and closes registration', async () => {
    const { postRegistrationCleanup } = await import('./auth-helpers');

    userFindFirstMock.mockResolvedValueOnce({
      id: 'user-1',
      email: 'first@example.com',
      role: 'user',
    });

    await expect(postRegistrationCleanup(' First@Example.com ', { bootstrapFirstUser: true })).resolves.toEqual({
      promotedToAdmin: true,
    });

    expect(ascMock).toHaveBeenNthCalledWith(1, 'users.createdAt');
    expect(ascMock).toHaveBeenNthCalledWith(2, 'users.id');
    expect(userFindFirstMock).toHaveBeenCalledWith({
      columns: { id: true, email: true, role: true },
      orderBy: [
        { direction: 'asc', field: 'users.createdAt' },
        { direction: 'asc', field: 'users.id' },
      ],
    });
    expect(dbUpdateSetMock).toHaveBeenCalledWith({ role: 'admin' });
    expect(dbUpdateWhereMock).toHaveBeenCalledWith({ field: 'users.id', value: 'user-1' });
    expect(dbInsertValuesMock).toHaveBeenCalledWith({
      id: 1,
      allowRegistration: false,
    });
    expect(dbInsertOnConflictDoUpdateMock).toHaveBeenCalledWith({
      target: 'settings.id',
      set: { allowRegistration: false },
    });
  });

  it('skips promotion and registration closure outside the first-user bootstrap path', async () => {
    const { postRegistrationCleanup } = await import('./auth-helpers');

    await expect(postRegistrationCleanup('later@example.com')).resolves.toEqual({
      promotedToAdmin: false,
    });

    expect(userFindFirstMock).not.toHaveBeenCalled();
    expect(dbUpdateMock).not.toHaveBeenCalled();
    expect(dbInsertMock).not.toHaveBeenCalled();
  });

  it('does not rewrite the user role when the bootstrap user is already admin', async () => {
    const { postRegistrationCleanup } = await import('./auth-helpers');

    userFindFirstMock.mockResolvedValueOnce({
      id: 'admin-1',
      email: 'admin@example.com',
      role: 'admin',
    });

    await expect(postRegistrationCleanup('admin@example.com', { bootstrapFirstUser: true })).resolves.toEqual({
      promotedToAdmin: true,
    });

    expect(dbUpdateMock).not.toHaveBeenCalled();
    expect(dbInsertMock).toHaveBeenCalledTimes(1);
  });
});
