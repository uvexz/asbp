import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getSessionMock,
  headersMock,
  verifyMathCaptchaTokenMock,
  safeParseMock,
  formatValidationIssuesMock,
  getTranslationsMock,
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
    formatValidationIssuesMock: vi.fn(),
    getTranslationsMock: vi.fn(),
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

vi.mock('@/lib/public-revalidation', () => ({
  revalidatePublicPostRouteById: vi.fn(),
}));

vi.mock('@/lib/crypto', () => ({
  createMathCaptchaChallenge: vi.fn(() => ({ prompt: '1 + 1 =', token: 'token' })),
  verifyMathCaptchaToken: verifyMathCaptchaTokenMock,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: getTranslationsMock,
  getLocale: vi.fn(),
}));

vi.mock('@/lib/validations', () => ({
  commentSchema: {
    safeParse: safeParseMock,
  },
  formatValidationIssues: formatValidationIssuesMock,
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
    getTranslationsMock.mockResolvedValue(vi.fn((key: string) => key));
    formatValidationIssuesMock.mockReturnValue('Formatted validation error');
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

  it('returns translated required-content errors for logged-in users', async () => {
    getSessionMock.mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
    });
    getTranslationsMock.mockResolvedValue(vi.fn((key: string) => key === 'contentRequired' ? 'Content is required' : key));

    const formData = new FormData();
    formData.set('content', '   ');

    await expect(createComment('post-1', formData)).resolves.toEqual({
      success: false,
      error: 'Content is required',
    });

    expect(dbInsertMock).not.toHaveBeenCalled();
  });

  it('formats guest validation issues through the translation helper', async () => {
    safeParseMock.mockReturnValue({
      success: false,
      error: {
        issues: [{ code: 'too_small', minimum: 1, origin: 'string' }],
      },
    });
    formatValidationIssuesMock.mockReturnValue('This field is required');

    const formData = new FormData();
    formData.set('content', 'Hello world');
    formData.set('guestName', '');
    formData.set('guestEmail', 'guest@example.com');
    formData.set('captchaToken', 'valid-token');
    formData.set('captchaResponse', '5');

    await expect(createComment('post-1', formData)).resolves.toEqual({
      success: false,
      error: 'This field is required',
    });

    expect(formatValidationIssuesMock).toHaveBeenCalledWith(
      [{ code: 'too_small', minimum: 1, origin: 'string' }],
      expect.any(Function)
    );
    expect(spamCheckMock).not.toHaveBeenCalled();
    expect(dbInsertMock).not.toHaveBeenCalled();
  });
});
