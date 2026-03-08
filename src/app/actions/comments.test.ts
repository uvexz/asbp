import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getSessionMock,
  headersMock,
  verifyMathCaptchaTokenMock,
  safeParseMock,
  invalidateCommentsCacheMock,
  revalidatePathMock,
  insertReturningMock,
  dbInsertMock,
  spamCheckMock,
} = vi.hoisted(() => {
  const insertReturningMock = vi.fn();
  const insertValuesMock = vi.fn(() => ({
    returning: insertReturningMock,
  }));

  return {
    getSessionMock: vi.fn(),
    headersMock: vi.fn(),
    verifyMathCaptchaTokenMock: vi.fn(),
    safeParseMock: vi.fn(),
    invalidateCommentsCacheMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    insertValuesMock,
    insertReturningMock,
    dbInsertMock: vi.fn(() => ({
      values: insertValuesMock,
    })),
    spamCheckMock: vi.fn(),
  };
});

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
  getCachedPostComments: vi.fn(),
  invalidateCommentsCache: invalidateCommentsCacheMock,
}));

vi.mock('@/lib/crypto', () => ({
  createMathCaptchaChallenge: vi.fn(() => ({ prompt: '1 + 1 =', token: 'token' })),
  verifyMathCaptchaToken: verifyMathCaptchaTokenMock,
}));

vi.mock('@/lib/validations', () => ({
  commentSchema: {
    safeParse: safeParseMock,
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    insert: dbInsertMock,
  },
}));

vi.mock('@/db/schema', () => ({
  comments: { id: 'comments.id' },
  posts: {},
}));

vi.mock('@/lib/spam-detector', () => ({
  checkCommentSpam: spamCheckMock,
}));

import { createComment } from './comments';

describe('createComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue(new Headers());
    getSessionMock.mockResolvedValue(null);
    verifyMathCaptchaTokenMock.mockReturnValue(true);
    safeParseMock.mockReturnValue({
      success: true,
      data: {
        content: 'Guest comment',
        guestName: 'Guest User',
        guestEmail: 'guest@example.com',
        guestWebsite: '',
      },
    });
    spamCheckMock.mockResolvedValue({ isSpam: false, autoApproved: false });
    insertReturningMock.mockResolvedValue([{ id: 'comment-1' }]);
  });

  it('rejects guest comments without a valid captcha token', async () => {
    verifyMathCaptchaTokenMock.mockReturnValue(false);

    const formData = new FormData();
    formData.set('content', 'Hello world');
    formData.set('guestName', 'Guest User');
    formData.set('guestEmail', 'guest@example.com');
    formData.set('captchaToken', 'invalid-token');
    formData.set('captchaResponse', '5');

    await expect(createComment('post-1', formData)).resolves.toEqual({
      success: false,
      error: 'captcha_invalid',
    });

    expect(safeParseMock).not.toHaveBeenCalled();
    expect(spamCheckMock).not.toHaveBeenCalled();
    expect(dbInsertMock).not.toHaveBeenCalled();
  });

  it('allows logged-in users to comment without captcha verification', async () => {
    getSessionMock.mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
    });

    const formData = new FormData();
    formData.set('content', 'Signed in comment');

    await expect(createComment('post-1', formData)).resolves.toEqual({
      success: true,
      autoApproved: true,
    });

    expect(verifyMathCaptchaTokenMock).not.toHaveBeenCalled();
    expect(dbInsertMock).toHaveBeenCalledTimes(1);
    expect(invalidateCommentsCacheMock).toHaveBeenCalledWith('post-1');
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/comments');
  });
});
