import { encrypt } from './crypto';

interface ResolveSecretFieldValueOptions {
  currentValue: string | null | undefined;
  submittedValue: FormDataEntryValue | null;
  clearRequested: boolean;
}

export function resolveSecretFieldValue({
  currentValue,
  submittedValue,
  clearRequested,
}: ResolveSecretFieldValueOptions): string | null {
  if (clearRequested) {
    return null;
  }

  if (typeof submittedValue === 'string' && submittedValue.trim().length > 0) {
    return encrypt(submittedValue);
  }

  return currentValue ?? null;
}
