import crypto from 'crypto';

export function randomBase64Url(bytes: number): string {
  return crypto
    .randomBytes(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function sha256Base64Url(input: string): string {
  return crypto
    .createHash('sha256')
    .update(input)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function getSiteOriginFromEnv(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    '';

  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function sanitizeRedirectPath(input: string | null): string {
  if (!input) return '/';
  const v = input.trim();
  if (!v.startsWith('/')) return '/';
  // Prevent open redirects and weird protocol-like paths
  if (v.startsWith('//')) return '/';
  return v;
}
