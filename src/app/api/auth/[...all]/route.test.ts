import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  handlerGetMock,
  handlerPostMock,
  handlerPatchMock,
  handlerPutMock,
  handlerDeleteMock,
  checkRegistrationStatusMock,
  postRegistrationCleanupMock,
  withRegistrationBootstrapLockMock,
} = vi.hoisted(() => ({
  handlerGetMock: vi.fn(),
  handlerPostMock: vi.fn(),
  handlerPatchMock: vi.fn(),
  handlerPutMock: vi.fn(),
  handlerDeleteMock: vi.fn(),
  checkRegistrationStatusMock: vi.fn(),
  postRegistrationCleanupMock: vi.fn(),
  withRegistrationBootstrapLockMock: vi.fn(async (callback: () => Promise<unknown>) => callback()),
}));

vi.mock('@/lib/auth', () => ({
  auth: {},
}));

vi.mock('better-auth/next-js', () => ({
  toNextJsHandler: vi.fn(() => ({
    GET: handlerGetMock,
    POST: handlerPostMock,
    PATCH: handlerPatchMock,
    PUT: handlerPutMock,
    DELETE: handlerDeleteMock,
  })),
}));

vi.mock('@/app/actions/auth-helpers', () => ({
  checkRegistrationStatus: checkRegistrationStatusMock,
  postRegistrationCleanup: postRegistrationCleanupMock,
  withRegistrationBootstrapLock: withRegistrationBootstrapLockMock,
}));

describe('auth route signup guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRegistrationStatusMock.mockResolvedValue({ allowed: true, isFirstUser: true });
    postRegistrationCleanupMock.mockResolvedValue({ promotedToAdmin: true });
    withRegistrationBootstrapLockMock.mockImplementation(async (callback: () => Promise<unknown>) => callback());
  });

  it('delegates non-signup POST requests directly to better-auth', async () => {
    const { POST } = await import('./route');
    const response = new Response(null, { status: 204 });
    const request = new Request('http://localhost/api/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: 'secret' }),
      headers: { 'content-type': 'application/json' },
    });

    handlerPostMock.mockResolvedValue(response);

    await expect(POST(request)).resolves.toBe(response);

    expect(withRegistrationBootstrapLockMock).not.toHaveBeenCalled();
    expect(checkRegistrationStatusMock).not.toHaveBeenCalled();
    expect(postRegistrationCleanupMock).not.toHaveBeenCalled();
    expect(handlerPostMock).toHaveBeenCalledWith(request);
  });

  it('rejects email signup when registration is closed before reaching better-auth', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/auth/sign-up/email', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: 'secret', name: 'User' }),
      headers: { 'content-type': 'application/json' },
    });

    checkRegistrationStatusMock.mockResolvedValue({ allowed: false, isFirstUser: false });

    const response = await POST(request);

    expect(withRegistrationBootstrapLockMock).toHaveBeenCalledTimes(1);
    expect(checkRegistrationStatusMock).toHaveBeenCalledTimes(1);
    expect(handlerPostMock).not.toHaveBeenCalled();
    expect(postRegistrationCleanupMock).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      code: 'REGISTRATION_CLOSED',
      message: 'Registration is closed',
    });
  });

  it('runs post-signup cleanup with the submitted email after a successful signup', async () => {
    const { POST } = await import('./route');
    const response = new Response(JSON.stringify({ user: { id: 'user-1' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    const request = new Request('http://localhost/api/auth/sign-up/email', {
      method: 'POST',
      body: JSON.stringify({ email: 'First@Example.com', password: 'secret', name: 'First User' }),
      headers: { 'content-type': 'application/json' },
    });

    handlerPostMock.mockResolvedValue(response);

    await expect(POST(request)).resolves.toBe(response);

    expect(withRegistrationBootstrapLockMock).toHaveBeenCalledTimes(1);
    expect(checkRegistrationStatusMock).toHaveBeenCalledTimes(1);
    expect(handlerPostMock).toHaveBeenCalledWith(request);
    expect(postRegistrationCleanupMock).toHaveBeenCalledWith('First@Example.com', {
      bootstrapFirstUser: true,
    });
  });

  it('skips cleanup when better-auth rejects the signup', async () => {
    const { POST } = await import('./route');
    const response = new Response(JSON.stringify({ code: 'USER_EXISTS' }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    });
    const request = new Request('http://localhost/api/auth/sign-up/email', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: 'secret', name: 'User' }),
      headers: { 'content-type': 'application/json' },
    });

    handlerPostMock.mockResolvedValue(response);

    await expect(POST(request)).resolves.toBe(response);

    expect(postRegistrationCleanupMock).not.toHaveBeenCalled();
  });

  it('passes through non-bootstrap cleanup calls without promotion when registration was already open for later users', async () => {
    const { POST } = await import('./route');
    const response = new Response(JSON.stringify({ user: { id: 'user-2' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    const request = new Request('http://localhost/api/auth/sign-up/email', {
      method: 'POST',
      body: JSON.stringify({ email: 'later@example.com', password: 'secret', name: 'Later User' }),
      headers: { 'content-type': 'application/json' },
    });

    checkRegistrationStatusMock.mockResolvedValue({ allowed: true, isFirstUser: false });
    handlerPostMock.mockResolvedValue(response);

    await expect(POST(request)).resolves.toBe(response);

    expect(postRegistrationCleanupMock).toHaveBeenCalledWith('later@example.com', {
      bootstrapFirstUser: false,
    });
  });
});
