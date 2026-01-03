import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase/server-client';
import { toCamelCase } from '@/lib/supabase/transformer';
import { hashOtpCode, isOtpCode, normalizeEmail, OTP_MAX_ATTEMPTS } from '@/lib/auth/otp';

export async function POST(request: NextRequest) {
  try {
    const sb: any = supabase;
    const body = await request.json();
    const otpId = String(body?.otpId || '').trim();
    const email = normalizeEmail(body?.email);
    const code = String(body?.code || '').trim();

    if (!otpId || !email || !isOtpCode(code)) {
      return NextResponse.json({ error: 'Geçersiz doğrulama bilgisi.' }, { status: 400 });
    }

    const { data: otp, error: otpError } = await supabase
      .from('customer_email_otps')
      .select('*')
      .eq('id', otpId)
      .eq('email', email)
      .eq('purpose', 'login')
      .single();

    if (otpError || !otp) {
      return NextResponse.json({ error: 'Doğrulama kodu bulunamadı.' }, { status: 400 });
    }

    if ((otp as any).consumed_at) {
      return NextResponse.json({ error: 'Bu kod zaten kullanıldı.' }, { status: 400 });
    }

    const expiresAt = new Date(String((otp as any).expires_at || '')).getTime();
    if (!expiresAt || Number.isNaN(expiresAt) || Date.now() > expiresAt) {
      return NextResponse.json({ error: 'Kodun süresi doldu. Lütfen tekrar deneyin.' }, { status: 400 });
    }

    const attempts = Number((otp as any).attempts || 0);
    if (attempts >= OTP_MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Çok fazla deneme yapıldı. Lütfen yeni kod isteyin.' }, { status: 429 });
    }

    const expectedHash = String((otp as any).code_hash || '');
    const actualHash = hashOtpCode(code, email, 'login');

    if (expectedHash !== actualHash) {
      await sb
        .from('customer_email_otps')
        .update({ attempts: attempts + 1 })
        .eq('id', otpId);

      return NextResponse.json({ error: 'Doğrulama kodu hatalı.' }, { status: 401 });
    }

    await sb
      .from('customer_email_otps')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', otpId);

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Müşteri bulunamadı.' }, { status: 404 });
    }

    const { password: _pw, ...safeCustomer } = customer as any;

    return NextResponse.json({ customer: toCamelCase(safeCustomer) });
  } catch (error) {
    console.error('Error verifying customer login OTP:', error);
    return NextResponse.json({ error: 'Doğrulama yapılamadı.' }, { status: 500 });
  }
}
