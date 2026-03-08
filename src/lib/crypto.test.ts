import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CAPTCHA_TTL_MS, createMathCaptchaChallenge, decrypt, verifyMathCaptchaToken } from './crypto';

const originalBetterAuthSecret = process.env.BETTER_AUTH_SECRET;

describe('math captcha helpers', () => {
  beforeAll(() => {
    process.env.BETTER_AUTH_SECRET = 'test-secret';
  });

  afterAll(() => {
    if (originalBetterAuthSecret === undefined) {
      delete process.env.BETTER_AUTH_SECRET;
      return;
    }

    process.env.BETTER_AUTH_SECRET = originalBetterAuthSecret;
  });

  it('creates a signed challenge that validates the correct answer', () => {
    const now = 1_700_000_000_000;
    const challenge = createMathCaptchaChallenge(now);
    const payload = JSON.parse(decrypt(challenge.token)) as {
      answer: number;
      expiresAt: number;
      nonce: string;
    };

    expect(challenge.prompt).toMatch(/^\d+ [+-] \d+ =$/);
    expect(payload.expiresAt).toBe(now + CAPTCHA_TTL_MS);
    expect(payload.nonce).toMatch(/^[a-f0-9]+$/);
    expect(verifyMathCaptchaToken(challenge.token, String(payload.answer), now)).toBe(true);
  });

  it('rejects wrong answers', () => {
    const challenge = createMathCaptchaChallenge(1_700_000_000_000);
    const payload = JSON.parse(decrypt(challenge.token)) as { answer: number };

    expect(verifyMathCaptchaToken(challenge.token, String(payload.answer + 1), 1_700_000_000_000)).toBe(false);
  });

  it('rejects expired tokens', () => {
    const now = 1_700_000_000_000;
    const challenge = createMathCaptchaChallenge(now);
    const payload = JSON.parse(decrypt(challenge.token)) as { answer: number };

    expect(verifyMathCaptchaToken(challenge.token, payload.answer, now + CAPTCHA_TTL_MS + 1)).toBe(false);
  });

  it('rejects malformed tokens', () => {
    expect(verifyMathCaptchaToken('not-a-token', '1')).toBe(false);
  });
});
