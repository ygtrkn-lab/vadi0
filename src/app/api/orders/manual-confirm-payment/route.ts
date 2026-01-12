import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null;
}

/**
 * POST /api/orders/manual-confirm-payment
 * 
 * Manuel ödeme onaylama endpoint'i.
 * Admin panelden çağrılır.
 * 
 * iyzico'ya sormadan direkt olarak siparişi "ödendi" olarak işaretler.
 * SADECE admin kullanımı için - müşteriye güvenildiğinde kullanılır.
 * 
 * Body:
 * - orderId: string
 * - note?: string (opsiyonel not)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, note } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Sipariş ID gerekli' },
        { status: 400 }
      );
    }

    // Get order from database
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { success: false, error: 'Sipariş bulunamadı' },
        { status: 404 }
      );
    }

    const payment = isRecord(order.payment) ? order.payment : {};
    const existingPaymentStatus = typeof payment.status === 'string' ? payment.status : '';

    // If already paid, return success
    if (existingPaymentStatus.toLowerCase() === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Ödeme zaten onaylanmış',
        alreadyPaid: true,
        order: {
          id: order.id,
          orderNumber: order.order_number,
          status: order.status,
          paymentStatus: 'paid',
        },
      });
    }

    // Update order to confirmed with manual payment confirmation
    const nowIso = new Date().toISOString();
    const timeline = Array.isArray(order.timeline) ? [...order.timeline] : [];
    timeline.push({
      status: 'confirmed',
      timestamp: nowIso,
      note: note || 'Ödeme manuel olarak onaylandı (admin)',
      automated: false,
      manualConfirmation: true,
    });

    const paymentMethod = typeof payment.method === 'string' ? payment.method : 'credit_card';

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment: {
          ...payment,
          method: paymentMethod,
          status: 'paid',
          paidAt: nowIso,
          manuallyConfirmed: true,
          manualConfirmationNote: note || 'Admin tarafından manuel onaylandı',
        },
        timeline,
        updated_at: nowIso,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('❌ Failed to update order:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Sipariş güncellenemedi: ' + updateError.message,
      }, { status: 500 });
    }

    console.log('✅ Order manually confirmed:', { orderId, orderNumber: order.order_number });

    // Send confirmation email (non-blocking)
    try {
      if (order.customer_email && order.order_number) {
        const { EmailService } = await import('@/lib/email/emailService');
        const delivery = isRecord(order.delivery) ? order.delivery : {};
        const products = order.products;
        const items = Array.isArray(products)
          ? products
              .filter((p: unknown): p is Record<string, unknown> => isRecord(p))
              .map((p: Record<string, unknown>) => ({
                name: (p.name as string) || '',
                quantity: Number(p.quantity ?? 0),
                price: Number(p.price ?? 0),
                imageUrl: (p.image as string) || (p.imageUrl as string) || (p.hoverImage as string) || undefined,
              }))
          : [];

        await EmailService.sendOrderConfirmation({
          orderNumber: String(order.order_number),
          customerName: order.customer_name || '',
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone || '',
          verificationType: 'email',
          verificationValue: order.customer_email,
          items,
          subtotal: Number(order.subtotal || 0),
          discount: Number(order.discount || 0),
          deliveryFee: Number(order.delivery_fee || 0),
          total: Number(order.total || 0),
          deliveryAddress: (delivery.fullAddress || delivery.recipientAddress || delivery.address) as string | undefined,
          district: delivery.district as string | undefined,
          deliveryDate: delivery.deliveryDate as string | undefined,
          deliveryTime: (delivery.deliveryTimeSlot || delivery.deliveryTime) as string | undefined,
          recipientName: delivery.recipientName as string | undefined,
          recipientPhone: delivery.recipientPhone as string | undefined,
          paymentMethod: paymentMethod,
        });
        console.log('✅ Confirmation email sent for manually confirmed order:', orderId);
      }
    } catch (emailErr) {
      console.error('⚠️ Email failed for manually confirmed order:', emailErr);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Ödeme manuel olarak onaylandı',
      order: {
        id: orderId,
        orderNumber: order.order_number,
        newStatus: 'confirmed',
        paymentStatus: 'paid',
      },
    });
  } catch (error) {
    console.error('❌ Manual confirm payment error:', error);
    return NextResponse.json({
      success: false,
      error: 'Bir hata oluştu: ' + (error instanceof Error ? error.message : String(error)),
    }, { status: 500 });
  }
}
