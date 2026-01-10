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
    let purposeLabel = '';
    let title = '';
    
    switch (params.purpose) {
      case 'register':
        purposeLabel = 'Kayıt';
        title = 'Kayıt işleminizi tamamlamak için doğrulama kodunuz:';
        break;
      case 'login':
        purposeLabel = 'Giriş';
        title = 'Giriş işleminizi tamamlamak için doğrulama kodunuz:';
        break;
      case 'password-reset':
        purposeLabel = 'Şifre Sıfırlama';
        title = 'Şifrenizi sıfırlamak için doğrulama kodunuz:';
        break;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; background: #f9fafb; }
            .container { max-width: 520px; margin: 0 auto; padding: 24px; }
            .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
            .brand { font-weight: 700; font-size: 18px; margin: 0 0 8px 0; }
            .muted { color: #6b7280; font-size: 13px; }
            .code { font-size: 28px; font-weight: 800; letter-spacing: 6px; text-align: center; padding: 16px 0; border-radius: 10px; background: #f3f4f6; border: 1px dashed #d1d5db; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <p class="brand">Vadiler</p>
              <p>${title}</p>
              <div class="code">${params.code}</div>
              <p class="muted">Kod 10 dakika geçerlidir. Eğer bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: params.to,
      subject: `Vadiler ${purposeLabel} Doğrulama Kodu`,
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
    let purposeLabel = '';
    let title = '';
    
    switch (params.purpose) {
      case 'register':
        purposeLabel = 'Kayıt';
        title = 'Kayıt işleminizi tamamlamak için doğrulama kodunuz:';
        break;
      case 'login':
        purposeLabel = 'Giriş';
        title = 'Giriş işleminizi tamamlamak için doğrulama kodunuz:';
        break;
      case 'password-reset':
        purposeLabel = 'Şifre Sıfırlama';
        title = 'Şifrenizi sıfırlamak için doğrulama kodunuz:';
        break;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; background: #f9fafb; }
            .container { max-width: 520px; margin: 0 auto; padding: 24px; }
            .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
            .brand { font-weight: 700; font-size: 18px; margin: 0 0 8px 0; }
            .muted { color: #6b7280; font-size: 13px; }
            .code { font-size: 28px; font-weight: 800; letter-spacing: 6px; text-align: center; padding: 16px 0; border-radius: 10px; background: #f3f4f6; border: 1px dashed #d1d5db; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <p class="brand">Vadiler</p>
              <p>${title}</p>
              <div class="code">${params.code}</div>
              <p class="muted">Kod 10 dakika geçerlidir. Eğer bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmailWithDetails({
      to: params.to,
      subject: `Vadiler ${purposeLabel} Doğrulama Kodu`,
      html,
      text: `Vadiler ${purposeLabel} doğrulama kodunuz: ${params.code} (10 dakika geçerli)`,
    });
  }

  /**
   * Send order confirmation email
   */
  static async sendOrderConfirmation(data: OrderEmailData): Promise<boolean> {
    const trackingUrl = this.buildTrackingUrl({
      orderNumber: data.orderNumber,
      verificationType: data.verificationType,
      verificationValue: data.verificationValue,
    });

    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.price.toFixed(2)} ₺</td>
        </tr>
      `
      )
      .join('');

    const safeCustomerPhone = (data.customerPhone || '').trim();
    const safeRecipientName = (data.recipientName || '').trim();
    const safeRecipientPhone = (data.recipientPhone || '').trim();
    const safeDistrict = (data.district || '').trim();
    const discount = typeof data.discount === 'number' ? data.discount : 0;
    const showDiscount = discount > 0;
    const paymentMethod = (data.paymentMethod || '').trim();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; background: #f5f5f7; margin: 0; padding: 0; }
            .container { max-width: 640px; margin: 0 auto; padding: 24px; }
            .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
            .header { padding: 22px 24px; border-bottom: 1px solid #e5e7eb; }
            .brand { font-weight: 700; font-size: 14px; letter-spacing: 0.2px; color: #111827; margin: 0 0 8px 0; }
            .title { font-weight: 800; font-size: 22px; margin: 0; color: #111827; }
            .sub { margin: 6px 0 0 0; color: #6b7280; font-size: 13px; }
            .content { padding: 24px; }
            .section { background: #f9fafb; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #eef2f7; }
            .section h3 { margin: 0 0 10px 0; font-size: 14px; color: #111827; }
            .muted { color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0 0 0; }
            th, td { font-size: 13px; }
            .total-row { font-weight: 800; }
            .footer { text-align: center; padding: 18px 24px 24px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <p class="brand">Vadiler</p>
                <h1 class="title">Siparişiniz alındı</h1>
                <p class="sub">Sipariş No: <strong>#${data.orderNumber}</strong></p>
              </div>
              <div class="content">
              <p>Merhaba ${data.customerName},</p>
              <p>Siparişiniz başarıyla alındı. En kısa sürede hazırlayıp size ulaştıracağız.</p>

              <div class="section">
                <h3>Sipariş Bilgileri</h3>
                <p><strong>Sipariş No:</strong> #${data.orderNumber}</p>
                ${paymentMethod ? `<p><strong>Ödeme:</strong> ${paymentMethod}</p>` : ''}
                <p><strong>İletişim:</strong> ${data.customerEmail}${safeCustomerPhone ? ` • ${safeCustomerPhone}` : ''}</p>
              </div>
              
              <div class="section">
                <h3>Teslimat Bilgileri</h3>
                ${safeRecipientName ? `<p><strong>Alıcı:</strong> ${safeRecipientName}${safeRecipientPhone ? ` • ${safeRecipientPhone}` : ''}</p>` : ''}
                <p><strong>Adres:</strong> ${data.deliveryAddress}</p>
                ${safeDistrict ? `<p><strong>İlçe:</strong> ${safeDistrict}</p>` : ''}
                <p><strong>Tarih:</strong> ${data.deliveryDate}</p>
                <p><strong>Zaman:</strong> ${data.deliveryTime}</p>
              </div>

              <h3>Sipariş Detayları</h3>
              <table>
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 10px; text-align: left;">Ürün</th>
                    <th style="padding: 10px; text-align: center;">Adet</th>
                    <th style="padding: 10px; text-align: right;">Fiyat</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 10px; text-align: right;">Ara Toplam:</td>
                    <td style="padding: 10px; text-align: right;">${data.subtotal.toFixed(2)} ₺</td>
                  </tr>
                  ${showDiscount ? `
                  <tr>
                    <td colspan="2" style="padding: 10px; text-align: right;">İndirim:</td>
                    <td style="padding: 10px; text-align: right;">-${discount.toFixed(2)} ₺</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td colspan="2" style="padding: 10px; text-align: right;">Teslimat Ücreti:</td>
                    <td style="padding: 10px; text-align: right;">${data.deliveryFee === 0 ? 'ÜCRETSİZ' : data.deliveryFee.toFixed(2) + ' ₺'}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="2" style="padding: 10px; text-align: right; border-top: 2px solid #e5e7eb;">TOPLAM:</td>
                    <td style="padding: 10px; text-align: right; border-top: 2px solid #e5e7eb; color: #111827;">${data.total.toFixed(2)} ₺</td>
                  </tr>
                </tfoot>
              </table>

              <div style="text-align: center;">
                <a href="${trackingUrl}" style="display:inline-block;background:#111827;color:#ffffff !important;padding:12px 18px;text-decoration:none;border-radius:10px;font-weight:700;letter-spacing:0.2px;">Siparişimi Takip Et</a>
              </div>

              <p style="margin-top: 26px; font-size: 12px; color: #6b7280;">
                Sorularınız için <strong>0850 307 4876</strong> numaralı telefondan bize ulaşabilirsiniz.
              </p>
              </div>
              <div class="footer">
                <p style="margin:0;">Vadiler Çiçekçilik</p>
                <p style="margin:6px 0 0 0;">Bu email ${data.customerEmail} adresine gönderilmiştir.</p>
              </div>
            </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: data.customerEmail,
      subject: `Siparişiniz Alındı - #${data.orderNumber}`,
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
    const trackingUrl = this.buildTrackingUrl({
      orderNumber,
      verificationType: 'email',
      verificationValue: customerEmail,
    });
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; background: #f5f5f7; margin: 0; padding: 0; }
            .container { max-width: 640px; margin: 0 auto; padding: 24px; }
            .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
            .header { padding: 22px 24px; border-bottom: 1px solid #e5e7eb; }
            .brand { font-weight: 700; font-size: 14px; letter-spacing: 0.2px; color: #111827; margin: 0 0 8px 0; }
            .title { font-weight: 800; font-size: 22px; margin: 0; color: #111827; }
            .sub { margin: 6px 0 0 0; color: #6b7280; font-size: 13px; }
            .content { padding: 24px; }
            .status-box { background: #f9fafb; border: 1px solid #eef2f7; padding: 16px; border-radius: 12px; margin: 16px 0; text-align: left; }
            .footer { text-align: center; padding: 18px 24px 24px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <p class="brand">Vadiler</p>
                <h1 class="title">Siparişiniz yola çıktı</h1>
                <p class="sub">Sipariş No: <strong>#${orderNumber}</strong></p>
              </div>
              <div class="content">
              <p>Merhaba ${customerName},</p>
              <p>Harika haber! Siparişiniz kargoya verildi ve yakında sizinle olacak.</p>
              
              <div class="status-box">
                <p style="margin: 0; font-weight: 800;">📦 Teslimat yolda</p>
                <p style="margin: 8px 0 0 0; color: #6b7280;">Çiçekleriniz özenle paketlendi ve size doğru yola çıktı.</p>
              </div>

              <p>Teslimat sırasında herhangi bir sorun yaşarsanız lütfen bizimle iletişime geçin.</p>

              <div style="text-align: center;">
                <a href="${trackingUrl}" style="display:inline-block;background:#111827;color:#ffffff !important;padding:12px 18px;text-decoration:none;border-radius:10px;font-weight:700;letter-spacing:0.2px;">Teslimat Durumunu Takip Et</a>
              </div>

              <p style="margin-top: 30px; font-size: 0.9em; color: #6b7280;">
                Sorularınız için <strong>0850 307 4876</strong> numaralı telefondan bize ulaşabilirsiniz.
              </p>
              </div>
              <div class="footer">
                <p style="margin:0;">Vadiler Çiçekçilik</p>
                <p style="margin:6px 0 0 0;">Bu email ${customerEmail} adresine gönderilmiştir.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: `Siparişiniz Kargoya Verildi - #${orderNumber}`,
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
    status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    deliveryDate?: string;
    deliveryTime?: string;
    deliveryAddress?: string;
    district?: string;
    recipientName?: string;
    recipientPhone?: string;
  }): Promise<boolean> {
    const statusMeta: Record<string, { title: string; subject: string; message: string; button: string }> = {
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
        message: 'Siparişiniz iptal edildi. Detay için bizimle iletişime geçebilirsiniz.',
        button: 'Sipariş Detayları',
      },
    };

    const meta = statusMeta[params.status];
    if (!meta) return false;

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

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; background: #f5f5f7; margin: 0; padding: 0; }
            .container { max-width: 640px; margin: 0 auto; padding: 24px; }
            .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
            .header { padding: 22px 24px; border-bottom: 1px solid #e5e7eb; }
            .brand { font-weight: 700; font-size: 14px; letter-spacing: 0.2px; color: #111827; margin: 0 0 8px 0; }
            .title { font-weight: 800; font-size: 22px; margin: 0; color: #111827; }
            .sub { margin: 6px 0 0 0; color: #6b7280; font-size: 13px; }
            .content { padding: 24px; }
            .info { background: #f9fafb; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #eef2f7; }
            .footer { text-align: center; padding: 18px 24px 24px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <p class="brand">Vadiler</p>
                <h1 class="title">${meta.title}</h1>
                <p class="sub">Sipariş No: <strong>#${params.orderNumber}</strong></p>
              </div>
              <div class="content">
              <p>Merhaba ${params.customerName},</p>
              <p>${meta.message}</p>

              <div class="info">
                <p style="margin: 0;"><strong>Sipariş No:</strong> #${params.orderNumber}</p>
                ${safeDeliveryDate ? `<p style="margin: 8px 0 0 0;"><strong>Tarih:</strong> ${safeDeliveryDate}</p>` : ''}
                ${safeDeliveryTime ? `<p style="margin: 8px 0 0 0;"><strong>Zaman:</strong> ${safeDeliveryTime}</p>` : ''}
                ${safeRecipientName ? `<p style="margin: 8px 0 0 0;"><strong>Alıcı:</strong> ${safeRecipientName}${safeRecipientPhone ? ` • ${safeRecipientPhone}` : ''}</p>` : ''}
                ${safeDeliveryAddress ? `<p style="margin: 8px 0 0 0;"><strong>Adres:</strong> ${safeDeliveryAddress}</p>` : ''}
                ${safeDistrict ? `<p style="margin: 8px 0 0 0;"><strong>İlçe:</strong> ${safeDistrict}</p>` : ''}
              </div>

              <div style="text-align: center;">
                <a href="${trackingUrl}" style="display:inline-block;background:#111827;color:#ffffff !important;padding:12px 18px;text-decoration:none;border-radius:10px;font-weight:700;letter-spacing:0.2px;">${meta.button}</a>
              </div>

              <p style="margin-top: 30px; font-size: 0.9em; color: #6b7280;">
                Sorularınız için <strong>0850 307 4876</strong> numaralı telefondan bize ulaşabilirsiniz.
              </p>
              </div>
              <div class="footer">
                <p style="margin:0;">Vadiler Çiçekçilik</p>
                <p style="margin:6px 0 0 0;">Bu email ${params.customerEmail} adresine gönderilmiştir.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: params.customerEmail,
      subject: meta.subject,
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
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Değerlendirmeniz Yayınlandı! ⭐</h1>
            </div>
            <div class="content">
              <p>Merhaba ${customerName},</p>
              <p><strong>${productName}</strong> için yazdığınız değerlendirme onaylandı ve yayınlandı!</p>
              
              <p>Değerli görüşleriniz için teşekkür ederiz. Paylaştığınız deneyimler, diğer müşterilerimizin doğru seçim yapmasına yardımcı oluyor.</p>

              <div style="text-align: center;">
                <a href="${reviewUrl}" class="button">Değerlendirmenizi Görüntüleyin</a>
              </div>

              <p style="margin-top: 30px; font-size: 0.9em; color: #6b7280;">
                Bir sonraki alışverişinizde kullanabileceğiniz %5 indirim kuponu: <strong>YORUM5</strong>
              </p>
            </div>
            <div class="footer">
              <p>Vadiler Çiçekçilik - İstanbul'un En Taze Çiçekleri</p>
              <p>Bu email ${customerEmail} adresine gönderilmiştir.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: `Değerlendirmeniz Yayınlandı - ${productName}`,
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
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .response-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Değerlendirmenize Yanıt Verildi 💬</h1>
            </div>
            <div class="content">
              <p>Merhaba ${customerName},</p>
              <p><strong>${productName}</strong> için yazdığınız değerlendirmeye satıcı yanıt verdi:</p>
              
              <div class="response-box">
                <p style="margin: 0; color: #1e40af;"><strong>Satıcı Yanıtı:</strong></p>
                <p style="margin: 10px 0 0 0;">${response}</p>
              </div>

              <p>Görüşlerinize verdiğimiz önemi göstermek adına sizinle iletişime geçtik. Memnuniyetiniz bizim için önemlidir!</p>

              <div style="text-align: center;">
                <a href="${reviewUrl}" class="button">Yanıtı Görüntüleyin</a>
              </div>
            </div>
            <div class="footer">
              <p>Vadiler Çiçekçilik - İstanbul'un En Taze Çiçekleri</p>
              <p>Bu email ${customerEmail} adresine gönderilmiştir.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: `Değerlendirmenize Yanıt - ${productName}`,
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
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .stars { color: #fbbf24; font-size: 1.2em; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Yeni Değerlendirme Bekliyor! 📝</h1>
            </div>
            <div class="content">
              <p><strong>${customerName}</strong>, <strong>${productName}</strong> için bir değerlendirme yazdı.</p>
              
              <div style="margin: 20px 0;">
                <p><strong>Puan:</strong> <span class="stars">${'⭐'.repeat(rating)}</span> (${rating}/5)</p>
              </div>

              <p>Bu değerlendirmeyi onaylamak veya reddetmek için admin paneline gidin.</p>

              <div style="text-align: center;">
                <a href="${reviewUrl}" class="button">Değerlendirmeyi İncele</a>
              </div>
            </div>
            <div class="footer">
              <p>Vadiler Çiçekçilik - Yönetim Paneli</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `Yeni Değerlendirme: ${productName}`,
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
    const trackingUrl = this.buildTrackingUrl({
      orderNumber: data.orderNumber,
      verificationType: data.verificationType,
      verificationValue: data.verificationValue,
    });

    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.price.toFixed(2)} ₺</td>
        </tr>
      `
      )
      .join('');

    const safeCustomerPhone = (data.customerPhone || '').trim();
    const safeRecipientName = (data.recipientName || '').trim();
    const safeRecipientPhone = (data.recipientPhone || '').trim();
    const safeDistrict = (data.district || '').trim();
    const discount = typeof data.discount === 'number' ? data.discount : 0;
    const showDiscount = discount > 0;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; background: #f5f5f7; margin: 0; padding: 0; }
            .container { max-width: 640px; margin: 0 auto; padding: 24px; }
            .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
            .header { padding: 22px 24px; border-bottom: 1px solid #e5e7eb; }
            .brand { font-weight: 700; font-size: 14px; letter-spacing: 0.2px; color: #111827; margin: 0 0 8px 0; }
            .title { font-weight: 800; font-size: 22px; margin: 0; color: #111827; }
            .sub { margin: 6px 0 0 0; color: #6b7280; font-size: 13px; }
            .content { padding: 24px; }
            .section { background: #f9fafb; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #eef2f7; }
            .section h3 { margin: 0 0 10px 0; font-size: 14px; color: #111827; }
            .bank-section { background: #ecfdf5; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #10b981; }
            .bank-section h3 { margin: 0 0 16px 0; font-size: 16px; color: #065f46; }
            .bank-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1fae5; }
            .bank-row:last-child { border-bottom: none; }
            .bank-label { color: #047857; font-size: 13px; }
            .bank-value { color: #065f46; font-weight: 600; font-size: 14px; }
            .warning-box { background: #fffbeb; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #f59e0b; }
            .warning-box p { margin: 0; color: #92400e; font-size: 13px; }
            .muted { color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0 0 0; }
            th, td { font-size: 13px; }
            .total-row { font-weight: 800; }
            .footer { text-align: center; padding: 18px 24px 24px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <p class="brand">Vadiler</p>
                <h1 class="title">Siparişiniz Alındı - Ödeme Bekleniyor</h1>
                <p class="sub">Sipariş No: <strong>#${data.orderNumber}</strong></p>
              </div>
              <div class="content">
              <p>Merhaba ${data.customerName},</p>
              <p>Siparişiniz başarıyla oluşturuldu. Aşağıdaki banka hesabına havale/EFT yaparak ödemenizi tamamlayabilirsiniz.</p>

              <div class="bank-section">
                <h3>🏦 Banka Hesap Bilgileri</h3>
                <div style="margin-bottom: 12px;">
                  <div class="bank-label">Banka</div>
                  <div class="bank-value">Garanti Bankası</div>
                </div>
                <div style="margin-bottom: 12px;">
                  <div class="bank-label">IBAN</div>
                  <div class="bank-value" style="font-family: monospace;">TR12 0006 2000 7520 0006 2942 76</div>
                </div>
                <div style="margin-bottom: 12px;">
                  <div class="bank-label">Hesap Sahibi</div>
                  <div class="bank-value">STR GRUP A.Ş</div>
                </div>
                <div style="margin-bottom: 12px;">
                  <div class="bank-label">Ödenecek Tutar</div>
                  <div class="bank-value" style="font-size: 18px; color: #059669;">${data.total.toFixed(2)} ₺</div>
                </div>
              </div>

              <div class="warning-box">
                <p><strong>⚠️ Önemli:</strong> Havale/EFT yaparken açıklama kısmına mutlaka sipariş numaranızı (<strong>${data.orderNumber}</strong>) yazınız. Aksi takdirde ödemeniz eşleştirilemeyebilir.</p>
              </div>

              <div class="section">
                <h3>Sipariş Bilgileri</h3>
                <p><strong>Sipariş No:</strong> #${data.orderNumber}</p>
                <p><strong>Ödeme Yöntemi:</strong> Havale/EFT</p>
                <p><strong>İletişim:</strong> ${data.customerEmail}${safeCustomerPhone ? ` • ${safeCustomerPhone}` : ''}</p>
              </div>
              
              <div class="section">
                <h3>Teslimat Bilgileri</h3>
                ${safeRecipientName ? `<p><strong>Alıcı:</strong> ${safeRecipientName}${safeRecipientPhone ? ` • ${safeRecipientPhone}` : ''}</p>` : ''}
                <p><strong>Adres:</strong> ${data.deliveryAddress}</p>
                ${safeDistrict ? `<p><strong>İlçe:</strong> ${safeDistrict}</p>` : ''}
                <p><strong>Tarih:</strong> ${data.deliveryDate}</p>
                <p><strong>Zaman:</strong> ${data.deliveryTime}</p>
              </div>

              <h3>Sipariş Detayları</h3>
              <table>
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 10px; text-align: left;">Ürün</th>
                    <th style="padding: 10px; text-align: center;">Adet</th>
                    <th style="padding: 10px; text-align: right;">Fiyat</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 10px; text-align: right;">Ara Toplam:</td>
                    <td style="padding: 10px; text-align: right;">${data.subtotal.toFixed(2)} ₺</td>
                  </tr>
                  ${showDiscount ? `
                  <tr>
                    <td colspan="2" style="padding: 10px; text-align: right;">İndirim:</td>
                    <td style="padding: 10px; text-align: right;">-${discount.toFixed(2)} ₺</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td colspan="2" style="padding: 10px; text-align: right;">Teslimat Ücreti:</td>
                    <td style="padding: 10px; text-align: right;">${data.deliveryFee === 0 ? 'ÜCRETSİZ' : data.deliveryFee.toFixed(2) + ' ₺'}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="2" style="padding: 10px; text-align: right; border-top: 2px solid #e5e7eb;">TOPLAM:</td>
                    <td style="padding: 10px; text-align: right; border-top: 2px solid #e5e7eb; color: #059669; font-size: 16px;">${data.total.toFixed(2)} ₺</td>
                  </tr>
                </tfoot>
              </table>

              <div style="text-align: center; margin-top: 24px;">
                <a href="${trackingUrl}" style="display:inline-block;background:#059669;color:#ffffff !important;padding:12px 18px;text-decoration:none;border-radius:10px;font-weight:700;letter-spacing:0.2px;">Siparişimi Takip Et</a>
              </div>

              <p style="margin-top: 26px; font-size: 12px; color: #6b7280;">
                Ödemenizi yaptıktan sonra siparişiniz onaylanacak ve size bilgi verilecektir. Sorularınız için <strong>0850 307 4876</strong> numaralı telefondan bize ulaşabilirsiniz.
              </p>
              </div>
              <div class="footer">
                <p style="margin:0;">Vadiler Çiçekçilik</p>
                <p style="margin:6px 0 0 0;">Bu email ${data.customerEmail} adresine gönderilmiştir.</p>
              </div>
            </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: data.customerEmail,
      subject: `Siparişiniz Alındı - Ödeme Bekleniyor - #${data.orderNumber}`,
      html,
      text: `Siparişiniz alındı! Sipariş No: ${data.orderNumber}. Havale/EFT için: Garanti Bankası, IBAN: TR12 0006 2000 7520 0006 2942 76, Hesap Sahibi: STR GRUP A.Ş, Tutar: ${data.total.toFixed(2)} ₺. Açıklamaya sipariş numaranızı yazınız. Sipariş takibi: ${trackingUrl}`,
    });
  }
}
