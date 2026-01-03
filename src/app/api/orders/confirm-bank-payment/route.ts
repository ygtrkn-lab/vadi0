import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '@/lib/email/emailService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getString(value: unknown): string {
  if (typeof value === 'string') return value;
  return '';
}

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Siparişi getir
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = data as Record<string, unknown>;

    // Zaten onaylanmış mı kontrol et
    const payment = isRecord(order.payment) ? order.payment : {};
    if (getString(payment.status) === 'paid') {
      return NextResponse.json({ error: 'Payment already confirmed' }, { status: 400 });
    }

    // Ödeme ve sipariş durumunu güncelle
    const nowIso = new Date().toISOString();
    const existingTimeline = Array.isArray(order.timeline) ? order.timeline : [];
    const newTimeline = [
      ...existingTimeline,
      {
        status: 'confirmed',
        timestamp: nowIso,
        note: 'Havale ödemesi admin tarafından onaylandı',
      },
    ];

    const updatePayload = {
      status: 'confirmed' as const,
      payment: {
        ...payment,
        status: 'paid',
        paidAt: nowIso,
      },
      timeline: newTimeline,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await supabase
      .from('orders')
      .update(updatePayload as any)
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // Müşteriye sipariş onay e-postası gönder
    const products = Array.isArray(order.products) ? order.products : [];
    const delivery = isRecord(order.delivery) ? order.delivery : {};

    try {
      await EmailService.sendOrderConfirmation({
        orderNumber: String(order.order_number),
        customerName: String(order.customer_name || ''),
        customerEmail: String(order.customer_email || ''),
        customerPhone: String(order.customer_phone || ''),
        verificationType: 'email',
        verificationValue: String(order.customer_email || ''),
        items: (products as Array<Record<string, unknown>>).map((p) => ({
          name: getString(p.name),
          quantity: Number(p.quantity) || 1,
          price: Number(p.price) || 0,
        })),
        subtotal: Number(order.subtotal) || 0,
        discount: Number(order.discount) || 0,
        deliveryFee: Number(order.delivery_fee) || 0,
        total: Number(order.total) || 0,
        deliveryAddress: getString(delivery.fullAddress),
        district: getString(delivery.district),
        deliveryDate: getString(delivery.deliveryDate),
        deliveryTime: getString(delivery.deliveryTimeSlot),
        recipientName: getString(delivery.recipientName),
        recipientPhone: getString(delivery.recipientPhone),
        paymentMethod: 'Havale/EFT (Onaylandı)',
      });
      console.log('✅ Order confirmation email sent for bank transfer order:', order.order_number);
    } catch (emailError) {
      console.error('❌ Failed to send confirmation email:', emailError);
      // Email hatası sipariş onayını engellemez
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in confirm-bank-payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
