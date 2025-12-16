import { NextRequest, NextResponse } from 'next/server';
import { getSiteOriginFromEnv, randomBase64Url, sanitizeRedirectPath, sha256Base64Url } from '@/lib/auth/googleOAuth';

const OAUTH_COOKIE_STATE = 'vadiler_google_oauth_state';
const OAUTH_COOKIE_VERIFIER = 'vadiler_google_oauth_verifier';
const OAUTH_COOKIE_REDIRECT = 'vadiler_google_oauth_redirect';

function getRequestOrigin(request: NextRequest): string {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host');
  const proto = forwardedProto || 'https';
  const requestOrigin = `${proto}://${host}`;

  // If we're on localhost, prefer request origin so local dev works.
  const hostname = (host || '').split(':')[0]?.toLowerCase();
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  if (isLocalhost) return requestOrigin;

  // Otherwise, prefer env origin (forces vadiler.com in production).
  const envOrigin = getSiteOriginFromEnv();
  if (envOrigin) return envOrigin;

  return requestOrigin;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing env: GOOGLE_OAUTH_CLIENT_ID' },
      { status: 500 }
    );
  }

  const origin = getRequestOrigin(request);
  const redirectUri = `${origin}/api/auth/google/callback`;

  const redirectPath = sanitizeRedirectPath(request.nextUrl.searchParams.get('redirect'));

  const state = randomBase64Url(16);
  const codeVerifier = randomBase64Url(32);
  const codeChallenge = sha256Base64Url(codeVerifier);

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  const res = NextResponse.redirect(authUrl);

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60, // 10 minutes
  };

  res.cookies.set(OAUTH_COOKIE_STATE, state, cookieOptions);
  res.cookies.set(OAUTH_COOKIE_VERIFIER, codeVerifier, cookieOptions);
  res.cookies.set(OAUTH_COOKIE_REDIRECT, redirectPath, cookieOptions);

  return res;
}
