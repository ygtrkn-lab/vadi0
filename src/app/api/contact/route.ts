import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message, agreement } = body;

    // Validation
    if (!name || !email || !subject || !message || !agreement) {
      return NextResponse.json(
        { success: false, message: 'Lütfen tüm zorunlu alanları doldurun.' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Geçerli bir e-posta adresi girin.' },
        { status: 400 }
      );
    }

    // Phone validation (optional field, but validate if provided)
    if (phone) {
      const phoneRegex = /^[\d\s()+\-]+$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { success: false, message: 'Geçerli bir telefon numarası girin.' },
          { status: 400 }
        );
      }
    }

    // Log contact form submission (In production, save to database or send email)
    console.log('Contact Form Submission:', {
      name,
      email,
      phone,
      subject,
      message,
      timestamp: new Date().toISOString()
    });

    // TODO: Implement email sending using EmailService
    // Example:
    // await emailService.sendContactForm({
    //   to: 'info@vadilercicek.com',
    //   from: email,
    //   subject: `İletişim Formu: ${subject}`,
    //   html: `
    //     <h2>Yeni İletişim Formu Mesajı</h2>
    //     <p><strong>Ad Soyad:</strong> ${name}</p>
    //     <p><strong>E-posta:</strong> ${email}</p>
    //     <p><strong>Telefon:</strong> ${phone || 'Belirtilmedi'}</p>
    //     <p><strong>Konu:</strong> ${subject}</p>
    //     <p><strong>Mesaj:</strong></p>
    //     <p>${message}</p>
    //   `
    // });

    // Success response
    return NextResponse.json(
      {
        success: true,
        message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
      },
      { status: 500 }
    );
  }
}
