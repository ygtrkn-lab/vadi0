import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { verifyCustomerSessionCookie } from '@/lib/auth/signedSession';
import { toCamelCase } from '@/lib/supabase/transformer';

const CUSTOMER_COOKIE = 'vadiler_customer_auth';

export async function GET(request: NextRequest) {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Missing env: AUTH_SESSION_SECRET' }, { status: 500 });
  }

  const token = request.cookies.get(CUSTOMER_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ customer: null });
  }

  const payload = verifyCustomerSessionCookie(secret, token);
  if (!payload) {
    return NextResponse.json({ customer: null });
  }

  const { data, error } = await supabaseServer
    .from('customers')
    .select('*')
    .eq('id', payload.customerId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching customer from session:', error);
    return NextResponse.json({ customer: null });
  }

  if (!data) return NextResponse.json({ customer: null });

  const { password: _pw, ...safe } = data as any;
  return NextResponse.json({ customer: toCamelCase(safe) });
}
