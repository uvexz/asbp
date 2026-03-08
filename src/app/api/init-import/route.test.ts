import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  nextResponseJsonMock,
  userFindFirstMock,
  withRegistrationBootstrapLockMock,
  signUpEmailMock,
} = vi.hoisted(() => ({
  nextResponseJsonMock: vi.fn((body: unknown, init?: { status?: number }) => ({
    body,
    status: init?.status ?? 200,
  })),
  userFindFirstMock: vi.fn(),
  withRegistrationBootstrapLockMock: vi.fn(async (callback: () => Promise<unknown>) => callback()),
  signUpEmailMock: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: nextResponseJsonMock,
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: {
        findFirst: userFindFirstMock,
      },
    },
  },
}));

vi.mock('@/app/actions/auth-helpers', () => ({
  withRegistrationBootstrapLock: withRegistrationBootstrapLockMock,
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      signUpEmail: signUpEmailMock,
    },
  },
}));

vi.mock('@/lib/import-revalidation', () => ({
  revalidateImportedContent: vi.fn(),
}));

describe('POST /api/init-import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userFindFirstMock.mockResolvedValue(null);
  });

  it('checks bootstrap state inside the registration lock before parsing import data', async () => {
    const { POST } = await import('./route');

    const request = new Request('http://localhost/api/init-import', {
      method: 'POST',
      body: JSON.stringify({
        action: 'parse',
        data: {
          data: {
            users: [{ id: 'user-1', name: 'First User', email: 'first@example.com', role: 'admin' }],
          },
        },
      }),
    });

    const response = await POST(request);

    expect(withRegistrationBootstrapLockMock).toHaveBeenCalledTimes(1);
    expect(userFindFirstMock).toHaveBeenCalledWith({
      columns: { id: true },
    });
    expect(response).toEqual({
      status: 200,
      body: {
        users: [{ id: 'user-1', name: 'First User', email: 'first@example.com', role: 'admin' }],
        hasSettings: false,
        hasPosts: false,
        hasComments: false,
      },
    });
  });

  it('rejects initialization attempts when the instance is already initialized', async () => {
    const { POST } = await import('./route');

    userFindFirstMock.mockResolvedValue({ id: 'existing-user' });

    const request = new Request('http://localhost/api/init-import', {
      method: 'POST',
      body: JSON.stringify({
        action: 'initialize',
        data: { data: { users: [] } },
        selectedUserId: 'user-1',
        password: 'password123',
      }),
    });

    const response = await POST(request);

    expect(withRegistrationBootstrapLockMock).toHaveBeenCalledTimes(1);
    expect(signUpEmailMock).not.toHaveBeenCalled();
    expect(response).toEqual({
      status: 403,
      body: { error: 'Instance already initialized' },
    });
  });
});
