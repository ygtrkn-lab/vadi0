import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email/emailService';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Test endpoint - 3 farklı hatırlatma emailini gönderir
 * GET /api/test/send-reminder-emails?email=test@example.com
 * GET /api/test/send-reminder-emails?orderNumber=100320
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  const orderNumber = request.nextUrl.searchParams.get('orderNumber');
  
  // Gerçek sipariş numarası verilmişse o siparişin bilgilerini çek
  if (orderNumber) {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', parseInt(orderNumber))
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı', orderNumber }, { status: 404 });
    }

    const customerEmail = order.customer_email;
    if (!customerEmail) {
      return NextResponse.json({ error: 'Siparişte email adresi yok' }, { status: 400 });
    }

    const delivery = order.delivery || {};
    const products = order.products || [];
    
    const testData = {
      customerEmail,
      customerName: order.customer_name || 'Değerli Müşterimiz',
      orderNumber: String(order.order_number),
      items: products.map((p: any) => ({
        name: p.name || 'Ürün',
        quantity: p.quantity || 1,
        price: p.price || 0,
        imageUrl: p.image || p.imageUrl || undefined,
      })),
      total: order.total || 0,
      deliveryDate: delivery.deliveryDate ? new Date(delivery.deliveryDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined,
      deliveryTime: delivery.deliveryTimeSlot || undefined,
      createdAt: order.created_at,
    };

    const results = [];

    try {
      // 1. Hatırlatma - Mavi (Nazik)
      const r1 = await EmailService.sendPaymentReminderEmail({ 
        ...testData, 
        status: 'pending_payment', 
        reminderCount: 1 
      });
      results.push({ reminder: 1, success: r1, subject: '🛒 Siparişiniz bekliyor!' });

      // 2. Hatırlatma - Turuncu (Uyarı)
      const r2 = await EmailService.sendPaymentReminderEmail({ 
        ...testData, 
        status: 'pending_payment', 
        reminderCount: 2 
      });
      results.push({ reminder: 2, success: r2, subject: '⏰ Ödemenizi unutmayın!' });

      // 3. Hatırlatma - Kırmızı (Acil)
      const r3 = await EmailService.sendPaymentReminderEmail({ 
        ...testData, 
        status: 'payment_failed', 
        reminderCount: 3 
      });
      results.push({ reminder: 3, success: r3, subject: '🚨 Son Hatırlatma!' });

      return NextResponse.json({
        success: true,
        message: `3 hatırlatma emaili ${customerEmail} adresine gönderildi (Sipariş #${orderNumber})`,
        order: { orderNumber: order.order_number, customerEmail, total: order.total },
        results
      });
    } catch (error) {
      console.error('Email gönderme hatası:', error);
      return NextResponse.json({ 
        error: 'Email gönderme hatası', 
        details: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }
  }
  
  // Sadece email verilmişse test datası kullan
  if (!email) {
    return NextResponse.json({ error: 'Email veya orderNumber parametresi gerekli' }, { status: 400 });
  }

  const testData = {
    customerEmail: email,
    customerName: 'Yiğit',
    orderNumber: '100999',
    items: [
      { 
        name: 'Kırmızı Güller Buketi', 
        quantity: 1, 
        price: 850, 
        imageUrl: 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1766847863/uploads/img-6836-1766847862813-pn1dwe4.jpg' 
      },
      { 
        name: 'Özel Çikolata Kutusu', 
        quantity: 2, 
        price: 150 
      }
    ],
    total: 1150,
    deliveryDate: '12 Ocak 2026',
    deliveryTime: '14:00-18:00',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  };

  const results = [];

  try {
    // 1. Hatırlatma
    const r1 = await EmailService.sendPaymentReminderEmail({ 
      ...testData, 
      status: 'pending_payment', 
      reminderCount: 1 
    });
    results.push({ reminder: 1, success: r1, subject: '🛒 Siparişiniz bekliyor!' });

    // 2. Hatırlatma
    const r2 = await EmailService.sendPaymentReminderEmail({ 
      ...testData, 
      status: 'pending_payment', 
      reminderCount: 2 
    });
    results.push({ reminder: 2, success: r2, subject: '⏰ Ödemenizi unutmayın!' });

    // 3. Hatırlatma
    const r3 = await EmailService.sendPaymentReminderEmail({ 
      ...testData, 
      status: 'payment_failed', 
      reminderCount: 3 
    });
    results.push({ reminder: 3, success: r3, subject: '🚨 Son Hatırlatma!' });

    return NextResponse.json({
      success: true,
      message: `3 test emaili ${email} adresine gönderildi`,
      results
    });

  } catch (error) {
    console.error('Email gönderme hatası:', error);
    return NextResponse.json({ 
      error: 'Email gönderme hatası', 
      details: error instanceof Error ? error.message : 'Unknown error',
      results 
    }, { status: 500 });
  }
}
