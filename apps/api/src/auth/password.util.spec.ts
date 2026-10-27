import { hashPassword, verifyPassword, validatePasswordStrength } from './password.util';

describe('password.util', () => {
  it('should hash a password and verify it correctly', async () => {
    const raw = 'SecurePass123!@#';
    const hash = await hashPassword(raw);

    expect(hash).toMatch(/^scrypt\$16384\$8\$1\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
    const isValid = await verifyPassword(raw, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('WrongPassword123!', hash);
    expect(isInvalid).toBe(false);
  });

  it('should reject malformed hashes safely', async () => {
    expect(await verifyPassword('Pass', 'invalid-hash')).toBe(false);
    expect(await verifyPassword('Pass', '')).toBe(false);
  });

  it('should validate password strength rules', () => {
    expect(validatePasswordStrength('short1!').valid).toBe(false);
    expect(validatePasswordStrength('alllowercase123!').valid).toBe(false);
    expect(validatePasswordStrength('ALLUPPERCASE123!').valid).toBe(false);
    expect(validatePasswordStrength('NoSpecialChar123').valid).toBe(false);
    expect(validatePasswordStrength('NoNumberSpecial!').valid).toBe(false);
    expect(validatePasswordStrength('ValidComplex123!').valid).toBe(true);
  });
});
