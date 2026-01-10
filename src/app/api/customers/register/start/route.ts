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

export async function POST(request: NextRequest) {
  try {
    const sb: any = supabase;
    const body = await request.json();

    const email = normalizeEmail(body?.email);
    const name = String(body?.name || '').trim();
    const phone = String(body?.phone || '').trim();
    const password = String(body?.password || '');

    if (!email || !name || !phone || !password) {
      return NextResponse.json({ error: 'E-posta, ad soyad, telefon ve şifre gereklidir.' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Bu e-posta adresi zaten kayıtlı.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data: createdCustomer, error: createError } = await sb
      .from('customers')
      .insert([
        {
          email,
          name,
          phone,
          password: passwordHash,
          addresses: [],
          orders: [],
          favorites: [],
        },
      ])
      .select('id,email')
      .single();

    if (createError || !createdCustomer) {
      console.error('Error creating customer:', createError);
      return NextResponse.json({ error: 'Kayıt oluşturulamadı.' }, { status: 500 });
    }

    const nowIso = new Date().toISOString();

    const { data: existingOtp } = await sb
      .from('customer_email_otps')
      .select('*')
      .eq('email', email)
      .eq('purpose', 'register')
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
          purpose: 'register',
        },
        { status: 429 }
      );
    }

    const code = generateOtpCode();
    const codeHash = hashOtpCode(code, email, 'register');
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
            purpose: 'register',
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

    const result = await EmailService.sendCustomerOtpWithDetails({ to: email, code, purpose: 'register' });
    if (!result.success) {
      await sb.from('customers').delete().eq('id', (createdCustomer as any).id);
      
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
      purpose: 'register',
      ttlMinutes: OTP_TTL_MINUTES,
      maxAttempts: OTP_MAX_ATTEMPTS,
    });
  } catch (error) {
    console.error('Error starting customer register OTP:', error);
    return NextResponse.json({ error: 'Kayıt başlatılamadı.' }, { status: 500 });
  }
}
