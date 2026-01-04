import { NextRequest, NextResponse } from 'next/server';
import { validate3DSStatus } from '@/lib/payment/helpers';
import { getIyzicoClient } from '@/lib/payment/iyzico';
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
 * Complete payment server-side to prevent lost payments
 * This runs BEFORE redirecting to frontend
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
      { status: 'confirmed', timestamp: nowIso, note: 'Ödeme onaylandı (server-side callback)', automated: true },
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
 * POST /api/payment/callback
 *
 * Handles callbacks from:
 * - Checkout Form: token-based callback
 * - 3DS: bank callback with paymentId/conversationId/mdStatus
 * 
 * IMPORTANT: We now complete payment SERVER-SIDE before redirecting to frontend.
 * This prevents payments from being lost if user closes browser.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Checkout Form callback
    const token = formData.get('token') as string | null;
    const checkoutConversationId = formData.get('conversationId') as string | null;
    if (token) {
      // CRITICAL: Complete payment SERVER-SIDE before redirecting
      // This ensures payment is captured even if user closes browser
      const completionResult = await completePaymentServerSide(token, checkoutConversationId || undefined);
      
      const completeUrl = new URL('/payment/complete', appUrl);
      completeUrl.searchParams.set('token', token);
      if (checkoutConversationId) {
        completeUrl.searchParams.set('conversationId', checkoutConversationId);
      }
      // Add server-side completion status to URL for frontend awareness
      if (completionResult.success) {
        completeUrl.searchParams.set('serverCompleted', 'true');
      }
      return NextResponse.redirect(completeUrl);
    }

    // 3DS callback
    const paymentId = formData.get('paymentId') as string | null;
    const conversationId = formData.get('conversationId') as string | null;
    const mdStatus = formData.get('mdStatus') as string | null;
    const status = formData.get('status') as string | null;

    console.log('🔷 3DS Callback received:', {
      paymentId,
      conversationId,
      mdStatus,
      status,
    });

    if (!paymentId || !conversationId || !mdStatus) {
      const failureUrl = new URL('/payment/failure', appUrl);
      failureUrl.searchParams.set('error', 'Missing callback parameters');
      return NextResponse.redirect(failureUrl);
    }

    const validation = validate3DSStatus(mdStatus);
    if (!validation.isValid) {
      const failureUrl = new URL('/payment/failure', appUrl);
      failureUrl.searchParams.set('error', validation.message);
      failureUrl.searchParams.set('conversationId', conversationId);
      return NextResponse.redirect(failureUrl);
    }

    const completeUrl = new URL('/payment/complete', appUrl);
    completeUrl.searchParams.set('paymentId', paymentId);
    completeUrl.searchParams.set('conversationId', conversationId);
    completeUrl.searchParams.set('mdStatus', mdStatus);
    return NextResponse.redirect(completeUrl);
  } catch (error: any) {
    console.error('❌ Callback processing error:', error);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const failureUrl = new URL('/payment/failure', appUrl);
    failureUrl.searchParams.set('error', 'Callback processing failed');
    return NextResponse.redirect(failureUrl);
  }
}

/**
 * GET /api/payment/callback
 * Some providers may use GET instead of POST.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  // Checkout Form callback
  const token = searchParams.get('token');
  const checkoutConversationId = searchParams.get('conversationId');
  if (token) {
    // CRITICAL: Complete payment SERVER-SIDE before redirecting
    // This ensures payment is captured even if user closes browser
    const completionResult = await completePaymentServerSide(token, checkoutConversationId || undefined);
    
    const completeUrl = new URL('/payment/complete', appUrl);
    completeUrl.searchParams.set('token', token);
    if (checkoutConversationId) {
      completeUrl.searchParams.set('conversationId', checkoutConversationId);
    }
    // Add server-side completion status to URL for frontend awareness
    if (completionResult.success) {
      completeUrl.searchParams.set('serverCompleted', 'true');
    }
    return NextResponse.redirect(completeUrl);
  }

  // 3DS callback
  const paymentId = searchParams.get('paymentId');
  const conversationId = searchParams.get('conversationId');
  const mdStatus = searchParams.get('mdStatus');
  const status = searchParams.get('status');

  console.log('🔷 3DS Callback received (GET):', {
    paymentId,
    conversationId,
    mdStatus,
    status,
  });

  if (!paymentId || !conversationId || !mdStatus) {
    const failureUrl = new URL('/payment/failure', appUrl);
    failureUrl.searchParams.set('error', 'Missing callback parameters');
    return NextResponse.redirect(failureUrl);
  }

  const validation = validate3DSStatus(mdStatus);
  if (!validation.isValid) {
    const failureUrl = new URL('/payment/failure', appUrl);
    failureUrl.searchParams.set('error', validation.message);
    failureUrl.searchParams.set('conversationId', conversationId);
    return NextResponse.redirect(failureUrl);
  }

  const completeUrl = new URL('/payment/complete', appUrl);
  completeUrl.searchParams.set('paymentId', paymentId);
  completeUrl.searchParams.set('conversationId', conversationId);
  completeUrl.searchParams.set('mdStatus', mdStatus);
  return NextResponse.redirect(completeUrl);
}
