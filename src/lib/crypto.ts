/**
 * AES-256-GCM encryption for sensitive configuration data
 * Uses environment variable ENCRYPTION_KEY (32 bytes hex) or generates from DATABASE_URL
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash, randomInt } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
export const CAPTCHA_TTL_MS = 5 * 60 * 1000;

type CaptchaOperation = '+' | '-';

interface CaptchaPayload {
  a: number;
  b: number;
  op: CaptchaOperation;
  answer: number;
  expiresAt: number;
  nonce: string;
}

export interface MathCaptchaChallenge {
  prompt: string;
  token: string;
}

/**
 * Get or derive encryption key
 * Priority: ENCRYPTION_KEY env var > derived from BETTER_AUTH_SECRET
 */
function getEncryptionKey(): Buffer {
  if (process.env.ENCRYPTION_KEY) {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    if (key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }
    return key;
  }

  // Derive key from BETTER_AUTH_SECRET as fallback (already required for auth)
  if (process.env.BETTER_AUTH_SECRET) {
    return createHash('sha256')
      .update(process.env.BETTER_AUTH_SECRET + '_settings_encryption')
      .digest();
  }

  throw new Error('No encryption key available. Set ENCRYPTION_KEY or BETTER_AUTH_SECRET');
}

/**
 * Encrypt a string value
 * Returns base64 encoded string: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt a string value
 * Expects base64 encoded string: iv:authTag:ciphertext
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return '';

  // Check if it's encrypted (contains colons for our format)
  if (!ciphertext.includes(':')) {
    // Return as-is if not encrypted (for backward compatibility)
    return ciphertext;
  }

  try {
    const key = getEncryptionKey();
    const parts = ciphertext.split(':');

    if (parts.length !== 3) {
      // Not our format, return as-is
      return ciphertext;
    }

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];

    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      // Invalid format, return as-is
      return ciphertext;
    }

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    // Decryption failed, might be plaintext or corrupted
    // Return as-is for backward compatibility
    return ciphertext;
  }
}

/**
 * Check if a value appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
  if (!value || !value.includes(':')) return false;
  const parts = value.split(':');
  if (parts.length !== 3) return false;

  try {
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    return iv.length === IV_LENGTH && authTag.length === AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}

function generateCaptchaQuestion(): Omit<CaptchaPayload, 'expiresAt' | 'nonce'> {
  const op: CaptchaOperation = randomInt(2) === 0 ? '+' : '-';

  if (op === '+') {
    const a = randomInt(1, 11);
    const b = randomInt(1, 11);
    return { a, b, op, answer: a + b };
  }

  const a = randomInt(5, 15);
  const b = randomInt(a);
  return { a, b, op, answer: a - b };
}

function parseCaptchaPayload(token: string): CaptchaPayload | null {
  if (!token) {
    return null;
  }

  try {
    const decrypted = decrypt(token);
    const payload = JSON.parse(decrypted) as Partial<CaptchaPayload>;

    if (
      typeof payload.a !== 'number' ||
      typeof payload.b !== 'number' ||
      (payload.op !== '+' && payload.op !== '-') ||
      typeof payload.answer !== 'number' ||
      typeof payload.expiresAt !== 'number' ||
      typeof payload.nonce !== 'string'
    ) {
      return null;
    }

    return payload as CaptchaPayload;
  } catch {
    return null;
  }
}

export function createMathCaptchaChallenge(now: number = Date.now()): MathCaptchaChallenge {
  const question = generateCaptchaQuestion();
  const payload: CaptchaPayload = {
    ...question,
    expiresAt: now + CAPTCHA_TTL_MS,
    nonce: randomBytes(8).toString('hex'),
  };

  return {
    prompt: `${payload.a} ${payload.op} ${payload.b} =`,
    token: encrypt(JSON.stringify(payload)),
  };
}

export function verifyMathCaptchaToken(
  token: string,
  response: string | number,
  now: number = Date.now(),
): boolean {
  const payload = parseCaptchaPayload(token);

  if (!payload || payload.expiresAt < now) {
    return false;
  }

  const parsedResponse =
    typeof response === 'number'
      ? response
      : Number.parseInt(response.trim(), 10);

  if (!Number.isInteger(parsedResponse)) {
    return false;
  }

  return parsedResponse === payload.answer;
}
