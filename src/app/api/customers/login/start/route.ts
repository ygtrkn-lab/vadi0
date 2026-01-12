import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseServer as supabase } from '@/lib/supabase/server-client';
import { EmailService } from '@/lib/email/emailService';
import {
  canResend,
  expiresAtFromNowIso,
  generateOtpCode,
  hashOtpCode,
  normalizeEmail,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_MINUTES,
} from '@/lib/auth/otp';

function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value || '');
}

async function isPasswordValid(inputPassword: string, storedPassword: string): Promise<boolean> {
  if (!storedPassword) return false;
  if (isBcryptHash(storedPassword)) {
    return bcrypt.compare(inputPassword, storedPassword);
  }
  return storedPassword === inputPassword;
}

export async function POST(request: NextRequest) {
  try {
    const sb: any = supabase;
    const body = await request.json();
    const email = normalizeEmail(body?.email);
    const password = String(body?.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre gereklidir.' }, { status: 400 });
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'E-posta veya şifre hatalı.' }, { status: 401 });
    }

    const ok = await isPasswordValid(password, String((customer as any).password || ''));
    if (!ok) {
      return NextResponse.json({ error: 'E-posta veya şifre hatalı.' }, { status: 401 });
    }

    // Optional: if schema has is_active and user is disabled
    if (typeof (customer as any).is_active !== 'undefined' && (customer as any).is_active === false) {
      return NextResponse.json({ error: 'Hesabınız pasif durumda. Lütfen destek ile iletişime geçin.' }, { status: 403 });
    }

    const nowIso = new Date().toISOString();

    const { data: existingOtp } = await sb
      .from('customer_email_otps')
      .select('*')
      .eq('email', email)
      .eq('purpose', 'login')
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingOtp && !canResend((existingOtp as any).last_sent_at || null)) {
      return NextResponse.json(
        {
          error: `Lütfen yeni kod istemeden önce ${OTP_RESEND_COOLDOWN_SECONDS} saniye bekleyin.`,
          otpRequired: true,
          otpId: (existingOtp as any).id,
          email,
          purpose: 'login',
        },
        { status: 429 }
      );
    }

    const code = generateOtpCode();
    const codeHash = hashOtpCode(code, email, 'login');
    const expiresAt = expiresAtFromNowIso();

    let otpId: string;

    if (existingOtp) {
      const { data: updated, error: updateError } = await sb
        .from('customer_email_otps')
        .update({
          code_hash: codeHash,
          attempts: 0,
          last_sent_at: nowIso,
          expires_at: expiresAt,
          consumed_at: null,
        })
        .eq('id', (existingOtp as any).id)
        .select('id')
        .single();

      if (updateError || !updated) {
        return NextResponse.json({ error: 'Doğrulama kodu oluşturulamadı.' }, { status: 500 });
      }

      otpId = (updated as any).id;
    } else {
      const { data: inserted, error: insertError } = await sb
        .from('customer_email_otps')
        .insert([
          {
            email,
            purpose: 'login',
            code_hash: codeHash,
            attempts: 0,
            last_sent_at: nowIso,
            expires_at: expiresAt,
          },
        ])
        .select('id')
        .single();

      if (insertError || !inserted) {
        return NextResponse.json({ error: 'Doğrulama kodu oluşturulamadı.' }, { status: 500 });
      }

      otpId = (inserted as any).id;
    }

    const result = await EmailService.sendCustomerOtpWithDetails({ to: email, code, purpose: 'login' });
    if (!result.success) {
      // Geçersiz e-posta adresi durumunda kullanıcı dostu mesaj
      const errorMessage = result.errorCode === 'INVALID_EMAIL' 
        ? 'Girdiğiniz e-posta adresine kod gönderilemedi. E-posta adresinizi kontrol edip tekrar deneyin.'
        : 'E-posta gönderilemedi. Lütfen tekrar deneyin.';
      
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json({
      otpRequired: true,
      otpId,
      email,
      purpose: 'login',
      ttlMinutes: OTP_TTL_MINUTES,
      maxAttempts: OTP_MAX_ATTEMPTS,
    });
  } catch (error) {
    console.error('Error starting customer login OTP:', error);
    return NextResponse.json({ error: 'Giriş başlatılamadı.' }, { status: 500 });
  }
}
