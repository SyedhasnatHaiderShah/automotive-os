import { createHmac, randomBytes } from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateBase32Secret(byteLength: number = 20): string {
  const buffer = randomBytes(byteLength);
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]!;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32ToBuffer(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]!);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function generateTotpCode(secretBase32: string, timeStepWindow: number = 30, timeMs: number = Date.now()): string {
  const key = base32ToBuffer(secretBase32);
  const counter = Math.floor(timeMs / 1000 / timeStepWindow);

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter), 0);

  const hmac = createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;

  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

export function verifyTotpCode(
  code: string,
  secretBase32: string,
  windowSteps: number = 1,
  timeStepWindow: number = 30,
  timeMs: number = Date.now()
): boolean {
  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    return false;
  }

  for (let step = -windowSteps; step <= windowSteps; step++) {
    const targetTime = timeMs + step * timeStepWindow * 1000;
    const generated = generateTotpCode(secretBase32, timeStepWindow, targetTime);
    if (generated === code) {
      return true;
    }
  }

  return false;
}
