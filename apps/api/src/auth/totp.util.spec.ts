import { generateBase32Secret, generateTotpCode, verifyTotpCode } from './totp.util';

describe('RFC 6238 TOTP Utility', () => {
  it('generates a valid base32 secret', () => {
    const secret = generateBase32Secret(20);
    expect(secret).toBeDefined();
    expect(secret.length).toBeGreaterThanOrEqual(32);
    expect(/^[A-Z2-7]+$/.test(secret)).toBe(true);
  });

  it('generates a 6-digit TOTP code and verifies it successfully', () => {
    const secret = generateBase32Secret(20);
    const code = generateTotpCode(secret);
    expect(code).toMatch(/^\d{6}$/);

    const isValid = verifyTotpCode(code, secret);
    expect(isValid).toBe(true);
  });

  it('rejects an invalid TOTP code', () => {
    const secret = generateBase32Secret(20);
    const isValid = verifyTotpCode('000000', secret);
    // Unless 000000 happens to be the code, it should fail
    const validCode = generateTotpCode(secret);
    const fakeCode = validCode === '123456' ? '654321' : '123456';
    expect(verifyTotpCode(fakeCode, secret)).toBe(false);
  });

  it('accepts codes within +/- 1 step time drift (30 seconds)', () => {
    const secret = generateBase32Secret(20);
    const now = Date.now();
    // Code 25 seconds in past
    const pastCode = generateTotpCode(secret, 30, now - 25000);
    expect(verifyTotpCode(pastCode, secret, 1, 30, now)).toBe(true);

    // Code 65 seconds in past (beyond 1 window step of 30s)
    const farPastCode = generateTotpCode(secret, 30, now - 65000);
    expect(verifyTotpCode(farPastCode, secret, 1, 30, now)).toBe(false);
  });
});
