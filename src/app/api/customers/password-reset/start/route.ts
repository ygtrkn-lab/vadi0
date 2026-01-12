import { NextRequest, NextResponse } from 'next/server';
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

    if (!email) {
      return NextResponse.json({ error: 'E-posta adresi gereklidir.' }, { status: 400 });
    }

    // Check if customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email')
      .eq('email', email)
      .single();

    // Security: Always return success message even if email doesn't exist
    // This prevents email enumeration attacks
    if (customerError || !customer) {
      // Still return success to hide whether email exists
      return NextResponse.json({
        success: true,
        message: 'Eğer bu e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama kodu gönderilecektir.',
      });
    }

    const nowIso = new Date().toISOString();

    // Check for existing unconsumed OTP
    const { data: existingOtp } = await sb
      .from('customer_email_otps')
      .select('*')
      .eq('email', email)
      .eq('purpose', 'password-reset')
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check cooldown period
    if (existingOtp && !canResend((existingOtp as any).last_sent_at || null)) {
      return NextResponse.json(
        {
          error: `Lütfen yeni kod istemeden önce ${OTP_RESEND_COOLDOWN_SECONDS} saniye bekleyin.`,
          otpRequired: true,
          otpId: (existingOtp as any).id,
          email,
          purpose: 'password-reset',
        },
        { status: 429 }
      );
    }

    // Generate new OTP code
    const code = generateOtpCode();
    const codeHash = hashOtpCode(code, email, 'password-reset');
    const expiresAt = expiresAtFromNowIso();

    let otpId: string;

    // Update existing OTP or create new one
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
            purpose: 'password-reset',
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

    // Send OTP email
    const result = await EmailService.sendCustomerOtpWithDetails({ to: email, code, purpose: 'password-reset' });
    if (!result.success) {
      // Geçersiz e-posta adresi durumunda kullanıcı dostu mesaj
      const errorMessage = result.errorCode === 'INVALID_EMAIL' 
        ? 'Girdiğiniz e-posta adresine kod gönderilemedi. E-posta adresinizi kontrol edip tekrar deneyin.'
        : 'E-posta gönderilemedi. Lütfen tekrar deneyin.';
      
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      otpRequired: true,
      otpId,
      email,
      purpose: 'password-reset',
      ttlMinutes: OTP_TTL_MINUTES,
      maxAttempts: OTP_MAX_ATTEMPTS,
      message: 'Şifre sıfırlama kodu e-posta adresinize gönderildi.',
    });
  } catch (error) {
    console.error('Error starting password reset:', error);
    return NextResponse.json({ error: 'Şifre sıfırlama işlemi başlatılamadı.' }, { status: 500 });
  }
}
