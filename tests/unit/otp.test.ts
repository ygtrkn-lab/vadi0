import { describe, expect, it, vi } from 'vitest';
import {
  canResend,
  expiresAtFromNowIso,
  generateOtpCode,
  hashOtpCode,
  isOtpCode,
  normalizeEmail,
} from '@/lib/auth/otp';

describe('otp helpers', () => {
  it('normalizeEmail trims and lowercases', () => {
    expect(normalizeEmail('  Test@Example.COM ')).toBe('test@example.com');
  });

  it('generateOtpCode produces 6 digits', () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('isOtpCode validates exactly 6 digits', () => {
    expect(isOtpCode('000000')).toBe(true);
    expect(isOtpCode('12345')).toBe(false);
    expect(isOtpCode('1234567')).toBe(false);
    expect(isOtpCode('12a456')).toBe(false);
  });

  it('hashOtpCode is stable for same inputs (with deterministic secret)', () => {
    const prev = process.env.OTP_SECRET;
    process.env.OTP_SECRET = 'unit-test-secret';
    try {
      const h1 = hashOtpCode('123456', 'A@B.com', 'login');
      const h2 = hashOtpCode('123456', 'a@b.com', 'login');
      expect(h1).toBe(h2);

      const h3 = hashOtpCode('123456', 'a@b.com', 'register');
      expect(h3).not.toBe(h2);
    } finally {
      process.env.OTP_SECRET = prev;
    }
  });

  it('expiresAtFromNowIso returns ISO string in the future', () => {
    const now = Date.now();
    const expiresIso = expiresAtFromNowIso();
    const expires = new Date(expiresIso).getTime();
    expect(Number.isNaN(expires)).toBe(false);
    expect(expires).toBeGreaterThan(now);
  });

  it('canResend respects cooldown window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-18T10:00:00Z'));

    const lastSent = new Date(Date.now()).toISOString();
    expect(canResend(lastSent)).toBe(false);

    // After 31 seconds, it should allow resend (cooldown is 30s)
    vi.setSystemTime(new Date(Date.now() + 31_000));
    expect(canResend(lastSent)).toBe(true);

    vi.useRealTimers();
  });
});
