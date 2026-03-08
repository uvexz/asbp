import { beforeEach, describe, expect, it, vi } from 'vitest';

const { encryptMock } = vi.hoisted(() => ({
  encryptMock: vi.fn((value: string) => `encrypted:${value}`),
}));

vi.mock('./crypto', () => ({
  encrypt: encryptMock,
}));

import { resolveSecretFieldValue } from './settings-secrets';

describe('resolveSecretFieldValue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves the current stored value when the submitted input is blank', () => {
    expect(resolveSecretFieldValue({
      currentValue: 'stored-secret',
      submittedValue: '',
      clearRequested: false,
    })).toBe('stored-secret');
  });

  it('preserves the current stored value when the field is omitted', () => {
    expect(resolveSecretFieldValue({
      currentValue: 'stored-secret',
      submittedValue: null,
      clearRequested: false,
    })).toBe('stored-secret');
  });

  it('clears the stored value only when explicitly requested', () => {
    expect(resolveSecretFieldValue({
      currentValue: 'stored-secret',
      submittedValue: '',
      clearRequested: true,
    })).toBeNull();
  });

  it('encrypts and stores a newly submitted secret', () => {
    expect(resolveSecretFieldValue({
      currentValue: 'stored-secret',
      submittedValue: 'new-secret',
      clearRequested: false,
    })).toBe('encrypted:new-secret');
    expect(encryptMock).toHaveBeenCalledWith('new-secret');
  });

  it('falls back to null when there is no current value', () => {
    expect(resolveSecretFieldValue({
      currentValue: undefined,
      submittedValue: '',
      clearRequested: false,
    })).toBeNull();
  });
});
