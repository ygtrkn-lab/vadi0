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
 * Complete payment server-side to prevent lost payments
 */
async function completePaymentServerSide(token: string, conversationId?: string): Promise<{
  success: boolean;
  orderId?: string;
  error?: string;
}> {
  try {
    // Find order by token or conversationId
    let order: JsonRecord | null = null;

    if (conversationId) {
      const { data } = await supabase
        .from('orders')
        .select('id, status, payment, timeline')
        .eq('id', conversationId)
        .single();
      order = data;
    }

    if (!order) {
      const { data } = await supabase
        .from('orders')
        .select('id, status, payment, timeline')
        .contains('payment', { token })
        .single();
      order = data;
    }

    if (!order) {
      console.error('⚠️ Server-side completion: Order not found for token');
      return { success: false, error: 'Order not found' };
    }

    const orderId = order.id as string;
    const existingPayment = isRecord(order.payment) ? order.payment : {};
    const existingPaymentStatus = typeof existingPayment.status === 'string' ? existingPayment.status : '';

    // Idempotency: if already paid, skip
    if (existingPaymentStatus.toLowerCase() === 'paid') {
      console.log('✅ Server-side completion: Order already paid, skipping');
      return { success: true, orderId };
    }

    // Retrieve payment result from iyzico
    const iyzicoClient = getIyzicoClient();
    const result = await iyzicoClient.retrieveCheckoutForm({
      locale: 'tr',
      conversationId: orderId,
      token,
    });

    // Check if payment was successful
    if (result.status !== 'success' || String(result.paymentStatus).toUpperCase() !== 'SUCCESS') {
      console.log('⚠️ Server-side completion: Payment not successful', {
        status: result.status,
        paymentStatus: result.paymentStatus,
        errorMessage: result.errorMessage,
      });
      return { success: false, orderId, error: result.errorMessage || 'Payment not successful' };
    }

    // Update order to confirmed
    const nowIso = new Date().toISOString();
    const timeline = Array.isArray(order.timeline) ? order.timeline : [];
    const nextTimeline = [
      ...timeline,
      { status: 'confirmed', timestamp: nowIso, note: 'Ödeme onaylandı (server-side)', automated: true },
    ];

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment: {
          ...existingPayment,
          method: 'credit_card',
          status: 'paid',
          transactionId: result.paymentId,
          token,
          cardLast4: result.lastFourDigits,
          paidAt: nowIso,
          cardType: result.cardType,
          cardAssociation: result.cardAssociation,
          installment: result.installment,
          paidPrice: result.paidPrice,
        },
        timeline: nextTimeline,
        updated_at: nowIso,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('❌ Server-side completion: Failed to update order', updateError);
      return { success: false, orderId, error: 'Failed to update order' };
    }

    console.log('✅ Server-side completion: Order updated successfully', { orderId });

    // Send confirmation email (non-blocking)
    try {
      const { data: fullOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fullOrder?.customer_email && fullOrder?.order_number) {
        const { EmailService } = await import('@/lib/email/emailService');
        const delivery = isRecord(fullOrder.delivery) ? fullOrder.delivery : {};
        const products = fullOrder.products;
        const items = Array.isArray(products)
          ? products
              .filter((p): p is Record<string, unknown> => isRecord(p))
              .map((p) => ({
                name: (p.name as string) || '',
                quantity: Number(p.quantity ?? 0),
                price: Number(p.price ?? 0),
              }))
          : [];

        await EmailService.sendOrderConfirmation({
          orderNumber: String(fullOrder.order_number),
          customerName: fullOrder.customer_name || '',
          customerEmail: fullOrder.customer_email,
          customerPhone: fullOrder.customer_phone || '',
          verificationType: 'email',
          verificationValue: fullOrder.customer_email,
          items,
          subtotal: Number(fullOrder.subtotal || 0),
          discount: Number(fullOrder.discount || 0),
          deliveryFee: Number(fullOrder.delivery_fee || 0),
          total: Number(fullOrder.total || 0),
          deliveryAddress: (delivery.fullAddress || delivery.recipientAddress || delivery.address) as string | undefined,
          district: delivery.district as string | undefined,
          deliveryDate: delivery.deliveryDate as string | undefined,
          deliveryTime: (delivery.deliveryTimeSlot || delivery.deliveryTime) as string | undefined,
          recipientName: delivery.recipientName as string | undefined,
          recipientPhone: delivery.recipientPhone as string | undefined,
          paymentMethod: 'credit_card',
        });
        console.log('✅ Server-side completion: Email sent', { orderId });
      }
    } catch (emailErr) {
      console.error('⚠️ Server-side completion: Email failed (non-blocking)', emailErr);
    }

    return { success: true, orderId };
  } catch (err) {
    console.error('❌ Server-side completion error:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * POST /payment/complete
 * 
 * Handles POST redirects from banks/payment providers after 3DS verification.
 * Banks may POST directly to this URL instead of going through /api/payment/callback.
 * 
 * IMPORTANT: We now complete payment SERVER-SIDE before redirecting to frontend.
 * This prevents payments from being lost if user closes browser.
 */
export async function POST(request: NextRequest) {
  try {
    // Try to extract token from form body
    let token: string | null = null;
    let conversationId: string | null = null;
    
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      token = formData.get('token') as string || null;
      conversationId = formData.get('conversationId') as string || null;
      
      // iyzico might also send paymentId
      if (!token) {
        const paymentId = formData.get('paymentId') as string || null;
        if (paymentId) {
          token = paymentId;
        }
      }
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      token = body.token || body.paymentId || null;
      conversationId = body.conversationId || null;
    }
    
    // Also check URL params (some banks put token in query string even for POST)
    if (!token) {
      token = request.nextUrl.searchParams.get('token');
    }
    if (!conversationId) {
      conversationId = request.nextUrl.searchParams.get('conversationId');
    }
    
    if (!token) {
      // Redirect to view page with error
      const errorUrl = new URL('/payment/complete-view', request.nextUrl.origin);
      errorUrl.searchParams.set('error', 'Ödeme bilgileri eksik');
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // CRITICAL: Complete payment SERVER-SIDE before redirecting
    const completionResult = await completePaymentServerSide(token, conversationId || undefined);
    
    // Redirect to view page with token
    // The view page will call /api/payment/complete to get result data
    const viewUrl = new URL('/payment/complete-view', request.nextUrl.origin);
    viewUrl.searchParams.set('token', token);
    if (conversationId) {
      viewUrl.searchParams.set('conversationId', conversationId);
    }
    if (completionResult.success) {
      viewUrl.searchParams.set('serverCompleted', 'true');
    }
    
    return NextResponse.redirect(viewUrl, { status: 303 });
  } catch (error) {
    console.error('[payment/complete POST] Error:', error);
    
    const errorUrl = new URL('/payment/complete-view', request.nextUrl.origin);
    errorUrl.searchParams.set('error', 'Bir hata oluştu');
    return NextResponse.redirect(errorUrl, { status: 303 });
  }
}

/**
 * GET /payment/complete
 * 
 * Handles GET requests (manual refresh, direct navigation).
 * If token is present, attempts server-side completion before redirecting.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const conversationId = request.nextUrl.searchParams.get('conversationId');
  
  // If we have a token, try to complete payment server-side
  let serverCompleted = false;
  if (token) {
    const completionResult = await completePaymentServerSide(token, conversationId || undefined);
    serverCompleted = completionResult.success;
  }

  // Preserve all query params and redirect to view page
  const viewUrl = new URL('/payment/complete-view', request.nextUrl.origin);
  
  // Copy all search params
  request.nextUrl.searchParams.forEach((value, key) => {
    viewUrl.searchParams.set(key, value);
  });
  
  // Add server completion status
  if (serverCompleted) {
    viewUrl.searchParams.set('serverCompleted', 'true');
  }
  
  return NextResponse.redirect(viewUrl, { status: 303 });
}
