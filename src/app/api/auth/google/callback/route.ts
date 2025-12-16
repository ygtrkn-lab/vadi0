import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { getSiteOriginFromEnv, sanitizeRedirectPath } from '@/lib/auth/googleOAuth';
import { signCustomerSessionCookie } from '@/lib/auth/signedSession';

const OAUTH_COOKIE_STATE = 'vadiler_google_oauth_state';
const OAUTH_COOKIE_VERIFIER = 'vadiler_google_oauth_verifier';
const OAUTH_COOKIE_REDIRECT = 'vadiler_google_oauth_redirect';

const CUSTOMER_COOKIE = 'vadiler_customer_auth';

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

async function ensureCustomer(args: { email: string; name?: string }) {
  // NOTE: Supabase generated types in this repo aren't fully compatible with supabase-js v2
  // (missing Relationships), so use an untyped client for inserts/selects here.
  const supabase = supabaseServer as any;

  const email = args.email.toLowerCase().trim();
  const name = (args.name || '').trim() || email.split('@')[0] || 'Müşteri';

  const { data: existing } = await supabase.from('customers').select('*').eq('email', email).maybeSingle();

  if (existing) return existing as any;

  const random = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;

  const { data: created, error } = await supabase
    .from('customers')
    .insert([
      {
        email,
        name,
        // Current schema requires phone/password NOT NULL.
        phone: '5000000000',
        password: `oauth_${random}`,
        addresses: [],
        orders: [],
        favorites: [],
      },
    ])
    .select('*')
    .single();

  if (error) {
    // Race condition fallback
    const { data: again } = await supabase.from('customers').select('*').eq('email', email).maybeSingle();

    if (again) return again as any;

    throw error;
  }

  return created as any;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const sessionSecret = process.env.AUTH_SESSION_SECRET;

  if (!clientId || !clientSecret || !sessionSecret) {
    return NextResponse.json(
      { error: 'Missing env: GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / AUTH_SESSION_SECRET' },
      { status: 500 }
    );
  }

  const origin = getRequestOrigin(request);
  const redirectUri = `${origin}/api/auth/google/callback`;

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');

  const stateCookie = request.cookies.get(OAUTH_COOKIE_STATE)?.value;
  const verifier = request.cookies.get(OAUTH_COOKIE_VERIFIER)?.value;
  const redirectCookie = request.cookies.get(OAUTH_COOKIE_REDIRECT)?.value;
  const redirectPath = sanitizeRedirectPath(redirectCookie);

  if (!code || !state || !stateCookie || state !== stateCookie || !verifier) {
    const res = NextResponse.redirect(`${origin}/giris?error=google_oauth_failed`);
    res.cookies.delete(OAUTH_COOKIE_STATE);
    res.cookies.delete(OAUTH_COOKIE_VERIFIER);
    res.cookies.delete(OAUTH_COOKIE_REDIRECT);
    return res;
  }

  // Exchange code for tokens
  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResp.ok) {
    const res = NextResponse.redirect(`${origin}/giris?error=google_oauth_token`);
    res.cookies.delete(OAUTH_COOKIE_STATE);
    res.cookies.delete(OAUTH_COOKIE_VERIFIER);
    res.cookies.delete(OAUTH_COOKIE_REDIRECT);
    return res;
  }

  const tokenJson = (await tokenResp.json()) as any;
  const accessToken = tokenJson?.access_token as string | undefined;

  if (!accessToken) {
    const res = NextResponse.redirect(`${origin}/giris?error=google_oauth_no_token`);
    res.cookies.delete(OAUTH_COOKIE_STATE);
    res.cookies.delete(OAUTH_COOKIE_VERIFIER);
    res.cookies.delete(OAUTH_COOKIE_REDIRECT);
    return res;
  }

  // Fetch userinfo
  const userInfoResp = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userInfoResp.ok) {
    const res = NextResponse.redirect(`${origin}/giris?error=google_oauth_userinfo`);
    res.cookies.delete(OAUTH_COOKIE_STATE);
    res.cookies.delete(OAUTH_COOKIE_VERIFIER);
    res.cookies.delete(OAUTH_COOKIE_REDIRECT);
    return res;
  }

  const userInfo = (await userInfoResp.json()) as any;
  const email = String(userInfo?.email || '').toLowerCase().trim();
  const emailVerified = Boolean(userInfo?.email_verified);
  const name = String(userInfo?.name || userInfo?.given_name || '').trim();

  if (!email || !emailVerified) {
    const res = NextResponse.redirect(`${origin}/giris?error=google_oauth_email`);
    res.cookies.delete(OAUTH_COOKIE_STATE);
    res.cookies.delete(OAUTH_COOKIE_VERIFIER);
    res.cookies.delete(OAUTH_COOKIE_REDIRECT);
    return res;
  }

  try {
    const customer = await ensureCustomer({ email, name });

    const payload = {
      customerId: String(customer.id),
      email: String(customer.email),
      issuedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };

    const token = signCustomerSessionCookie(sessionSecret, payload);

    const res = NextResponse.redirect(`${origin}${redirectPath === '/giris' ? '/giris?oauth=google' : redirectPath}`);

    // Clear oauth cookies
    res.cookies.delete(OAUTH_COOKIE_STATE);
    res.cookies.delete(OAUTH_COOKIE_VERIFIER);
    res.cookies.delete(OAUTH_COOKIE_REDIRECT);

    res.cookies.set(CUSTOMER_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (e) {
    console.error('Google OAuth customer ensure failed:', e);
    const res = NextResponse.redirect(`${origin}/giris?error=google_oauth_customer`);
    res.cookies.delete(OAUTH_COOKIE_STATE);
    res.cookies.delete(OAUTH_COOKIE_VERIFIER);
    res.cookies.delete(OAUTH_COOKIE_REDIRECT);
    return res;
  }
}
