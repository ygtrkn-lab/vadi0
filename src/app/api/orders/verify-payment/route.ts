import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getIyzicoClient } from '@/lib/payment/iyzico';

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
 * POST /api/orders/verify-payment
 * 
 * Manuel ödeme doğrulama endpoint'i.
 * Admin panelden çağrılır.
 * 
 * iyzico'dan ödeme durumunu sorgular ve siparişi günceller.
 * 
 * Body:
 * - orderId: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

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
    const token = typeof payment.token === 'string' ? payment.token : null;
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

    // Check if we have a token to verify with iyzico
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Bu siparişte iyzico token bilgisi bulunamadı. Ödeme başlatılmamış olabilir.',
        noToken: true,
      }, { status: 400 });
    }

    // Query iyzico for actual payment status
    const iyzicoClient = getIyzicoClient();
    let iyzicoResult;
    
    try {
      iyzicoResult = await iyzicoClient.retrieveCheckoutForm({
        locale: 'tr',
        conversationId: orderId,
        token,
      });
    } catch (iyzicoError) {
      console.error('❌ iyzico API error:', iyzicoError);
      return NextResponse.json({
        success: false,
        error: 'iyzico API hatası: ' + (iyzicoError instanceof Error ? iyzicoError.message : String(iyzicoError)),
        iyzicoError: true,
      }, { status: 500 });
    }

    console.log('🔷 iyzico verification result:', {
      orderId,
      status: iyzicoResult.status,
      paymentStatus: iyzicoResult.paymentStatus,
      paymentId: iyzicoResult.paymentId,
      errorMessage: iyzicoResult.errorMessage,
    });

    // Check if payment was successful
    if (iyzicoResult.status === 'success' && String(iyzicoResult.paymentStatus).toUpperCase() === 'SUCCESS') {
      // Payment was successful - update order
      const nowIso = new Date().toISOString();
      const timeline = Array.isArray(order.timeline) ? [...order.timeline] : [];
      timeline.push({
        status: 'confirmed',
        timestamp: nowIso,
        note: 'Ödeme manuel olarak doğrulandı (admin)',
        automated: false,
      });

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment: {
            ...payment,
            method: 'credit_card',
            status: 'paid',
            transactionId: iyzicoResult.paymentId,
            cardLast4: iyzicoResult.lastFourDigits,
            paidAt: nowIso,
            cardType: iyzicoResult.cardType,
            cardAssociation: iyzicoResult.cardAssociation,
            installment: iyzicoResult.installment,
            paidPrice: iyzicoResult.paidPrice,
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
            paymentMethod: 'credit_card',
          });
          console.log('✅ Confirmation email sent for manually verified order:', orderId);
        }
      } catch (emailErr) {
        console.error('⚠️ Email failed for manually verified order:', emailErr);
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'Ödeme başarıyla doğrulandı ve sipariş güncellendi',
        verified: true,
        iyzicoResult: {
          paymentId: iyzicoResult.paymentId,
          paidPrice: iyzicoResult.paidPrice,
          cardLast4: iyzicoResult.lastFourDigits,
          cardType: iyzicoResult.cardType,
        },
        order: {
          id: orderId,
          orderNumber: order.order_number,
          newStatus: 'confirmed',
          paymentStatus: 'paid',
        },
      });
    } else if (iyzicoResult.status === 'failure' || String(iyzicoResult.paymentStatus).toUpperCase() === 'FAILURE') {
      // Payment failed
      return NextResponse.json({
        success: false,
        paymentFailed: true,
        message: 'iyzico\'da ödeme başarısız olarak görünüyor',
        iyzicoResult: {
          status: iyzicoResult.status,
          paymentStatus: iyzicoResult.paymentStatus,
          errorCode: iyzicoResult.errorCode,
          errorMessage: iyzicoResult.errorMessage,
          errorGroup: iyzicoResult.errorGroup,
        },
      });
    } else {
      // Payment still pending or unknown status
      return NextResponse.json({
        success: false,
        pending: true,
        message: 'Ödeme henüz tamamlanmamış veya durumu belirsiz',
        iyzicoResult: {
          status: iyzicoResult.status,
          paymentStatus: iyzicoResult.paymentStatus,
          errorMessage: iyzicoResult.errorMessage,
        },
      });
    }
  } catch (error) {
    console.error('❌ Verify payment error:', error);
    return NextResponse.json({
      success: false,
      error: 'Bir hata oluştu: ' + (error instanceof Error ? error.message : String(error)),
    }, { status: 500 });
  }
}
