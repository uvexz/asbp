import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getSessionMock,
  headersMock,
  redirectMock,
  invalidateSettingsCacheMock,
  revalidatePathMock,
  resolveSecretFieldValueMock,
  safeParseMock,
  formatValidationIssuesMock,
  getTranslationsMock,
  selectLimitMock,
  insertValuesMock,
  insertOnConflictDoUpdateMock,
  dbSelectMock,
  dbInsertMock,
  consoleErrorMock,
} = vi.hoisted(() => {
  const selectLimitMock = vi.fn();
  const selectWhereMock = vi.fn(() => ({ limit: selectLimitMock }));
  const selectFromMock = vi.fn(() => ({ where: selectWhereMock }));

  const insertOnConflictDoUpdateMock = vi.fn();
  const insertValuesMock = vi.fn(() => ({ onConflictDoUpdate: insertOnConflictDoUpdateMock }));

  return {
    getSessionMock: vi.fn(),
    headersMock: vi.fn(),
    redirectMock: vi.fn(),
    invalidateSettingsCacheMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    resolveSecretFieldValueMock: vi.fn(),
    safeParseMock: vi.fn(),
    formatValidationIssuesMock: vi.fn(),
    getTranslationsMock: vi.fn(),
    selectLimitMock,
    insertValuesMock,
    insertOnConflictDoUpdateMock,
    dbSelectMock: vi.fn(() => ({ from: selectFromMock })),
    dbInsertMock: vi.fn(() => ({ values: insertValuesMock })),
    consoleErrorMock: vi.spyOn(console, 'error').mockImplementation(() => {}),
  };
});

vi.mock('next/headers', () => ({
  headers: headersMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock('@/lib/cache-layer', () => ({
  getCachedSettings: vi.fn(),
  invalidateSettingsCache: invalidateSettingsCacheMock,
}));

vi.mock('@/lib/settings-secrets', () => ({
  resolveSecretFieldValue: resolveSecretFieldValueMock,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: getTranslationsMock,
}));

vi.mock('@/lib/validations', () => ({
  settingsSchema: {
    safeParse: safeParseMock,
  },
  formatValidationIssues: formatValidationIssuesMock,
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: dbSelectMock,
    insert: dbInsertMock,
  },
}));

vi.mock('@/db/schema', () => ({
  settings: { id: 'settings.id' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ field, value })),
}));

describe('updateSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue(new Headers());
    getSessionMock.mockResolvedValue({ user: { role: 'admin' } });
    getTranslationsMock.mockResolvedValue(vi.fn((key: string) => key));
    formatValidationIssuesMock.mockReturnValue('Formatted validation error');
    selectLimitMock.mockResolvedValue([{
      s3AccessKey: 'stored-access',
      s3SecretKey: 'stored-secret',
      resendApiKey: 'stored-resend',
      aiApiKey: 'stored-ai',
      umamiApiKey: 'stored-umami-key',
      umamiApiSecret: 'stored-umami-secret',
    }]);
    safeParseMock.mockReturnValue({
      success: true,
      data: {
        siteTitle: 'Site title',
        siteDescription: 'Site description',
        allowRegistration: true,
        faviconUrl: 'https://example.com/favicon.ico',
        s3Bucket: 'bucket',
        s3Region: 'us-east-1',
        s3AccessKey: 'new-access',
        s3SecretKey: 'new-secret',
        s3Endpoint: 'https://s3.example.com',
        s3CdnUrl: 'https://cdn.example.com',
        resendApiKey: 'new-resend',
        resendFromEmail: 'admin@example.com',
        aiBaseUrl: 'https://api.example.com/v1',
        aiApiKey: 'new-ai-key',
        aiModel: 'gpt-4o-mini',
        umamiEnabled: true,
        umamiCloud: true,
        umamiHostUrl: 'https://umami.example.com',
        umamiWebsiteId: 'website-1',
        umamiApiKey: 'new-umami-key',
        umamiApiUserId: 'user-1',
        umamiApiSecret: 'new-umami-secret',
      },
    });
    resolveSecretFieldValueMock
      .mockReturnValueOnce('resolved-access')
      .mockReturnValueOnce('resolved-secret')
      .mockReturnValueOnce('resolved-resend')
      .mockReturnValueOnce('resolved-ai')
      .mockReturnValueOnce('resolved-umami-key')
      .mockReturnValueOnce('resolved-umami-secret');
    insertOnConflictDoUpdateMock.mockResolvedValue(undefined);
  });

  it('validates normalized settings and preserves secrets through the helper', async () => {
    const { updateSettings } = await import('./settings');

    const formData = new FormData();
    formData.set('siteTitle', '  Site title  ');
    formData.set('siteDescription', 'Site description');
    formData.set('allowRegistration', 'on');
    formData.set('faviconUrl', 'https://example.com/favicon.ico');
    formData.set('s3Bucket', 'bucket');
    formData.set('s3Region', 'us-east-1');
    formData.set('s3AccessKey', 'new-access');
    formData.set('s3SecretKey', 'new-secret');
    formData.set('s3Endpoint', 'https://s3.example.com');
    formData.set('s3CdnUrl', 'https://cdn.example.com');
    formData.set('resendApiKey', 'new-resend');
    formData.set('resendFromEmail', 'admin@example.com');
    formData.set('aiBaseUrl', 'https://api.example.com/v1');
    formData.set('aiApiKey', 'new-ai-key');
    formData.set('aiModel', 'gpt-4o-mini');
    formData.set('umamiEnabled', 'on');
    formData.set('umamiCloud', 'on');
    formData.set('umamiHostUrl', 'https://umami.example.com');
    formData.set('umamiWebsiteId', 'website-1');
    formData.set('umamiApiKey', 'new-umami-key');
    formData.set('umamiApiUserId', 'user-1');
    formData.set('umamiApiSecret', 'new-umami-secret');

    await updateSettings(formData);

    expect(safeParseMock).toHaveBeenCalledWith({
      siteTitle: 'Site title',
      siteDescription: 'Site description',
      allowRegistration: true,
      faviconUrl: 'https://example.com/favicon.ico',
      s3Bucket: 'bucket',
      s3Region: 'us-east-1',
      s3AccessKey: 'new-access',
      s3SecretKey: 'new-secret',
      s3Endpoint: 'https://s3.example.com',
      s3CdnUrl: 'https://cdn.example.com',
      resendApiKey: 'new-resend',
      resendFromEmail: 'admin@example.com',
      aiBaseUrl: 'https://api.example.com/v1',
      aiApiKey: 'new-ai-key',
      aiModel: 'gpt-4o-mini',
      umamiEnabled: true,
      umamiCloud: true,
      umamiHostUrl: 'https://umami.example.com',
      umamiWebsiteId: 'website-1',
      umamiApiKey: 'new-umami-key',
      umamiApiUserId: 'user-1',
      umamiApiSecret: 'new-umami-secret',
    });

    expect(resolveSecretFieldValueMock).toHaveBeenNthCalledWith(1, {
      currentValue: 'stored-access',
      submittedValue: 'new-access',
      clearRequested: false,
    });
    expect(resolveSecretFieldValueMock).toHaveBeenNthCalledWith(2, {
      currentValue: 'stored-secret',
      submittedValue: 'new-secret',
      clearRequested: false,
    });

    expect(dbInsertMock).toHaveBeenCalledTimes(1);
    expect(insertValuesMock).toHaveBeenCalledWith({
      id: 1,
      siteTitle: 'Site title',
      siteDescription: 'Site description',
      allowRegistration: true,
      faviconUrl: 'https://example.com/favicon.ico',
      s3Bucket: 'bucket',
      s3Region: 'us-east-1',
      s3AccessKey: 'resolved-access',
      s3SecretKey: 'resolved-secret',
      s3Endpoint: 'https://s3.example.com',
      s3CdnUrl: 'https://cdn.example.com',
      resendApiKey: 'resolved-resend',
      resendFromEmail: 'admin@example.com',
      aiBaseUrl: 'https://api.example.com/v1',
      aiApiKey: 'resolved-ai',
      aiModel: 'gpt-4o-mini',
      umamiEnabled: true,
      umamiCloud: true,
      umamiHostUrl: 'https://umami.example.com',
      umamiWebsiteId: 'website-1',
      umamiApiKey: 'resolved-umami-key',
      umamiApiUserId: 'user-1',
      umamiApiSecret: 'resolved-umami-secret',
    });
    expect(invalidateSettingsCacheMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith('/');
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/settings');
    expect(redirectMock).toHaveBeenCalledWith('/admin/settings?saved=true');
  });

  it('redirects back with validation errors for invalid settings input', async () => {
    const { updateSettings } = await import('./settings');

    const issues = [
      { code: 'invalid_format', format: 'url' },
      { code: 'invalid_format', format: 'email' },
    ];
    safeParseMock.mockReturnValue({
      success: false,
      error: {
        issues,
      },
    });
    formatValidationIssuesMock.mockReturnValue('Invalid URL, Invalid email address');
    redirectMock.mockImplementationOnce(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const formData = new FormData();
    formData.set('siteTitle', 'Site title');
    formData.set('siteDescription', 'Site description');
    formData.set('faviconUrl', 'not-a-url');
    formData.set('resendFromEmail', 'not-an-email');

    await expect(updateSettings(formData)).rejects.toThrow('NEXT_REDIRECT');

    expect(dbInsertMock).not.toHaveBeenCalled();
    expect(resolveSecretFieldValueMock).not.toHaveBeenCalled();
    expect(formatValidationIssuesMock).toHaveBeenCalledWith(issues, expect.any(Function));
    expect(redirectMock).toHaveBeenCalledWith(
      `/admin/settings?error=${encodeURIComponent('Invalid URL, Invalid email address')}`
    );
  });

  it('throws a translated save error when persistence fails', async () => {
    const { updateSettings } = await import('./settings');

    getTranslationsMock.mockResolvedValue(vi.fn((key: string) => key === 'saveSettingsFailed' ? 'Failed to save settings' : key));
    insertOnConflictDoUpdateMock.mockRejectedValueOnce(new Error('db failed'));

    const formData = new FormData();
    formData.set('siteTitle', 'Site title');
    formData.set('siteDescription', 'Site description');
    formData.set('faviconUrl', 'https://example.com/favicon.ico');
    formData.set('resendFromEmail', 'admin@example.com');

    await expect(updateSettings(formData)).rejects.toThrow('Failed to save settings');

    expect(consoleErrorMock).toHaveBeenCalledWith('Failed to update settings:', expect.any(Error));
  });
});
