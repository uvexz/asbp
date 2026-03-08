import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getSessionMock,
  headersMock,
  getTranslationsMock,
  getS3ClientMock,
  getSettingsMock,
  sendMock,
  revalidatePathMock,
  selectLimitMock,
  dbSelectMock,
} = vi.hoisted(() => {
  const selectLimitMock = vi.fn();
  const selectWhereMock = vi.fn(() => ({ limit: selectLimitMock }));
  const selectFromMock = vi.fn(() => ({ where: selectWhereMock }));

  return {
    getSessionMock: vi.fn(),
    headersMock: vi.fn(),
    getTranslationsMock: vi.fn(),
    getS3ClientMock: vi.fn(),
    getSettingsMock: vi.fn(),
    sendMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    selectLimitMock,
    dbSelectMock: vi.fn(() => ({ from: selectFromMock })),
  };
});

vi.mock('next/headers', () => ({
  headers: headersMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
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

vi.mock('@/lib/s3', () => ({
  getS3Client: getS3ClientMock,
}));

vi.mock('./settings', () => ({
  getSettings: getSettingsMock,
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: dbSelectMock,
  },
}));

vi.mock('@/db/schema', () => ({
  media: {
    id: 'media.id',
  },
}));

vi.mock('drizzle-orm', () => ({
  desc: vi.fn((value) => ({ value })),
  eq: vi.fn((field, value) => ({ field, value })),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  PutObjectCommand: class PutObjectCommand {
    constructor(public input: unknown) {}
  },
  DeleteObjectCommand: class DeleteObjectCommand {
    constructor(public input: unknown) {}
  },
}));

vi.mock('ulid', () => ({
  ulid: vi.fn(() => 'generated-ulid'),
}));

describe('media actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue(new Headers());
    getSessionMock.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    getTranslationsMock.mockResolvedValue(vi.fn((key: string) => ({
      noFileProvided: 'No file provided',
      emptyFile: 'File is empty',
      s3ConfigRequired: 'S3 storage is not configured',
      mediaNotFound: 'Media not found',
      uploadFailed: 'Upload failed',
    }[key] ?? key)));
    getSettingsMock.mockResolvedValue({
      s3Bucket: 'bucket',
      s3Endpoint: 'https://s3.example.com',
      s3CdnUrl: null,
    });
    getS3ClientMock.mockResolvedValue({ send: sendMock });
    selectLimitMock.mockResolvedValue([{ id: 'media-1', url: 'https://s3.example.com/bucket/uploads/file.png' }]);
  });

  it('returns a translated error when no file is provided', async () => {
    const { uploadMedia } = await import('./media');

    const formData = new FormData();

    await expect(uploadMedia(formData)).resolves.toEqual({
      success: false,
      error: 'No file provided',
    });
  });

  it('returns a translated error when the file is empty', async () => {
    const { uploadMedia } = await import('./media');

    const formData = new FormData();
    formData.set('file', new File([''], 'empty.txt', { type: 'text/plain' }));

    await expect(uploadMedia(formData)).resolves.toEqual({
      success: false,
      error: 'File is empty',
    });
  });

  it('returns a translated error when S3 is not configured', async () => {
    const { uploadMedia } = await import('./media');

    getS3ClientMock.mockResolvedValue(null);

    const formData = new FormData();
    formData.set('file', new File(['hello'], 'hello.txt', { type: 'text/plain' }));

    await expect(uploadMedia(formData)).resolves.toEqual({
      success: false,
      error: 'S3 storage is not configured',
    });
  });

  it('falls back to a translated upload error for unknown failures', async () => {
    const { uploadMedia } = await import('./media');

    sendMock.mockRejectedValue('unknown failure');

    const formData = new FormData();
    formData.set('file', new File(['hello'], 'hello.txt', { type: 'text/plain' }));

    await expect(uploadMedia(formData)).resolves.toEqual({
      success: false,
      error: 'Upload failed',
    });
  });

  it('returns a translated error when deleting missing media', async () => {
    const { deleteMedia } = await import('./media');

    selectLimitMock.mockResolvedValue([]);

    await expect(deleteMedia('missing-media')).resolves.toEqual({
      success: false,
      error: 'Media not found',
    });
  });
});
