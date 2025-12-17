import crypto from 'crypto';

export const OTP_CODE_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 30;

export type OtpPurpose = 'login' | 'register' | 'password-reset';

export function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

export function generateOtpCode(): string {
  const value = crypto.randomInt(0, 10 ** OTP_CODE_LENGTH);
  return String(value).padStart(OTP_CODE_LENGTH, '0');
}

export function getOtpSecret(): string {
  // Set OTP_SECRET in Vercel.
  return process.env.OTP_SECRET || 'dev-otp-secret';
}

export function hashOtpCode(code: string, email: string, purpose: OtpPurpose): string {
  const normalizedCode = String(code || '').trim();
  const normalizedEmail = normalizeEmail(email);
  const secret = getOtpSecret();

  return crypto
    .createHash('sha256')
    .update(`${secret}:${purpose}:${normalizedEmail}:${normalizedCode}`)
    .digest('hex');
}

export function isOtpCode(code: string): boolean {
  return /^[0-9]{6}$/.test(String(code || '').trim());
}

export function expiresAtFromNowIso(): string {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();
}

export function canResend(lastSentAtIso: string | null | undefined): boolean {
  if (!lastSentAtIso) return true;
  const last = new Date(lastSentAtIso).getTime();
  if (Number.isNaN(last)) return true;
  return Date.now() - last >= OTP_RESEND_COOLDOWN_SECONDS * 1000;
}
