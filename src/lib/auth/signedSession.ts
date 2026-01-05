import crypto from 'crypto';

export type SignedSessionPayload = {
  customerId: string;
  email: string;
  issuedAt: number; // epoch ms
  expiresAt: number; // epoch ms
};

function base64UrlEncode(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecodeToString(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  return Buffer.from(base64 + pad, 'base64').toString('utf8');
}

function hmacSha256Base64Url(secret: string, data: string): string {
  return base64UrlEncode(crypto.createHmac('sha256', secret).update(data).digest());
}

export function signCustomerSessionCookie(secret: string, payload: SignedSessionPayload): string {
  const json = JSON.stringify(payload);
  const body = base64UrlEncode(json);
  const sig = hmacSha256Base64Url(secret, body);
  return `${body}.${sig}`;
}

export function verifyCustomerSessionCookie(secret: string, token: string): SignedSessionPayload | null {
  const [body, sig] = (token || '').split('.', 2);
  if (!body || !sig) return null;

  const expected = hmacSha256Base64Url(secret, body);
  // Timing-safe compare
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  try {
    const json = base64UrlDecodeToString(body);
    const payload = JSON.parse(json) as SignedSessionPayload;

    if (!payload?.customerId || !payload?.email || !payload?.expiresAt) return null;
    if (Date.now() > Number(payload.expiresAt)) return null;

    return {
      customerId: String(payload.customerId),
      email: String(payload.email),
      issuedAt: Number(payload.issuedAt),
      expiresAt: Number(payload.expiresAt),
    };
  } catch {
    return null;
  }
}
