import { NextRequest, NextResponse } from 'next/server';

const CUSTOMER_COOKIE = 'vadiler_customer_auth';

export async function POST(_request: NextRequest) {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(CUSTOMER_COOKIE);
  return res;
}
