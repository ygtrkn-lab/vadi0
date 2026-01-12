import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

// E-posta gönderim sonucu için detaylı arayüz
export interface EmailSendResult {
  success: boolean;
  error?: string;
  errorCode?: 'INVALID_EMAIL' | 'SMTP_ERROR' | 'CONNECTION_ERROR' | 'UNKNOWN';
  messageId?: string;
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  verificationType?: 'email' | 'phone';
  verificationValue?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  discount?: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  district?: string;
  deliveryDate: string;
  deliveryTime: string;
  recipientName?: string;
  recipientPhone?: string;
  paymentMethod?: string;
}

export class EmailService {
  private static transporter: Transporter | null = null;

  private static getSiteUrl(): string {
    const raw =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      process.env.NEXT_PUBLIC_VERCEL_URL ||
      '';

    const trimmed = raw.trim();
    if (!trimmed) return 'https://vadiler.com';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed.replace(/\/$/, '');
    return `https://${trimmed}`.replace(/\/$/, '');
  }

  private static buildTrackingUrl(params: {
    orderNumber: string;
    verificationType?: 'email' | 'phone';
    verificationValue?: string;
  }): string {
    const siteUrl = this.getSiteUrl();
    const trackingParams = new URLSearchParams();
    trackingParams.set('order', params.orderNumber);

    const vType = params.verificationType;
    const vValue = (params.verificationValue || '').trim();
    if ((vType === 'email' || vType === 'phone') && vValue) {
      trackingParams.set('vtype', vType);
      trackingParams.set('v', vValue);
    }

    return `${siteUrl}/siparis-takip?${trackingParams.toString()}`;
  }

  /**
   * Get or create email transporter
   */
  private static getTransporter(): Transporter {
    if (this.transporter) {
      console.log('♻️ Using cached transporter');
      return this.transporter;
    }

    console.log('🔧 Creating new email transporter');
    const port = parseInt(process.env.SMTP_PORT || '465');
    const secure = typeof process.env.SMTP_SECURE === 'string'
      ? process.env.SMTP_SECURE === 'true'
      : port === 465;

    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'eposta.ni.net.tr',
      port,
      secure,
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASSWORD || '',
    };

    console.log('📧 Transporter config:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      hasUser: !!config.user,
      hasPassword: !!config.password,
      userLength: config.user.length,
      passwordLength: config.password.length
    });

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      },
      debug: process.env.SMTP_DEBUG === 'true',
      logger: process.env.SMTP_DEBUG === 'true'
    });

    console.log('✅ Transporter created');
    return this.transporter;
  }

  /**
   * E-posta gönderim hatasını analiz et ve kullanıcı dostu hata kodu döndür
   */
  private static analyzeEmailError(error: unknown): { errorCode: EmailSendResult['errorCode']; message: string } {
    const err = error as { message?: string; code?: string; responseCode?: number } | null;
    const errorMessage = err?.message?.toLowerCase() || '';
    const errorCode = err?.code?.toLowerCase() || '';
    const responseCode = err?.responseCode || 0;
    
    // Geçersiz alıcı adresi hataları (SMTP 550, 553, 554 vb.)
    if (
      responseCode === 550 || 
      responseCode === 553 || 
      responseCode === 554 ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('does not exist') ||
      errorMessage.includes('user unknown') ||
      errorMessage.includes('no such user') ||
      errorMessage.includes('mailbox not found') ||
      errorMessage.includes('recipient rejected') ||
      errorMessage.includes('undeliverable') ||
      errorMessage.includes('invalid recipient') ||
      errorMessage.includes('address rejected')
    ) {
      return {
        errorCode: 'INVALID_EMAIL',
        message: 'Bu e-posta adresine mesaj gönderilemedi. Lütfen e-posta adresinizi kontrol edin.'
      };
    }
    
    // Bağlantı hataları
    if (
      errorCode === 'econnrefused' ||
      errorCode === 'etimedout' ||
      errorCode === 'enotfound' ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout')
    ) {
      return {
        errorCode: 'CONNECTION_ERROR',
        message: 'E-posta sunucusuna bağlanılamadı. Lütfen daha sonra tekrar deneyin.'
      };
    }
    
    // SMTP sunucu hataları
    if (responseCode >= 500 && responseCode < 600) {
      return {
        errorCode: 'SMTP_ERROR',
        message: 'E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin.'
      };
    }
    
    return {
      errorCode: 'UNKNOWN',
      message: 'E-posta gönderilemedi. Lütfen tekrar deneyin.'
    };
  }

  /**
   * Send a generic email
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    const result = await this.sendEmailWithDetails(options);
    return result.success;
  }

  /**
   * Send email with detailed result (including error info)
   */
  static async sendEmailWithDetails(options: EmailOptions): Promise<EmailSendResult> {
    try {
      const transporter = this.getTransporter();
      const from = process.env.SMTP_USER || 'bilgi@vadiler.com';

      console.log('📧 Attempting to send email to:', options.to);
      console.log('📧 SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        secure: process.env.SMTP_SECURE
      });

      const result = await transporter.sendMail({
        from: `Vadiler Çiçekçilik <${from}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log('✅ Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email sending error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      const analyzed = this.analyzeEmailError(error);
      return {
        success: false,
        error: analyzed.message,
        errorCode: analyzed.errorCode
      };
    }
  }

  /**
   * Send customer OTP for post-password verification
   */
  static async sendCustomerOtp(params: {
    to: string;
    code: string;
    purpose: 'login' | 'register' | 'password-reset';
  }): Promise<boolean> {
    const siteUrl = this.getSiteUrl();
    const logoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159827/branding/vadiler-logo.png';
    const brandLogoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159828/branding/vadiler-logo-band.png';
    
    let purposeLabel = '';
    let title = '';
    let emoji = '';
    
    switch (params.purpose) {
      case 'register':
        purposeLabel = 'Kayıt';
        title = 'Kayıt işleminizi tamamlayın';
        emoji = '🌸';
        break;
      case 'login':
        purposeLabel = 'Giriş';
        title = 'Hesabınıza giriş yapın';
        emoji = '🔐';
        break;
      case 'password-reset':
        purposeLabel = 'Şifre Sıfırlama';
        title = 'Şifrenizi sıfırlayın';
        emoji = '🔑';
        break;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="color-scheme" content="light">
          <meta name="supported-color-schemes" content="light">
          <title>${title}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
            <tr>
              <td align="center" style="padding: 0;">
                
                <!-- Container -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; margin: 0 auto;">
                  
                  <!-- Logo Section -->
                  <tr>
                    <td align="center" style="padding: 48px 24px 40px 24px;">
                      <a href="${siteUrl}" style="text-decoration: none;">
                        <img src="${logoUrl}" alt="Vadiler Çiçekçilik" width="180" style="display: block; border: 0; height: auto; max-width: 180px;" />
                      </a>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 0 24px;">
                      
                      <!-- Headline -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 0 0 24px 0;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.5px; line-height: 1.2;">
                              ${title}
                            </h1>
                            <p style="margin: 12px 0 0 0; font-size: 17px; color: #86868b; font-weight: 400; line-height: 1.5;">
                              Aşağıdaki doğrulama kodunu kullanın
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- OTP Code Card -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; border-radius: 16px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 32px 24px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td align="center">
                                  <p style="margin: 0 0 16px 0; font-size: 40px;">${emoji}</p>
                                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Doğrulama Kodu</p>
                                  <p style="margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1d1d1f; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">${params.code}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Timer Notice -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                        <tr>
                          <td style="background-color: #f0f9ff; border-radius: 12px; padding: 16px 20px;">
                            <p style="margin: 0; font-size: 14px; color: #3b82f6; font-weight: 500; text-align: center;">
                              ⏱️ Bu kod 10 dakika içinde geçerliliğini yitirecektir
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Security Notice -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0; font-size: 14px; color: #86868b; line-height: 1.6;">
                              Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.<br/>
                              Hesabınız güvende, herhangi bir işlem yapmanıza gerek yok.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Help -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0; font-size: 14px; color: #86868b; line-height: 1.6;">
                              Yardıma mı ihtiyacınız var? <a href="tel:08503074876" style="color: #1d1d1f; text-decoration: none; font-weight: 500;">0850 307 4876</a>
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px 24px 48px 24px; border-top: 1px solid #f5f5f7;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding-bottom: 24px;">
                            <img src="${brandLogoUrl}" alt="Vadiler Çiçekçilik" width="210" style="display: block; border: 0; height: auto; max-width: 210px;" />
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 12px 0; font-size: 12px; color: #86868b;">
                              <a href="${siteUrl}/iletisim" style="color: #06c; text-decoration: none;">İletişim</a>
                              <span style="color: #d2d2d7; padding: 0 8px;">|</span>
                              <a href="${siteUrl}" style="color: #06c; text-decoration: none;">vadiler.com</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #86868b;">
                              © ${new Date().getFullYear()} Vadiler Çiçekçilik
                            </p>
                            <p style="margin: 8px 0 0 0; font-size: 11px; color: #86868b;">
                              Bu email ${params.to} adresine gönderilmiştir.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
                <!-- End Container -->

              </td>
            </tr>
          </table>

        </body>
      </html>
    `;

    return this.sendEmail({
      to: params.to,
      subject: `${emoji} Vadiler ${purposeLabel} Doğrulama Kodu`,
      html,
      text: `Vadiler ${purposeLabel} doğrulama kodunuz: ${params.code} (10 dakika geçerli)`,
    });
  }

  /**
   * Send customer OTP with detailed result (for error handling)
   */
  static async sendCustomerOtpWithDetails(params: {
    to: string;
    code: string;
    purpose: 'login' | 'register' | 'password-reset';
  }): Promise<EmailSendResult> {
    const siteUrl = this.getSiteUrl();
    const logoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159827/branding/vadiler-logo.png';
    const brandLogoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159828/branding/vadiler-logo-band.png';
    
    let purposeLabel = '';
    let title = '';
    let emoji = '';
    
    switch (params.purpose) {
      case 'register':
        purposeLabel = 'Kayıt';
        title = 'Kayıt işleminizi tamamlayın';
        emoji = '🌸';
        break;
      case 'login':
        purposeLabel = 'Giriş';
        title = 'Hesabınıza giriş yapın';
        emoji = '🔐';
        break;
      case 'password-reset':
        purposeLabel = 'Şifre Sıfırlama';
        title = 'Şifrenizi sıfırlayın';
        emoji = '🔑';
        break;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="color-scheme" content="light">
          <meta name="supported-color-schemes" content="light">
          <title>${title}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
            <tr>
              <td align="center" style="padding: 0;">
                
                <!-- Container -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; margin: 0 auto;">
                  
                  <!-- Logo Section -->
                  <tr>
                    <td align="center" style="padding: 48px 24px 40px 24px;">
                      <a href="${siteUrl}" style="text-decoration: none;">
                        <img src="${logoUrl}" alt="Vadiler Çiçekçilik" width="180" style="display: block; border: 0; height: auto; max-width: 180px;" />
                      </a>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 0 24px;">
                      
                      <!-- Headline -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 0 0 24px 0;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.5px; line-height: 1.2;">
                              ${title}
                            </h1>
                            <p style="margin: 12px 0 0 0; font-size: 17px; color: #86868b; font-weight: 400; line-height: 1.5;">
                              Aşağıdaki doğrulama kodunu kullanın
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- OTP Code Card -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; border-radius: 16px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 32px 24px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td align="center">
                                  <p style="margin: 0 0 16px 0; font-size: 40px;">${emoji}</p>
                                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Doğrulama Kodu</p>
                                  <p style="margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1d1d1f; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">${params.code}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Timer Notice -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                        <tr>
                          <td style="background-color: #f0f9ff; border-radius: 12px; padding: 16px 20px;">
                            <p style="margin: 0; font-size: 14px; color: #3b82f6; font-weight: 500; text-align: center;">
                              ⏱️ Bu kod 10 dakika içinde geçerliliğini yitirecektir
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Security Notice -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0; font-size: 14px; color: #86868b; line-height: 1.6;">
                              Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.<br/>
                              Hesabınız güvende, herhangi bir işlem yapmanıza gerek yok.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Help -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0; font-size: 14px; color: #86868b; line-height: 1.6;">
                              Yardıma mı ihtiyacınız var? <a href="tel:08503074876" style="color: #1d1d1f; text-decoration: none; font-weight: 500;">0850 307 4876</a>
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px 24px 48px 24px; border-top: 1px solid #f5f5f7;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding-bottom: 24px;">
                            <img src="${brandLogoUrl}" alt="Vadiler Çiçekçilik" width="210" style="display: block; border: 0; height: auto; max-width: 210px;" />
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 12px 0; font-size: 12px; color: #86868b;">
                              <a href="${siteUrl}/iletisim" style="color: #06c; text-decoration: none;">İletişim</a>
                              <span style="color: #d2d2d7; padding: 0 8px;">|</span>
                              <a href="${siteUrl}" style="color: #06c; text-decoration: none;">vadiler.com</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #86868b;">
                              © ${new Date().getFullYear()} Vadiler Çiçekçilik
                            </p>
                            <p style="margin: 8px 0 0 0; font-size: 11px; color: #86868b;">
                              Bu email ${params.to} adresine gönderilmiştir.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
                <!-- End Container -->

              </td>
            </tr>
          </table>

        </body>
      </html>
    `;

    return this.sendEmailWithDetails({
      to: params.to,
      subject: `${emoji} Vadiler ${purposeLabel} Doğrulama Kodu`,
      html,
      text: `Vadiler ${purposeLabel} doğrulama kodunuz: ${params.code} (10 dakika geçerli)`,
    });
  }

  /**
   * Send order confirmation email
   */
  static async sendOrderConfirmation(data: OrderEmailData): Promise<boolean> {
    const siteUrl = this.getSiteUrl();
    const logoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159827/branding/vadiler-logo.png';
    const brandLogoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159828/branding/vadiler-logo-band.png';
    
    const trackingUrl = this.buildTrackingUrl({
      orderNumber: data.orderNumber,
      verificationType: data.verificationType,
      verificationValue: data.verificationValue,
    });

    // Apple tarzı minimalist ürün kartları
    const itemsHtml = data.items.map(item => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
        <tr>
          <td style="padding-left: 0; vertical-align: top;">
            <p style="margin: 0; font-size: 15px; font-weight: 500; color: #1d1d1f; line-height: 1.3;">${item.name}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #86868b;">Adet: ${item.quantity}</p>
          </td>
          <td align="right" style="vertical-align: top;">
            <p style="margin: 0; font-size: 15px; font-weight: 500; color: #1d1d1f;">${(item.price * item.quantity).toLocaleString('tr-TR')} ₺</p>
          </td>
        </tr>
      </table>
    `).join('');

    const safeCustomerPhone = (data.customerPhone || '').trim();
    const safeRecipientName = (data.recipientName || '').trim();
    const safeRecipientPhone = (data.recipientPhone || '').trim();
    const safeDistrict = (data.district || '').trim();
    const discount = typeof data.discount === 'number' ? data.discount : 0;
    const showDiscount = discount > 0;
    const paymentMethod = (data.paymentMethod || '').trim();

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="color-scheme" content="light">
          <meta name="supported-color-schemes" content="light">
          <title>Siparişiniz Alındı</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
            <tr>
              <td align="center" style="padding: 0;">
                
                <!-- Container -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; margin: 0 auto;">
                  
                  <!-- Logo Section -->
                  <tr>
                    <td align="center" style="padding: 48px 24px 40px 24px;">
                      <a href="${siteUrl}" style="text-decoration: none;">
                        <img src="${logoUrl}" alt="Vadiler Çiçekçilik" width="180" style="display: block; border: 0; height: auto; max-width: 180px;" />
                      </a>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 0 24px;">
                      
                      <!-- Success Badge -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                        <tr>
                          <td style="background-color: #ecfdf5; border-radius: 12px; padding: 16px 20px;">
                            <p style="margin: 0; font-size: 14px; color: #10b981; font-weight: 500; text-align: center;">
                              ✓ Siparişiniz başarıyla alındı
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Headline -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 0 0 24px 0;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.5px; line-height: 1.2;">
                              Teşekkürler, ${data.customerName.split(' ')[0]}!
                            </h1>
                            <p style="margin: 12px 0 0 0; font-size: 17px; color: #86868b; font-weight: 400; line-height: 1.5;">
                              Siparişinizi en kısa sürede hazırlayacağız
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Order Card -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; border-radius: 16px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 24px;">
                            
                            <!-- Order Header -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                              <tr>
                                <td>
                                  <p style="margin: 0; font-size: 13px; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Sipariş</p>
                                  <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 600; color: #1d1d1f;">#${data.orderNumber}</p>
                                </td>
                                <td align="right">
                                  <p style="margin: 0; font-size: 13px; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Teslimat</p>
                                  <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 600; color: #1d1d1f;">${data.deliveryDate}</p>
                                </td>
                              </tr>
                            </table>

                            <!-- Divider -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="border-top: 1px solid #d2d2d7; padding-top: 20px;"></td>
                              </tr>
                            </table>

                            <!-- Products -->
                            ${itemsHtml}

                            <!-- Pricing -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; border-top: 1px solid #d2d2d7; padding-top: 20px;">
                              <tr>
                                <td style="padding: 4px 0;">
                                  <p style="margin: 0; font-size: 14px; color: #86868b;">Ara Toplam</p>
                                </td>
                                <td align="right" style="padding: 4px 0;">
                                  <p style="margin: 0; font-size: 14px; color: #1d1d1f;">${data.subtotal.toLocaleString('tr-TR')} ₺</p>
                                </td>
                              </tr>
                              ${showDiscount ? `
                              <tr>
                                <td style="padding: 4px 0;">
                                  <p style="margin: 0; font-size: 14px; color: #10b981;">İndirim</p>
                                </td>
                                <td align="right" style="padding: 4px 0;">
                                  <p style="margin: 0; font-size: 14px; color: #10b981;">-${discount.toLocaleString('tr-TR')} ₺</p>
                                </td>
                              </tr>
                              ` : ''}
                              <tr>
                                <td style="padding: 4px 0;">
                                  <p style="margin: 0; font-size: 14px; color: #86868b;">Teslimat</p>
                                </td>
                                <td align="right" style="padding: 4px 0;">
                                  <p style="margin: 0; font-size: 14px; color: ${data.deliveryFee === 0 ? '#10b981' : '#1d1d1f'};">${data.deliveryFee === 0 ? 'Ücretsiz' : data.deliveryFee.toLocaleString('tr-TR') + ' ₺'}</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0 0 0;">
                                  <p style="margin: 0; font-size: 17px; font-weight: 600; color: #1d1d1f;">Toplam</p>
                                </td>
                                <td align="right" style="padding: 12px 0 0 0;">
                                  <p style="margin: 0; font-size: 24px; font-weight: 700; color: #1d1d1f;">${data.total.toLocaleString('tr-TR')} ₺</p>
                                </td>
                              </tr>
                            </table>

                          </td>
                        </tr>
                      </table>

                      <!-- Delivery Info Card -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; border-radius: 16px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 24px;">
                            <p style="margin: 0 0 16px 0; font-size: 13px; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Teslimat Bilgileri</p>
                            
                            ${safeRecipientName ? `
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                              <tr>
                                <td style="padding: 4px 0; color: #86868b; font-size: 14px; width: 80px;">Alıcı</td>
                                <td style="padding: 4px 0; color: #1d1d1f; font-size: 14px; font-weight: 500;">${safeRecipientName}${safeRecipientPhone ? ` • ${safeRecipientPhone}` : ''}</td>
                              </tr>
                            </table>
                            ` : ''}
                            
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                              <tr>
                                <td style="padding: 4px 0; color: #86868b; font-size: 14px; width: 80px;">Adres</td>
                                <td style="padding: 4px 0; color: #1d1d1f; font-size: 14px; font-weight: 500;">${data.deliveryAddress}${safeDistrict ? `, ${safeDistrict}` : ''}</td>
                              </tr>
                            </table>
                            
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="padding: 4px 0; color: #86868b; font-size: 14px; width: 80px;">Zaman</td>
                                <td style="padding: 4px 0; color: #1d1d1f; font-size: 14px; font-weight: 500;">${data.deliveryDate} • ${data.deliveryTime}</td>
                              </tr>
                            </table>

                            ${paymentMethod ? `
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 12px;">
                              <tr>
                                <td style="padding: 4px 0; color: #86868b; font-size: 14px; width: 80px;">Ödeme</td>
                                <td style="padding: 4px 0; color: #1d1d1f; font-size: 14px; font-weight: 500;">${paymentMethod}</td>
                              </tr>
                            </table>
                            ` : ''}
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <a href="${trackingUrl}" style="display: inline-block; background-color: #1d1d1f; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 980px; font-size: 17px; font-weight: 500; letter-spacing: -0.2px;">
                              Siparişimi Takip Et
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Help -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0; font-size: 14px; color: #86868b; line-height: 1.6;">
                              Sorularınız için <a href="tel:08503074876" style="color: #1d1d1f; text-decoration: none; font-weight: 500;">0850 307 4876</a>
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px 24px 48px 24px; border-top: 1px solid #f5f5f7;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding-bottom: 24px;">
                            <img src="${brandLogoUrl}" alt="Vadiler Çiçekçilik" width="210" style="display: block; border: 0; height: auto; max-width: 210px;" />
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 12px 0; font-size: 12px; color: #86868b;">
                              <a href="${trackingUrl}" style="color: #06c; text-decoration: none;">Siparişi Takip Et</a>
                              <span style="color: #d2d2d7; padding: 0 8px;">|</span>
                              <a href="${siteUrl}/iletisim" style="color: #06c; text-decoration: none;">İletişim</a>
                              <span style="color: #d2d2d7; padding: 0 8px;">|</span>
                              <a href="${siteUrl}" style="color: #06c; text-decoration: none;">vadiler.com</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #86868b;">
                              © ${new Date().getFullYear()} Vadiler Çiçekçilik
                            </p>
                            <p style="margin: 8px 0 0 0; font-size: 11px; color: #86868b;">
                              Bu email ${data.customerEmail} adresine gönderilmiştir.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
                <!-- End Container -->

              </td>
            </tr>
          </table>

        </body>
      </html>
    `;

    return this.sendEmail({
      to: data.customerEmail,
      subject: `✓ Siparişiniz Alındı - #${data.orderNumber}`,
      html,
      text: `Siparişiniz alındı! Sipariş No: ${data.orderNumber}. Sipariş takibi: ${trackingUrl}`,
    });
  }

  /**
   * Send shipping notification email
   */
  static async sendShippingNotification(
    customerEmail: string,
    customerName: string,
    orderNumber: string
  ): Promise<boolean> {
    const siteUrl = this.getSiteUrl();
    const logoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159827/branding/vadiler-logo.png';
    const brandLogoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159828/branding/vadiler-logo-band.png';
    
    const trackingUrl = this.buildTrackingUrl({
      orderNumber,
      verificationType: 'email',
      verificationValue: customerEmail,
    });

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="color-scheme" content="light">
          <meta name="supported-color-schemes" content="light">
          <title>Siparişiniz Yola Çıktı</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
            <tr>
              <td align="center" style="padding: 0;">
                
                <!-- Container -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; margin: 0 auto;">
                  
                  <!-- Logo Section -->
                  <tr>
                    <td align="center" style="padding: 48px 24px 40px 24px;">
                      <a href="${siteUrl}" style="text-decoration: none;">
                        <img src="${logoUrl}" alt="Vadiler Çiçekçilik" width="180" style="display: block; border: 0; height: auto; max-width: 180px;" />
                      </a>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 0 24px;">
                      
                      <!-- Headline -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 0 0 24px 0;">
                            <p style="margin: 0 0 16px 0; font-size: 64px;">🚚</p>
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.5px; line-height: 1.2;">
                              Siparişiniz yola çıktı!
                            </h1>
                            <p style="margin: 12px 0 0 0; font-size: 17px; color: #86868b; font-weight: 400; line-height: 1.5;">
                              Çiçekleriniz size doğru yola çıktı
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Status Card -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ecfdf5; border-radius: 16px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 24px;">
                            
                            <!-- Order Info -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td>
                                  <p style="margin: 0; font-size: 13px; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Sipariş No</p>
                                  <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 600; color: #065f46;">#${orderNumber}</p>
                                </td>
                                <td align="right">
                                  <p style="margin: 0; font-size: 13px; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Durum</p>
                                  <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 600; color: #065f46;">📦 Yolda</p>
                                </td>
                              </tr>
                            </table>

                            <!-- Divider -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
                              <tr>
                                <td style="border-top: 1px solid #86efac;"></td>
                              </tr>
                            </table>

                            <p style="margin: 0; font-size: 14px; color: #065f46; line-height: 1.6;">
                              Merhaba ${customerName.split(' ')[0]}, harika haber! Çiçekleriniz özenle paketlendi ve size doğru yola çıktı. Teslimat sırasında herhangi bir sorun yaşarsanız lütfen bizimle iletişime geçin.
                            </p>

                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <a href="${trackingUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 980px; font-size: 17px; font-weight: 500; letter-spacing: -0.2px;">
                              Teslimatı Takip Et
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Help -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0; font-size: 14px; color: #86868b; line-height: 1.6;">
                              Sorularınız için <a href="tel:08503074876" style="color: #1d1d1f; text-decoration: none; font-weight: 500;">0850 307 4876</a>
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px 24px 48px 24px; border-top: 1px solid #f5f5f7;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding-bottom: 24px;">
                            <img src="${brandLogoUrl}" alt="Vadiler Çiçekçilik" width="210" style="display: block; border: 0; height: auto; max-width: 210px;" />
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 12px 0; font-size: 12px; color: #86868b;">
                              <a href="${trackingUrl}" style="color: #06c; text-decoration: none;">Siparişi Takip Et</a>
                              <span style="color: #d2d2d7; padding: 0 8px;">|</span>
                              <a href="${siteUrl}/iletisim" style="color: #06c; text-decoration: none;">İletişim</a>
                              <span style="color: #d2d2d7; padding: 0 8px;">|</span>
                              <a href="${siteUrl}" style="color: #06c; text-decoration: none;">vadiler.com</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #86868b;">
                              © ${new Date().getFullYear()} Vadiler Çiçekçilik
                            </p>
                            <p style="margin: 8px 0 0 0; font-size: 11px; color: #86868b;">
                              Bu email ${customerEmail} adresine gönderilmiştir.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
                <!-- End Container -->

              </td>
            </tr>
          </table>

        </body>
      </html>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: `🚚 Siparişiniz Yola Çıktı - #${orderNumber}`,
      html,
      text: `Siparişiniz kargoya verildi! Sipariş No: ${orderNumber}. Sipariş takibi: ${trackingUrl}`,
    });
  }

  /**
   * Send order status update email (dynamic)
   */
  static async sendOrderStatusUpdate(params: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed' | 'payment_failed' | 'pending_payment' | 'refunded';
    deliveryDate?: string;
    deliveryTime?: string;
    deliveryAddress?: string;
    district?: string;
    recipientName?: string;
    recipientPhone?: string;
    refundAmount?: number;
    refundReason?: string;
    refundDate?: string;
  }): Promise<boolean> {
    const statusMeta: Record<string, { title: string; subject: string; message: string; button: string; color?: string }> = {
      confirmed: {
        title: 'Siparişiniz Onaylandı',
        subject: `Siparişiniz Onaylandı - #${params.orderNumber}`,
        message: 'Siparişiniz onaylandı. Teslimat günü belirlenen saatlerde durumunuz otomatik güncellenecektir.',
        button: 'Siparişimi Takip Et',
      },
      processing: {
        title: 'Siparişiniz Hazırlanıyor',
        subject: `Siparişiniz Hazırlanıyor - #${params.orderNumber}`,
        message: 'Siparişiniz hazırlanıyor. Çok yakında yola çıkacak.',
        button: 'Sipariş Durumunu Gör',
      },
      shipped: {
        title: 'Siparişiniz Yola Çıktı',
        subject: `Siparişiniz Yola Çıktı - #${params.orderNumber}`,
        message: 'Siparişiniz yola çıktı. Yakında teslim edilecek.',
        button: 'Teslimat Durumunu Takip Et',
      },
      delivered: {
        title: 'Siparişiniz Teslim Edildi',
        subject: `Siparişiniz Teslim Edildi - #${params.orderNumber}`,
        message: 'Siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz.',
        button: 'Siparişi Görüntüle',
      },
      cancelled: {
        title: 'Siparişiniz İptal Edildi',
        subject: `Siparişiniz İptal Edildi - #${params.orderNumber}`,
        message: 'Siparişiniz iptal edildi. Ödeme yaptıysanız, iade işlemi başlatılacaktır. Detaylı bilgi için bizimle iletişime geçebilirsiniz.',
        button: 'Sipariş Detayları',
        color: '#ef4444',
      },
      failed: {
        title: 'Siparişiniz Başarısız Oldu',
        subject: `Siparişiniz Başarısız - #${params.orderNumber}`,
        message: 'Maalesef siparişiniz tamamlanamadı. Ödeme işlemi gerçekleştirildiyse iadeniz en kısa sürede yapılacaktır. Detaylı bilgi için bizimle iletişime geçebilirsiniz.',
        button: 'Destek Al',
        color: '#ef4444',
      },
      payment_failed: {
        title: 'Ödeme Başarısız',
        subject: `Ödeme Başarısız - #${params.orderNumber}`,
        message: 'Siparişiniz için ödeme işlemi başarısız oldu. Lütfen farklı bir ödeme yöntemi deneyiniz veya bizimle iletişime geçiniz.',
        button: 'Tekrar Dene',
        color: '#f59e0b',
      },
      pending_payment: {
        title: 'Ödeme Bekleniyor',
        subject: `Ödeme Bekleniyor - #${params.orderNumber}`,
        message: 'Siparişiniz oluşturuldu, ödeme bekleniyor. Havale/EFT ile ödeme yapacaksanız lütfen açıklama kısmına sipariş numaranızı yazınız.',
        button: 'Ödeme Bilgilerini Gör',
        color: '#3b82f6',
      },
      refunded: {
        title: 'İade İşleminiz Tamamlandı',
        subject: `İade Tamamlandı - #${params.orderNumber}`,
        message: `Siparişiniz için iade işlemi tamamlanmıştır.${params.refundAmount ? ` İade tutarı: ₺${params.refundAmount.toLocaleString('tr-TR')}.` : ''} Tutar, ödeme yönteminize göre 3-7 iş günü içinde hesabınıza yansıyacaktır.${params.refundReason ? ` İade sebebi: ${params.refundReason}` : ''}`,
        button: 'Sipariş Detayları',
        color: '#10b981',
      },
    };

    const meta = statusMeta[params.status];
    if (!meta) return false;

    const siteUrl = this.getSiteUrl();
    const logoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159827/branding/vadiler-logo.png';
    const brandLogoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159828/branding/vadiler-logo-band.png';

    const trackingUrl = this.buildTrackingUrl({
      orderNumber: params.orderNumber,
      verificationType: 'email',
      verificationValue: params.customerEmail,
    });

    const safeDistrict = (params.district || '').trim();
    const safeRecipientName = (params.recipientName || '').trim();
    const safeRecipientPhone = (params.recipientPhone || '').trim();
    const safeDeliveryAddress = (params.deliveryAddress || '').trim();
    const safeDeliveryDate = (params.deliveryDate || '').trim();
    const safeDeliveryTime = (params.deliveryTime || '').trim();

    // Status-based colors and backgrounds
    const statusColors: Record<string, { bg: string; text: string; btn: string }> = {
      confirmed: { bg: '#ecfdf5', text: '#065f46', btn: '#10b981' },
      processing: { bg: '#eff6ff', text: '#1e40af', btn: '#3b82f6' },
      shipped: { bg: '#ecfdf5', text: '#065f46', btn: '#10b981' },
      delivered: { bg: '#ecfdf5', text: '#065f46', btn: '#10b981' },
      cancelled: { bg: '#fef2f2', text: '#991b1b', btn: '#ef4444' },
      failed: { bg: '#fef2f2', text: '#991b1b', btn: '#ef4444' },
      payment_failed: { bg: '#fffbeb', text: '#92400e', btn: '#f59e0b' },
      pending_payment: { bg: '#eff6ff', text: '#1e40af', btn: '#3b82f6' },
      refunded: { bg: '#ecfdf5', text: '#065f46', btn: '#10b981' },
    };

    const statusEmojis: Record<string, string> = {
      confirmed: '✓',
      processing: '🔄',
      shipped: '🚚',
      delivered: '🎉',
      cancelled: '✕',
      failed: '❌',
      payment_failed: '⚠️',
      pending_payment: '⏳',
      refunded: '💰',
    };

    const colors = statusColors[params.status] || statusColors.confirmed;
    const emoji = statusEmojis[params.status] || '📦';

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="color-scheme" content="light">
          <meta name="supported-color-schemes" content="light">
          <title>${meta.title}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
            <tr>
              <td align="center" style="padding: 0;">
                
                <!-- Container -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; margin: 0 auto;">
                  
                  <!-- Logo Section -->
                  <tr>
                    <td align="center" style="padding: 48px 24px 40px 24px;">
                      <a href="${siteUrl}" style="text-decoration: none;">
                        <img src="${logoUrl}" alt="Vadiler Çiçekçilik" width="180" style="display: block; border: 0; height: auto; max-width: 180px;" />
                      </a>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 0 24px;">
                      
                      <!-- Headline -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 0 0 24px 0;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.5px; line-height: 1.2;">
                              ${meta.title}
                            </h1>
                            <p style="margin: 12px 0 0 0; font-size: 17px; color: #86868b; font-weight: 400; line-height: 1.5;">
                              Sipariş No: #${params.orderNumber}
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Status Card -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${colors.bg}; border-radius: 16px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 24px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td width="48" style="vertical-align: top;">
                                  <div style="width: 48px; height: 48px; background-color: ${colors.btn}; border-radius: 50%; text-align: center; line-height: 48px; font-size: 20px; color: #ffffff;">
                                    ${emoji}
                                  </div>
                                </td>
                                <td style="padding-left: 16px; vertical-align: top;">
                                  <p style="margin: 0; font-size: 17px; font-weight: 600; color: ${colors.text};">${meta.title}</p>
                                  <p style="margin: 8px 0 0 0; font-size: 14px; color: ${colors.text}; line-height: 1.5;">${meta.message}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      ${safeDeliveryDate || safeRecipientName || safeDeliveryAddress ? `
                      <!-- Delivery Info Card -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; border-radius: 16px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 24px;">
                            <p style="margin: 0 0 16px 0; font-size: 13px; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Teslimat Bilgileri</p>
                            
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px;">
                              ${safeDeliveryDate ? `
                              <tr>
                                <td style="padding: 4px 0; color: #86868b; width: 80px;">Tarih</td>
                                <td style="padding: 4px 0; color: #1d1d1f; font-weight: 500;">${safeDeliveryDate}${safeDeliveryTime ? ` • ${safeDeliveryTime}` : ''}</td>
                              </tr>
                              ` : ''}
                              ${safeRecipientName ? `
                              <tr>
                                <td style="padding: 4px 0; color: #86868b;">Alıcı</td>
                                <td style="padding: 4px 0; color: #1d1d1f; font-weight: 500;">${safeRecipientName}${safeRecipientPhone ? ` • ${safeRecipientPhone}` : ''}</td>
                              </tr>
                              ` : ''}
                              ${safeDeliveryAddress ? `
                              <tr>
                                <td style="padding: 4px 0; color: #86868b;">Adres</td>
                                <td style="padding: 4px 0; color: #1d1d1f; font-weight: 500;">${safeDeliveryAddress}${safeDistrict ? `, ${safeDistrict}` : ''}</td>
                              </tr>
                              ` : ''}
                            </table>
                          </td>
                        </tr>
                      </table>
                      ` : ''}

                      <!-- CTA Button -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <a href="${trackingUrl}" style="display: inline-block; background-color: ${colors.btn}; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 980px; font-size: 17px; font-weight: 500; letter-spacing: -0.2px;">
                              ${meta.button}
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Help -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0; font-size: 14px; color: #86868b; line-height: 1.6;">
                              Sorularınız için <a href="tel:08503074876" style="color: #1d1d1f; text-decoration: none; font-weight: 500;">0850 307 4876</a>
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px 24px 48px 24px; border-top: 1px solid #f5f5f7;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding-bottom: 24px;">
                            <img src="${brandLogoUrl}" alt="Vadiler Çiçekçilik" width="210" style="display: block; border: 0; height: auto; max-width: 210px;" />
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 12px 0; font-size: 12px; color: #86868b;">
                              <a href="${trackingUrl}" style="color: #06c; text-decoration: none;">Siparişi Takip Et</a>
                              <span style="color: #d2d2d7; padding: 0 8px;">|</span>
                              <a href="${siteUrl}/iletisim" style="color: #06c; text-decoration: none;">İletişim</a>
                              <span style="color: #d2d2d7; padding: 0 8px;">|</span>
                              <a href="${siteUrl}" style="color: #06c; text-decoration: none;">vadiler.com</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #86868b;">
                              © ${new Date().getFullYear()} Vadiler Çiçekçilik
                            </p>
                            <p style="margin: 8px 0 0 0; font-size: 11px; color: #86868b;">
                              Bu email ${params.customerEmail} adresine gönderilmiştir.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
                <!-- End Container -->

              </td>
            </tr>
          </table>

        </body>
      </html>
    `;

    return this.sendEmail({
      to: params.customerEmail,
      subject: `${emoji} ${meta.subject}`,
      html,
      text: `${meta.title} - Sipariş No: ${params.orderNumber}. Sipariş takibi: ${trackingUrl}`,
    });
  }

  /**
   * Send review approved notification to customer
   */
  static async sendReviewApprovedNotification(
    customerEmail: string,
    customerName: string,
    productName: string,
    reviewUrl: string
  ): Promise<boolean> {
    const siteUrl = this.getSiteUrl();
    const logoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159827/branding/vadiler-logo.png';
    const brandLogoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159828/branding/vadiler-logo-band.png';

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="color-scheme" content="light">
          <meta name="supported-color-schemes" content="light">
          <title>Değerlendirmeniz Yayınlandı</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
            <tr>
              <td align="center" style="padding: 0;">
                
                <!-- Container -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; margin: 0 auto;">
                  
                  <!-- Logo Section -->
                  <tr>
                    <td align="center" style="padding: 48px 24px 40px 24px;">
                      <a href="${siteUrl}" style="text-decoration: none;">
                        <img src="${logoUrl}" alt="Vadiler Çiçekçilik" width="180" style="display: block; border: 0; height: auto; max-width: 180px;" />
                      </a>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 0 24px;">
                      
                      <!-- Headline -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 0 0 24px 0;">
                            <p style="margin: 0 0 16px 0; font-size: 64px;">⭐</p>
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.5px; line-height: 1.2;">
                              Değerlendirmeniz Yayınlandı!
                            </h1>
                            <p style="margin: 12px 0 0 0; font-size: 17px; color: #86868b; font-weight: 400; line-height: 1.5;">
                              Görüşlerinizi bizimle paylaştığınız için teşekkürler
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Product Card -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fdf4ff; border-radius: 16px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 24px;">
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #a21caf; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Ürün</p>
                            <p style="margin: 0; font-size: 17px; font-weight: 600; color: #86198f;">${productName}</p>
                            <p style="margin: 16px 0 0 0; font-size: 14px; color: #a21caf; line-height: 1.6;">
                              Değerli görüşleriniz için teşekkür ederiz. Paylaştığınız deneyimler, diğer müşterilerimizin doğru seçim yapmasına yardımcı oluyor.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Coupon Card -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ecfdf5; border-radius: 16px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 24px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td width="48" style="vertical-align: top;">
                                  <div style="width: 48px; height: 48px; background-color: #10b981; border-radius: 50%; text-align: center; line-height: 48px; font-size: 20px; color: #ffffff;">
                                    🎁
                                  </div>
                                </td>
                                <td style="padding-left: 16px; vertical-align: top;">
                                  <p style="margin: 0; font-size: 13px; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">İndirim Kuponu</p>
                                  <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 700; color: #065f46; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">YORUM5</p>
                                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #10b981;">Bir sonraki alışverişinizde %5 indirim</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <a href="${reviewUrl}" style="display: inline-block; background-color: #d946ef; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 980px; font-size: 17px; font-weight: 500; letter-spacing: -0.2px;">
                              Değerlendirmenizi Görüntüleyin
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Help -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0; font-size: 14px; color: #86868b; line-height: 1.6;">
                              Sorularınız için <a href="tel:08503074876" style="color: #1d1d1f; text-decoration: none; font-weight: 500;">0850 307 4876</a>
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px 24px 48px 24px; border-top: 1px solid #f5f5f7;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding-bottom: 24px;">
                            <img src="${brandLogoUrl}" alt="Vadiler Çiçekçilik" width="210" style="display: block; border: 0; height: auto; max-width: 210px;" />
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 12px 0; font-size: 12px; color: #86868b;">
                              <a href="${siteUrl}/iletisim" style="color: #06c; text-decoration: none;">İletişim</a>
                              <span style="color: #d2d2d7; padding: 0 8px;">|</span>
                              <a href="${siteUrl}" style="color: #06c; text-decoration: none;">vadiler.com</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #86868b;">
                              © ${new Date().getFullYear()} Vadiler Çiçekçilik
                            </p>
                            <p style="margin: 8px 0 0 0; font-size: 11px; color: #86868b;">
                              Bu email ${customerEmail} adresine gönderilmiştir.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
                <!-- End Container -->

              </td>
            </tr>
          </table>

        </body>
      </html>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: `⭐ Değerlendirmeniz Yayınlandı - ${productName}`,
      html,
      text: `Değerlendirmeniz onaylandı ve yayınlandı! ${productName} için yazdığınız değerlendirme artık sitede görünüyor.`,
    });
  }

  /**
   * Send seller response notification to customer
   */
  static async sendSellerResponseNotification(
    customerEmail: string,
    customerName: string,
    productName: string,
    response: string,
    reviewUrl: string
  ): Promise<boolean> {
    const siteUrl = this.getSiteUrl();
    const logoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159827/branding/vadiler-logo.png';
    const brandLogoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159828/branding/vadiler-logo-band.png';

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="color-scheme" content="light">
          <meta name="supported-color-schemes" content="light">
          <title>Değerlendirmenize Yanıt</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
            <tr>
              <td align="center" style="padding: 0;">
                
                <!-- Container -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; margin: 0 auto;">
                  
                  <!-- Logo Section -->
                  <tr>
                    <td align="center" style="padding: 48px 24px 40px 24px;">
                      <a href="${siteUrl}" style="text-decoration: none;">
                        <img src="${logoUrl}" alt="Vadiler Çiçekçilik" width="180" style="display: block; border: 0; height: auto; max-width: 180px;" />
                      </a>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 0 24px;">
                      
                      <!-- Headline -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 0 0 24px 0;">
                            <p style="margin: 0 0 16px 0; font-size: 64px;">💬</p>
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.5px; line-height: 1.2;">
                              Değerlendirmenize Yanıt Verildi
                            </h1>
                            <p style="margin: 12px 0 0 0; font-size: 17px; color: #86868b; font-weight: 400; line-height: 1.5;">
                              ${productName}
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Response Card -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #eff6ff; border-radius: 16px; margin-bottom: 24px; border-left: 4px solid #3b82f6;">
                        <tr>
                          <td style="padding: 24px;">
                            <p style="margin: 0 0 12px 0; font-size: 13px; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Satıcı Yanıtı</p>
                            <p style="margin: 0; font-size: 15px; color: #1e3a8a; line-height: 1.6;">${response}</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Message -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0; font-size: 14px; color: #86868b; line-height: 1.6;">
                              Görüşlerinize verdiğimiz önemi göstermek adına sizinle iletişime geçtik.<br/>Memnuniyetiniz bizim için önemlidir!
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <a href="${reviewUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 980px; font-size: 17px; font-weight: 500; letter-spacing: -0.2px;">
                              Yanıtı Görüntüleyin
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Help -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0; font-size: 14px; color: #86868b; line-height: 1.6;">
                              Sorularınız için <a href="tel:08503074876" style="color: #1d1d1f; text-decoration: none; font-weight: 500;">0850 307 4876</a>
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px 24px 48px 24px; border-top: 1px solid #f5f5f7;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding-bottom: 24px;">
                            <img src="${brandLogoUrl}" alt="Vadiler Çiçekçilik" width="210" style="display: block; border: 0; height: auto; max-width: 210px;" />
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 12px 0; font-size: 12px; color: #86868b;">
                              <a href="${siteUrl}/iletisim" style="color: #06c; text-decoration: none;">İletişim</a>
                              <span style="color: #d2d2d7; padding: 0 8px;">|</span>
                              <a href="${siteUrl}" style="color: #06c; text-decoration: none;">vadiler.com</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #86868b;">
                              © ${new Date().getFullYear()} Vadiler Çiçekçilik
                            </p>
                            <p style="margin: 8px 0 0 0; font-size: 11px; color: #86868b;">
                              Bu email ${customerEmail} adresine gönderilmiştir.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
                <!-- End Container -->

              </td>
            </tr>
          </table>

        </body>
      </html>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: `💬 Değerlendirmenize Yanıt - ${productName}`,
      html,
      text: `${productName} için yazdığınız değerlendirmeye satıcı yanıt verdi. Yanıtı görüntülemek için: ${reviewUrl}`,
    });
  }

  /**
   * Send new review notification to admin
   */
  static async sendNewReviewNotificationToAdmin(
    adminEmail: string,
    productName: string,
    customerName: string,
    rating: number,
    reviewUrl: string
  ): Promise<boolean> {
    const siteUrl = this.getSiteUrl();
    const logoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159827/branding/vadiler-logo.png';
    const brandLogoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159828/branding/vadiler-logo-band.png';

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="color-scheme" content="light">
          <meta name="supported-color-schemes" content="light">
          <title>Yeni Değerlendirme</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
            <tr>
              <td align="center" style="padding: 0;">
                
                <!-- Container -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; margin: 0 auto;">
                  
                  <!-- Logo Section -->
                  <tr>
                    <td align="center" style="padding: 48px 24px 40px 24px;">
                      <a href="${siteUrl}" style="text-decoration: none;">
                        <img src="${logoUrl}" alt="Vadiler Çiçekçilik" width="180" style="display: block; border: 0; height: auto; max-width: 180px;" />
                      </a>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 0 24px;">
                      
                      <!-- Headline -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 0 0 24px 0;">
                            <p style="margin: 0 0 16px 0; font-size: 64px;">📝</p>
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.5px; line-height: 1.2;">
                              Yeni Değerlendirme Bekliyor
                            </h1>
                            <p style="margin: 12px 0 0 0; font-size: 17px; color: #86868b; font-weight: 400; line-height: 1.5;">
                              Onay bekleyen bir değerlendirme var
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Review Card -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbeb; border-radius: 16px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 24px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                              <tr>
                                <td>
                                  <p style="margin: 0; font-size: 13px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Ürün</p>
                                  <p style="margin: 4px 0 0 0; font-size: 17px; font-weight: 600; color: #78350f;">${productName}</p>
                                </td>
                              </tr>
                            </table>
                            
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #fcd34d; padding-top: 16px;">
                              <tr>
                                <td width="50%">
                                  <p style="margin: 0; font-size: 13px; color: #92400e;">Müşteri</p>
                                  <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 500; color: #78350f;">${customerName}</p>
                                </td>
                                <td width="50%" align="right">
                                  <p style="margin: 0; font-size: 13px; color: #92400e;">Puan</p>
                                  <p style="margin: 4px 0 0 0; font-size: 24px; color: #fbbf24;">${'⭐'.repeat(rating)}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <a href="${reviewUrl}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 980px; font-size: 17px; font-weight: 500; letter-spacing: -0.2px;">
                              Değerlendirmeyi İncele
                            </a>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px 24px 48px 24px; border-top: 1px solid #f5f5f7;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding-bottom: 24px;">
                            <img src="${brandLogoUrl}" alt="Vadiler Çiçekçilik" width="210" style="display: block; border: 0; height: auto; max-width: 210px;" />
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <p style="margin: 0; font-size: 12px; color: #86868b;">
                              Vadiler Çiçekçilik - Yönetim Paneli
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
                <!-- End Container -->

              </td>
            </tr>
          </table>

        </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `📝 Yeni Değerlendirme: ${productName}`,
      html,
      text: `${customerName}, ${productName} için ${rating} yıldız verdi. Değerlendirmeyi inceleyin: ${reviewUrl}`,
    });
  }

  /**
   * Send test email
   */
  static async sendTestEmail(to: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Test Email - Vadiler Çiçekçilik',
      html: `
        <h1>Email Yapılandırması Başarılı! ✅</h1>
        <p>SMTP ayarlarınız doğru şekilde yapılandırılmış.</p>
        <p>Bu bir test emailidir.</p>
        <p><strong>Vadiler Çiçekçilik</strong></p>
      `,
      text: 'Email yapılandırması başarılı! Bu bir test emailidir.',
    });
  }

  /**
   * Send bank transfer order confirmation email
   */
  static async sendBankTransferConfirmation(data: OrderEmailData & { orderNumber: string }): Promise<boolean> {
    const siteUrl = this.getSiteUrl();
    const logoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159827/branding/vadiler-logo.png';
    const brandLogoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159828/branding/vadiler-logo-band.png';
    
    const trackingUrl = this.buildTrackingUrl({
      orderNumber: data.orderNumber,
      verificationType: data.verificationType,
      verificationValue: data.verificationValue,
    });

    // Apple tarzı minimalist ürün kartları
    const itemsHtml = data.items.map(item => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
        <tr>
          <td style="padding-left: 0; vertical-align: top;">
            <p style="margin: 0; font-size: 15px; font-weight: 500; color: #1d1d1f; line-height: 1.3;">${item.name}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #86868b;">Adet: ${item.quantity}</p>
          </td>
          <td align="right" style="vertical-align: top;">
            <p style="margin: 0; font-size: 15px; font-weight: 500; color: #1d1d1f;">${(item.price * item.quantity).toLocaleString('tr-TR')} ₺</p>
          </td>
        </tr>
      </table>
    `).join('');

    const safeCustomerPhone = (data.customerPhone || '').trim();
    const safeRecipientName = (data.recipientName || '').trim();
    const safeRecipientPhone = (data.recipientPhone || '').trim();
    const safeDistrict = (data.district || '').trim();
    const discount = typeof data.discount === 'number' ? data.discount : 0;
    const showDiscount = discount > 0;

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="color-scheme" content="light">
          <meta name="supported-color-schemes" content="light">
          <title>Ödeme Bekleniyor</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
            <tr>
              <td align="center" style="padding: 0;">
                
                <!-- Container -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; margin: 0 auto;">
                  
                  <!-- Logo Section -->
                  <tr>
                    <td align="center" style="padding: 48px 24px 40px 24px;">
                      <a href="${siteUrl}" style="text-decoration: none;">
                        <img src="${logoUrl}" alt="Vadiler Çiçekçilik" width="180" style="display: block; border: 0; height: auto; max-width: 180px;" />
                      </a>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 0 24px;">
                      
                      <!-- Headline -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 0 0 24px 0;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.5px; line-height: 1.2;">
                              Siparişiniz Alındı
                            </h1>
                            <p style="margin: 12px 0 0 0; font-size: 17px; color: #86868b; font-weight: 400; line-height: 1.5;">
                              Ödemenizi tamamlamanızı bekliyoruz
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Bank Info Card -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ecfdf5; border-radius: 16px; margin-bottom: 24px; border: 2px solid #10b981;">
                        <tr>
                          <td style="padding: 24px;">
                            <p style="margin: 0 0 20px 0; font-size: 17px; font-weight: 600; color: #065f46;">🏦 Banka Hesap Bilgileri</p>
                            
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px;">
                              <tr>
                                <td style="padding: 8px 0; color: #047857; width: 100px;">Banka</td>
                                <td style="padding: 8px 0; color: #065f46; font-weight: 500;"><img src="https://res.cloudinary.com/dgdl1vdao/image/upload/v1768160000/branding/garanti-bank-logo.png" alt="Garanti Bankası" height="24" style="height: 24px; vertical-align: middle;" /></td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #047857;">IBAN</td>
                                <td style="padding: 8px 0; color: #065f46; font-weight: 600; font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-size: 13px;">TR12 0006 2000 7520 0006 2942 76</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #047857;">Hesap</td>
                                <td style="padding: 8px 0; color: #065f46; font-weight: 500;">STR GRUP A.Ş</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #047857;">Tutar</td>
                                <td style="padding: 8px 0; color: #059669; font-weight: 700; font-size: 20px;">${data.total.toLocaleString('tr-TR')} ₺</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #047857;">Açıklama</td>
                                <td style="padding: 8px 0; color: #059669; font-weight: 700;">#${data.orderNumber}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Warning Notice -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                        <tr>
                          <td style="background-color: #fffbeb; border-radius: 12px; padding: 16px 20px;">
                            <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 500; line-height: 1.5;">
                              ⚠️ <strong>Önemli:</strong> Havale/EFT yaparken açıklama kısmına mutlaka sipariş numaranızı yazınız.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Order Card -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; border-radius: 16px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 24px;">
                            
                            <!-- Order Header -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                              <tr>
                                <td>
                                  <p style="margin: 0; font-size: 13px; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Sipariş</p>
                                  <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 600; color: #1d1d1f;">#${data.orderNumber}</p>
                                </td>
                                <td align="right">
                                  <p style="margin: 0; font-size: 13px; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Teslimat</p>
                                  <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 600; color: #1d1d1f;">${data.deliveryDate}</p>
                                </td>
                              </tr>
                            </table>

                            <!-- Divider -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="border-top: 1px solid #d2d2d7; padding-top: 20px;"></td>
                              </tr>
                            </table>

                            <!-- Products -->
                            ${itemsHtml}

                            <!-- Pricing -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; border-top: 1px solid #d2d2d7; padding-top: 20px;">
                              <tr>
                                <td style="padding: 4px 0;">
                                  <p style="margin: 0; font-size: 14px; color: #86868b;">Ara Toplam</p>
                                </td>
                                <td align="right" style="padding: 4px 0;">
                                  <p style="margin: 0; font-size: 14px; color: #1d1d1f;">${data.subtotal.toLocaleString('tr-TR')} ₺</p>
                                </td>
                              </tr>
                              ${showDiscount ? `
                              <tr>
                                <td style="padding: 4px 0;">
                                  <p style="margin: 0; font-size: 14px; color: #10b981;">İndirim</p>
                                </td>
                                <td align="right" style="padding: 4px 0;">
                                  <p style="margin: 0; font-size: 14px; color: #10b981;">-${discount.toLocaleString('tr-TR')} ₺</p>
                                </td>
                              </tr>
                              ` : ''}
                              <tr>
                                <td style="padding: 4px 0;">
                                  <p style="margin: 0; font-size: 14px; color: #86868b;">Teslimat</p>
                                </td>
                                <td align="right" style="padding: 4px 0;">
                                  <p style="margin: 0; font-size: 14px; color: ${data.deliveryFee === 0 ? '#10b981' : '#1d1d1f'};">${data.deliveryFee === 0 ? 'Ücretsiz' : data.deliveryFee.toLocaleString('tr-TR') + ' ₺'}</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0 0 0;">
                                  <p style="margin: 0; font-size: 17px; font-weight: 600; color: #1d1d1f;">Toplam</p>
                                </td>
                                <td align="right" style="padding: 12px 0 0 0;">
                                  <p style="margin: 0; font-size: 24px; font-weight: 700; color: #10b981;">${data.total.toLocaleString('tr-TR')} ₺</p>
                                </td>
                              </tr>
                            </table>

                          </td>
                        </tr>
                      </table>

                      <!-- Delivery Info Card -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; border-radius: 16px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 24px;">
                            <p style="margin: 0 0 16px 0; font-size: 13px; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Teslimat Bilgileri</p>
                            
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px;">
                              ${safeRecipientName ? `
                              <tr>
                                <td style="padding: 4px 0; color: #86868b; width: 80px;">Alıcı</td>
                                <td style="padding: 4px 0; color: #1d1d1f; font-weight: 500;">${safeRecipientName}${safeRecipientPhone ? ` • ${safeRecipientPhone}` : ''}</td>
                              </tr>
                              ` : ''}
                              <tr>
                                <td style="padding: 4px 0; color: #86868b;">Adres</td>
                                <td style="padding: 4px 0; color: #1d1d1f; font-weight: 500;">${data.deliveryAddress}${safeDistrict ? `, ${safeDistrict}` : ''}</td>
                              </tr>
                              <tr>
                                <td style="padding: 4px 0; color: #86868b;">Zaman</td>
                                <td style="padding: 4px 0; color: #1d1d1f; font-weight: 500;">${data.deliveryDate} • ${data.deliveryTime}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <a href="${trackingUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 980px; font-size: 17px; font-weight: 500; letter-spacing: -0.2px;">
                              Siparişimi Takip Et
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Help -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0; font-size: 14px; color: #86868b; line-height: 1.6;">
                              Sorularınız için <a href="tel:08503074876" style="color: #1d1d1f; text-decoration: none; font-weight: 500;">0850 307 4876</a>
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px 24px 48px 24px; border-top: 1px solid #f5f5f7;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding-bottom: 24px;">
                            <img src="${brandLogoUrl}" alt="Vadiler Çiçekçilik" width="210" style="display: block; border: 0; height: auto; max-width: 210px;" />
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 12px 0; font-size: 12px; color: #86868b;">
                              <a href="${trackingUrl}" style="color: #06c; text-decoration: none;">Siparişi Takip Et</a>
                              <span style="color: #d2d2d7; padding: 0 8px;">|</span>
                              <a href="${siteUrl}/iletisim" style="color: #06c; text-decoration: none;">İletişim</a>
                              <span style="color: #d2d2d7; padding: 0 8px;">|</span>
                              <a href="${siteUrl}" style="color: #06c; text-decoration: none;">vadiler.com</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #86868b;">
                              © ${new Date().getFullYear()} Vadiler Çiçekçilik
                            </p>
                            <p style="margin: 8px 0 0 0; font-size: 11px; color: #86868b;">
                              Bu email ${data.customerEmail} adresine gönderilmiştir.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
                <!-- End Container -->

              </td>
            </tr>
          </table>

        </body>
      </html>
    `;

    return this.sendEmail({
      to: data.customerEmail,
      subject: `🏦 Siparişiniz Alındı - Ödeme Bekleniyor - #${data.orderNumber}`,
      html,
      text: `Siparişiniz alındı! Sipariş No: ${data.orderNumber}. Havale/EFT için: Garanti Bankası, IBAN: TR12 0006 2000 7520 0006 2942 76, Hesap Sahibi: STR GRUP A.Ş, Tutar: ${data.total.toFixed(2)} ₺. Açıklamaya sipariş numaranızı yazınız. Sipariş takibi: ${trackingUrl}`,
    });
  }

  /**
   * Amazon/Trendyol tarzı ödeme hatırlatma emaili
   * "Sepetinizde ürünler kaldı" - Aciliyet yaratan, dönüşüm odaklı tasarım
   */
  static async sendPaymentReminderEmail(params: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    status: 'pending_payment' | 'awaiting_payment' | 'payment_failed';
    reminderCount: number; // Kaçıncı hatırlatma (1, 2, 3)
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      imageUrl?: string;
    }>;
    total: number;
    deliveryDate?: string;
    deliveryTime?: string;
    createdAt: string;
  }): Promise<boolean> {
    const siteUrl = this.getSiteUrl();
    
    // Sipariş takip sayfasına yönlendirme URL'i (ödeme bölümüne scroll)
    const paymentUrl = `${siteUrl}/siparis-takip?order=${params.orderNumber}&vtype=email&v=${encodeURIComponent(params.customerEmail)}#payment-section`;
    const trackingUrl = this.buildTrackingUrl({
      orderNumber: params.orderNumber,
      verificationType: 'email',
      verificationValue: params.customerEmail,
    });

    // Hatırlatma sayısına göre mesaj ve aciliyet seviyesi
    const reminderMessages = {
      1: {
        emoji: '🛒',
        headline: 'Siparişiniz sizi bekliyor!',
        subheadline: 'Ödemenizi tamamlayarak çiçeklerinizi güvenceye alın',
        urgency: '',
        buttonText: 'Ödemeyi Tamamla',
        color: '#3b82f6', // Mavi
      },
      2: {
        emoji: '⏰',
        headline: 'Siparişiniz hâlâ bekliyor!',
        subheadline: 'Teslimat tarihinize yetişmesi için ödemenizi yapın',
        urgency: '⚠️ Siparişiniz 24 saat içinde iptal edilebilir',
        buttonText: 'Hemen Öde',
        color: '#f59e0b', // Turuncu
      },
      3: {
        emoji: '🚨',
        headline: 'Son Hatırlatma!',
        subheadline: 'Siparişiniz çok yakında iptal edilecek',
        urgency: '❌ Bu son hatırlatmadır, ödeme yapılmazsa sipariş iptal edilecektir',
        buttonText: 'Acil Öde',
        color: '#ef4444', // Kırmızı
      },
    };

    const reminder = reminderMessages[params.reminderCount as 1 | 2 | 3] || reminderMessages[1];

    // Ödeme başarısız durumu için özel mesaj
    const isPaymentFailed = params.status === 'payment_failed';
    if (isPaymentFailed) {
      reminder.headline = 'Ödemeniz başarısız oldu!';
      reminder.subheadline = 'Lütfen tekrar deneyin veya farklı bir ödeme yöntemi seçin';
      reminder.emoji = '❌';
    }

    // Ürün kartları HTML'i - Apple tarzı minimalist
    const itemsHtml = params.items.map(item => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
        <tr>
          ${item.imageUrl ? `
          <td width="56" style="vertical-align: top;">
            <img src="${item.imageUrl}" alt="${item.name}" width="56" height="56" style="display: block; border-radius: 8px; background-color: #f5f5f7;" />
          </td>
          ` : `
          <td width="56" style="vertical-align: top;">
            <div style="width: 56px; height: 56px; background-color: #f5f5f7; border-radius: 8px; text-align: center; line-height: 56px; font-size: 24px;">🌸</div>
          </td>
          `}
          <td style="padding-left: 16px; vertical-align: top;">
            <p style="margin: 0; font-size: 15px; font-weight: 500; color: #1d1d1f; line-height: 1.3;">${item.name}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #86868b;">Adet: ${item.quantity}</p>
          </td>
          <td align="right" style="vertical-align: top;">
            <p style="margin: 0; font-size: 15px; font-weight: 500; color: #1d1d1f;">${(item.price * item.quantity).toLocaleString('tr-TR')} ₺</p>
          </td>
        </tr>
      </table>
    `).join('');

    // Sipariş oluşturulma zamanından bu yana geçen süre
    const createdDate = new Date(params.createdAt);
    const now = new Date();
    const hoursPassed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));

    // Logo URLs - Cloudinary'den (PNG format, email uyumlu)
    const logoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159827/branding/vadiler-logo.png';
    const brandLogoUrl = 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1768159828/branding/vadiler-logo-band.png';
    
    // Accent color based on reminder level
    const accentColor = reminder.color;
    const softBg = params.reminderCount === 3 ? '#fef2f2' : params.reminderCount === 2 ? '#fffbeb' : '#f0f9ff';

    const html = `
      <!DOCTYPE html>>
      <html lang="tr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="color-scheme" content="light">
          <meta name="supported-color-schemes" content="light">
          <title>${reminder.headline}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
            <tr>
              <td align="center" style="padding: 0;">
                
                <!-- Container -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; margin: 0 auto;">
                  
                  <!-- Logo Section -->
                  <tr>
                    <td align="center" style="padding: 48px 24px 40px 24px;">
                      <a href="${siteUrl}" style="text-decoration: none;">
                        <img src="${logoUrl}" alt="Vadiler Çiçekçilik" width="180" style="display: block; border: 0; height: auto; max-width: 180px;" />
                      </a>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 0 24px;">
                      
                      <!-- Headline -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 0 0 24px 0;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.5px; line-height: 1.2;">
                              ${reminder.headline}
                            </h1>
                            <p style="margin: 12px 0 0 0; font-size: 17px; color: #86868b; font-weight: 400; line-height: 1.5;">
                              ${reminder.subheadline}
                            </p>
                          </td>
                        </tr>
                      </table>

                      ${reminder.urgency ? `
                      <!-- Urgency Notice -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                        <tr>
                          <td style="background-color: ${softBg}; border-radius: 12px; padding: 16px 20px;">
                            <p style="margin: 0; font-size: 14px; color: ${accentColor}; font-weight: 500; text-align: center;">
                              ${reminder.urgency}
                            </p>
                          </td>
                        </tr>
                      </table>
                      ` : ''}

                      <!-- Order Card -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; border-radius: 16px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 24px;">
                            
                            <!-- Order Header -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                              <tr>
                                <td>
                                  <p style="margin: 0; font-size: 13px; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Sipariş</p>
                                  <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 600; color: #1d1d1f;">#${params.orderNumber}</p>
                                </td>
                                <td align="right">
                                  ${params.deliveryDate ? `
                                  <p style="margin: 0; font-size: 13px; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Teslimat</p>
                                  <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 600; color: #1d1d1f;">${params.deliveryDate}</p>
                                  ` : ''}
                                </td>
                              </tr>
                            </table>

                            <!-- Divider -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="border-top: 1px solid #d2d2d7; padding-top: 20px;"></td>
                              </tr>
                            </table>

                            <!-- Products -->
                            ${itemsHtml}

                            <!-- Total -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; border-top: 1px solid #d2d2d7; padding-top: 20px;">
                              <tr>
                                <td>
                                  <p style="margin: 0; font-size: 17px; font-weight: 600; color: #1d1d1f;">Toplam</p>
                                </td>
                                <td align="right">
                                  <p style="margin: 0; font-size: 24px; font-weight: 700; color: #1d1d1f;">${params.total.toLocaleString('tr-TR')} ₺</p>
                                </td>
                              </tr>
                            </table>

                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <a href="${paymentUrl}" style="display: inline-block; background-color: ${accentColor}; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 980px; font-size: 17px; font-weight: 500; letter-spacing: -0.2px;">
                              ${reminder.buttonText}
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Bank Info -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 16px 0; font-size: 13px; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">
                              veya havale ile ödeyin
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="background-color: #f5f5f7; border-radius: 12px; padding: 20px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px;">
                              <tr>
                                <td style="padding: 4px 0; color: #86868b; width: 100px;">Banka</td>
                                <td style="padding: 4px 0; color: #1d1d1f; font-weight: 500;"><img src="https://res.cloudinary.com/dgdl1vdao/image/upload/v1768160000/branding/garanti-bank-logo.png" alt="Garanti Bankası" height="20" style="height: 20px; vertical-align: middle;" /></td>
                              </tr>
                              <tr>
                                <td style="padding: 4px 0; color: #86868b;">Hesap</td>
                                <td style="padding: 4px 0; color: #1d1d1f; font-weight: 500;">STR GRUP A.Ş</td>
                              </tr>
                              <tr>
                                <td style="padding: 4px 0; color: #86868b;">IBAN</td>
                                <td style="padding: 4px 0; color: #1d1d1f; font-weight: 500; font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-size: 13px;">TR12 0006 2000 7520 0006 2942 76</td>
                              </tr>
                              <tr>
                                <td style="padding: 4px 0; color: #86868b;">Açıklama</td>
                                <td style="padding: 4px 0; color: ${accentColor}; font-weight: 600;">#${params.orderNumber}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Help -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0; font-size: 14px; color: #86868b; line-height: 1.6;">
                              Sorularınız için <a href="tel:08503074876" style="color: #1d1d1f; text-decoration: none; font-weight: 500;">0850 307 4876</a>
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px 24px 48px 24px; border-top: 1px solid #f5f5f7;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding-bottom: 24px;">
                            <img src="${brandLogoUrl}" alt="Vadiler Çiçekçilik" width="210" style="display: block; border: 0; height: auto; max-width: 210px;" />
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 12px 0; font-size: 12px; color: #86868b;">
                              <a href="${trackingUrl}" style="color: #06c; text-decoration: none;">Siparişi Takip Et</a>
                              <span style="color: #d2d2d7; padding: 0 8px;">|</span>
                              <a href="${siteUrl}/iletisim" style="color: #06c; text-decoration: none;">İletişim</a>
                              <span style="color: #d2d2d7; padding: 0 8px;">|</span>
                              <a href="${siteUrl}" style="color: #06c; text-decoration: none;">vadiler.com</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #86868b;">
                              © ${new Date().getFullYear()} Vadiler Çiçekçilik
                            </p>
                            <p style="margin: 8px 0 0 0; font-size: 11px; color: #86868b;">
                              Bu email ${params.customerEmail} adresine gönderilmiştir.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
                <!-- End Container -->

              </td>
            </tr>
          </table>

        </body>
      </html>
    `;

    // Subject line - Hatırlatma sayısına göre değişen
    const subjectLines = {
      1: `🛒 Siparişiniz bekliyor! - #${params.orderNumber}`,
      2: `⏰ Ödemenizi unutmayın! - #${params.orderNumber}`,
      3: `🚨 Son Hatırlatma: Siparişiniz iptal edilecek - #${params.orderNumber}`,
    };

    const subject = isPaymentFailed 
      ? `❌ Ödemeniz başarısız oldu - #${params.orderNumber}`
      : subjectLines[params.reminderCount as 1 | 2 | 3] || subjectLines[1];

    return this.sendEmail({
      to: params.customerEmail,
      subject,
      html,
      text: `${reminder.headline} - Sipariş No: ${params.orderNumber}. Toplam: ${params.total.toLocaleString('tr-TR')} ₺. Ödeme için: ${paymentUrl}`,
    });
  }
}
