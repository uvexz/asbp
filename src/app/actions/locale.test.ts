import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  cookiesMock,
  cookieSetMock,
  getTranslationsMock,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  cookieSetMock: vi.fn(),
  getTranslationsMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: getTranslationsMock,
}));

describe('locale actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.mockResolvedValue({
      set: cookieSetMock,
      get: vi.fn(),
    });
    getTranslationsMock.mockResolvedValue(
      vi.fn((key: string) => key === 'invalidLocale' ? 'Invalid locale' : key)
    );
  });

  it('returns a translated error for invalid locales', async () => {
    const { setLocale } = await import('./locale');

    await expect(setLocale('fr' as never)).resolves.toEqual({
      error: 'Invalid locale',
    });

    expect(cookieSetMock).not.toHaveBeenCalled();
  });

  it('stores valid locales in a cookie', async () => {
    const { setLocale } = await import('./locale');

    await expect(setLocale('zh')).resolves.toEqual({ success: true });

    expect(cookieSetMock).toHaveBeenCalledWith('locale', 'zh', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  });
});
