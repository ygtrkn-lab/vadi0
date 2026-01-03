import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseServer as supabase } from '@/lib/supabase/server-client';
import { hashOtpCode, isOtpCode, normalizeEmail, OTP_MAX_ATTEMPTS } from '@/lib/auth/otp';

export async function POST(request: NextRequest) {
  try {
    const sb: any = supabase;
    const body = await request.json();
    const otpId = String(body?.otpId || '').trim();
    const email = normalizeEmail(body?.email);
    const code = String(body?.code || '').trim();
    const newPassword = String(body?.newPassword || '');

    // Validate inputs
    if (!otpId || !email || !isOtpCode(code)) {
      return NextResponse.json({ error: 'Geçersiz doğrulama bilgisi.' }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Yeni şifre en az 6 karakter olmalıdır.' }, { status: 400 });
    }

    // Get OTP record
    const { data: otp, error: otpError } = await supabase
      .from('customer_email_otps')
      .select('*')
      .eq('id', otpId)
      .eq('email', email)
      .eq('purpose', 'password-reset')
      .single();

    if (otpError || !otp) {
      return NextResponse.json({ error: 'Doğrulama kodu bulunamadı.' }, { status: 400 });
    }

    // Check if already consumed
    if ((otp as any).consumed_at) {
      return NextResponse.json({ error: 'Bu kod zaten kullanıldı.' }, { status: 400 });
    }

    // Check expiry
    const expiresAt = new Date(String((otp as any).expires_at || '')).getTime();
    if (!expiresAt || Number.isNaN(expiresAt) || Date.now() > expiresAt) {
      return NextResponse.json({ error: 'Kodun süresi doldu. Lütfen tekrar deneyin.' }, { status: 400 });
    }

    // Check max attempts
    const attempts = Number((otp as any).attempts || 0);
    if (attempts >= OTP_MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Çok fazla deneme yapıldı. Lütfen yeni kod isteyin.' }, { status: 429 });
    }

    // Verify OTP code
    const expectedHash = String((otp as any).code_hash || '');
    const actualHash = hashOtpCode(code, email, 'password-reset');

    if (expectedHash !== actualHash) {
      // Increment attempts
      await sb
        .from('customer_email_otps')
        .update({ attempts: attempts + 1 })
        .eq('id', otpId);

      return NextResponse.json({ error: 'Doğrulama kodu hatalı.' }, { status: 401 });
    }

    // Mark OTP as consumed
    await sb
      .from('customer_email_otps')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', otpId);

    // Get customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email')
      .eq('email', email)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Müşteri bulunamadı.' }, { status: 404 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    const { error: updateError } = await supabase
      .from('customers')
      .update({ 
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', (customer as any).id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json({ error: 'Şifre güncellenemedi.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Şifreniz başarıyla güncellendi. Şimdi yeni şifrenizle giriş yapabilirsiniz.' 
    });
  } catch (error) {
    console.error('Error verifying password reset OTP:', error);
    return NextResponse.json({ error: 'Şifre sıfırlama doğrulaması yapılamadı.' }, { status: 500 });
  }
}
