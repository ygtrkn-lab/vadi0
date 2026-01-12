import { NextRequest, NextResponse } from 'next/server';
import { getIyzicoClient } from '@/lib/payment/iyzico';
import { validatePaymentResponse } from '@/lib/payment/helpers';
import { createClient } from '@supabase/supabase-js';
import { 
  completePaymentServerSide, 
  markOrderPaymentFailed, 
  mapIyzicoErrorToTurkish,
  isTokenExpired 
} from '@/lib/payment/paymentCompletion';

// Initialize Supabase client (service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null;
}

function getStringProp(obj: unknown, key: string): string | undefined {
  if (!isRecord(obj)) return undefined;
  const val = obj[key];
  return typeof val === 'string' ? val : undefined;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * POST /api/payment/complete
 * Complete 3DS payment and update order in database
 * 
 * Request Body:
 * - conversationId: string (orderId)
 * - paymentId?: string (3DS)
 * - token?: string (checkout form)
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = body as {
      paymentId?: string;
      conversationId?: string;
      token?: string;
    };

    const paymentId = parsed.paymentId;
    const token = parsed.token;
    let conversationId = parsed.conversationId;

    if (!paymentId && !token) {
      return NextResponse.json(
        { error: 'Missing paymentId or token' },
        { status: 400 }
      );
    }

    // Checkout Form callback may only provide token. Resolve the orderId (conversationId) by token.
    if (!conversationId && token) {
      const { data: order, error: findError } = await supabase
        .from('orders')
        .select('id, payment')
        .contains('payment', { token })
        .single();

      if (findError || !order) {
        console.error('❌ Order not found for token:', token, findError);
        return NextResponse.json(
          { success: false, error: 'Sipariş bulunamadı. Lütfen sepetinize dönüp tekrar deneyin.' },
          { status: 404 }
        );
      }

      // Check token expiration before proceeding
      const tokenCreatedAt = getStringProp(order.payment, 'tokenCreatedAt');
      if (isTokenExpired(tokenCreatedAt)) {
        console.log('⚠️ Token expired for order:', order.id);
        return NextResponse.json(
          { success: false, error: 'Ödeme süresi doldu. Lütfen sayfayı yenileyip tekrar deneyin.' },
          { status: 400 }
        );
      }

      conversationId = order.id;
    }

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Missing conversationId' },
        { status: 400 }
      );
    }

    console.log('🔷 Completing payment:', { paymentId, token, conversationId });

    const iyzicoClient = getIyzicoClient();

    // Call iyzico to finalize/retrieve payment
    const result = token
      ? await iyzicoClient.retrieveCheckoutForm({
          locale: 'tr',
          conversationId,
          token,
        })
      : await iyzicoClient.completeThreeDS(paymentId, conversationId);

    // Validate response
    const validation = validatePaymentResponse(result);
    if (!validation.isValid) {
      console.error('❌ Payment failed:', validation.error, result);

      // Map to user-friendly Turkish error message
      const userFriendlyError = mapIyzicoErrorToTurkish(result.errorCode, result.errorMessage || validation.error);

      // Persist failure on the order so it doesn't stay in pending_payment
      if (conversationId) {
        try {
          await markOrderPaymentFailed({
            orderId: conversationId,
            token: token || undefined,
            paymentId: paymentId || getStringProp(result, 'paymentId'),
            errorMessage: userFriendlyError,
            errorCode: result.errorCode,
            gatewayResult: result,
          });
        } catch (e) {
          console.error('⚠️ Failed to persist payment failure on order:', e);
        }
      }

      return NextResponse.json(
        { 
          success: false,
          error: userFriendlyError, 
          result 
        },
        { status: 400 }
      );
    }

    // For Checkout Form retrieval, also require actual paymentStatus success when present.
    if (token && result.paymentStatus && String(result.paymentStatus).toUpperCase() !== 'SUCCESS') {
      const userFriendlyError = mapIyzicoErrorToTurkish(result.errorCode, result.errorMessage);

      if (conversationId) {
        try {
          await markOrderPaymentFailed({
            orderId: conversationId,
            token,
            paymentId: paymentId || getStringProp(result, 'paymentId'),
            errorMessage: userFriendlyError,
            errorCode: result.errorCode,
            gatewayResult: result,
          });
        } catch (e) {
          console.error('⚠️ Failed to persist paymentStatus failure on order:', e);
        }
      }
      return NextResponse.json(
        {
          success: false,
          error: userFriendlyError,
          result,
        },
        { status: 400 }
      );
    }

    console.log('✅ Payment successful:', {
      paymentId: result.paymentId,
      conversationId: result.conversationId,
      paidPrice: result.paidPrice,
      lastFourDigits: result.lastFourDigits,
      token,
    });

    // Update order in Supabase
    try {
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (fetchError || !order) {
        console.error('❌ Order not found:', conversationId);
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // Idempotency: if already paid, return success
      const existingPaymentStatus = getStringProp(order?.payment, 'status');
      if (String(existingPaymentStatus).toLowerCase() === 'paid') {
        return NextResponse.json({
          success: true,
          orderId: conversationId,
          paymentId: getStringProp(order?.payment, 'transactionId') || getStringProp(result, 'paymentId'),
          paidAmount: (isRecord(order?.payment) ? order.payment.paidPrice : undefined) || order.total,
          cardLast4: getStringProp(order?.payment, 'cardLast4') || result.lastFourDigits,
          cardType: getStringProp(order?.payment, 'cardType') || result.cardType,
          message: 'Payment already completed',
        });
      }

      // Validate paid amount matches order total
      const paid = Number(result.paidPrice);
      const expected = Number(order.total);
      if (Number.isFinite(paid) && Number.isFinite(expected) && Math.abs(paid - expected) > 0.01) {
        console.error('❌ Paid amount mismatch', { conversationId, paid, expected });

        try {
          await markOrderPaymentFailed({
            orderId: conversationId,
            token: token || getStringProp(order?.payment, 'token'),
            paymentId: paymentId || getStringProp(result, 'paymentId'),
            errorMessage: 'Ödeme tutarı sipariş toplamıyla eşleşmiyor',
            gatewayResult: result,
          });
        } catch (e) {
          console.error('⚠️ Failed to persist paid-amount mismatch on order:', e);
        }

        return NextResponse.json(
          { success: false, error: 'Paid amount does not match order total', result },
          { status: 400 }
        );
      }

      const nowIso = new Date().toISOString();
      const timeline = Array.isArray(order?.timeline) ? order.timeline : [];
      const nextTimeline = [
        ...timeline,
        { status: 'confirmed', timestamp: nowIso, note: 'Ödeme onaylandı', automated: true },
      ];

      // Update order with payment details
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment: {
            method: 'credit_card',
            status: 'paid',
            transactionId: result.paymentId,
            token: token || getStringProp(order?.payment, 'token'),
            cardLast4: result.lastFourDigits,
            paidAt: new Date().toISOString(),
            cardType: result.cardType,
            cardAssociation: result.cardAssociation,
            installment: result.installment,
            paidPrice: result.paidPrice,
          },
          timeline: nextTimeline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (updateError) {
        console.error('❌ Failed to update order:', updateError);
        return NextResponse.json(
          { error: 'Failed to update order', details: updateError.message },
          { status: 500 }
        );
      }

      console.log('✅ Order updated successfully:', conversationId);

      // Send order confirmation email after successful payment
      try {
        const customerEmailToSend = (order.customer_email || '').trim();
        const orderNumber = order.order_number;

        if (customerEmailToSend && orderNumber) {
          const delivery = isRecord(order.delivery) ? order.delivery : {};

          const deliveryAddress =
            getStringProp(delivery, 'fullAddress') ||
            getStringProp(delivery, 'recipientAddress') ||
            getStringProp(delivery, 'address');

          const deliveryDate = getStringProp(delivery, 'deliveryDate');
          const deliveryTime = getStringProp(delivery, 'deliveryTimeSlot') || getStringProp(delivery, 'deliveryTime');

          const products = order.products;
          const items = Array.isArray(products)
            ? products
                .filter((p): p is Record<string, unknown> => isRecord(p))
                .map((p) => ({
                  name: getStringProp(p, 'name') || '',
                  quantity: Number(p['quantity'] ?? 0),
                  price: Number(p['price'] ?? 0),
                  imageUrl: getStringProp(p, 'image') || getStringProp(p, 'imageUrl') || getStringProp(p, 'hoverImage') || undefined,
                }))
            : [];

          const paymentMethod = getStringProp(order.payment, 'method') || 'credit_card';

          const { EmailService } = await import('@/lib/email/emailService');
          await EmailService.sendOrderConfirmation({
            orderNumber: String(orderNumber),
            customerName: order.customer_name || '',
            customerEmail: customerEmailToSend,
            customerPhone: order.customer_phone || '',
            verificationType: 'email',
            verificationValue: customerEmailToSend,
            items,
            subtotal: Number(order.subtotal || 0),
            discount: Number(order.discount || 0),
            deliveryFee: Number(order.delivery_fee || 0),
            total: Number(order.total || 0),
            deliveryAddress,
            district: getStringProp(delivery, 'district'),
            deliveryDate,
            deliveryTime,
            recipientName: getStringProp(delivery, 'recipientName'),
            recipientPhone: getStringProp(delivery, 'recipientPhone'),
            paymentMethod,
          });

          console.log('✅ Order confirmation email sent:', customerEmailToSend);
        }
      } catch (emailErr) {
        console.error('⚠️ Failed to send order confirmation email:', emailErr);
        // Do not fail the payment completion if email fails
      }

      // Return success response
      return NextResponse.json({
        success: true,
        orderId: conversationId,
        paymentId: result.paymentId,
        paidAmount: result.paidPrice,
        cardLast4: result.lastFourDigits,
        cardType: result.cardType,
        message: 'Payment completed successfully',
      });
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error', details: getErrorMessage(dbError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Payment completion exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payment/complete
 * Handle browser navigation after payment redirect from iyzico
 * Accepts: token, paymentId, conversationId as query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get('paymentId');
    const token = searchParams.get('token');
    const conversationId = searchParams.get('conversationId');

    if (!paymentId && !token) {
      return NextResponse.json(
        { error: 'Missing paymentId or token' },
        { status: 400 }
      );
    }

    console.log('🔷 GET request to complete payment:', { paymentId, token, conversationId });

    // Process payment completion with the same logic as POST
    let resolvedConversationId = conversationId;

    // Checkout Form callback may only provide token. Resolve the orderId (conversationId) by token.
    if (!resolvedConversationId && token) {
      const { data: order, error: findError } = await supabase
        .from('orders')
        .select('id, status, payment, total')
        .contains('payment', { token })
        .single();

      if (findError || !order) {
        console.error('❌ Order not found for token:', token, findError);
        return NextResponse.json(
          { success: false, error: 'Sipariş bulunamadı. Lütfen sipariş geçmişinizi kontrol edin.' },
          { status: 404 }
        );
      }

      resolvedConversationId = order.id;

      // Early idempotency check: if already paid, return success immediately without calling iyzico
      // This prevents TOKEN_ALREADY_USED errors when user refreshes the page
      const existingPaymentStatus = getStringProp(order?.payment, 'status');
      if (String(existingPaymentStatus).toLowerCase() === 'paid') {
        console.log('✅ Payment already completed (early check), returning cached result');
        return NextResponse.json(
          {
            success: true,
            orderId: resolvedConversationId,
            paymentId: getStringProp(order?.payment, 'transactionId'),
            paidAmount: (isRecord(order?.payment) ? (order.payment as any).paidPrice : undefined) || (order as any).total,
            cardLast4: getStringProp(order?.payment, 'cardLast4'),
            message: 'Ödeme zaten tamamlandı',
          },
          { status: 200 }
        );
      }
    }

    if (!resolvedConversationId) {
      return NextResponse.json(
        { success: false, error: 'Sipariş bilgisi eksik' },
        { status: 400 }
      );
    }

    const iyzicoClient = getIyzicoClient();

    // Call iyzico to finalize/retrieve payment
    const result = token
      ? await iyzicoClient.retrieveCheckoutForm({
          locale: 'tr',
          conversationId: resolvedConversationId,
          token,
        })
      : await iyzicoClient.completeThreeDS(paymentId, resolvedConversationId);

    // Validate response
    const validation = validatePaymentResponse(result);
    if (!validation.isValid) {
      console.error('❌ Payment failed:', validation.error);
      console.error('📋 Full iyzico response:', JSON.stringify(result, null, 2));
      console.error('🔍 Error details:', {
        errorCode: result?.errorCode,
        errorMessage: result?.errorMessage,
        errorGroup: result?.errorGroup,
        status: result?.status,
        paymentStatus: result?.paymentStatus,
      });

      // Map common iyzico error codes to Turkish messages
      let userFriendlyError = validation.error || 'Ödeme başarısız';
      const errorCode = String(result?.errorCode || '');
      if (errorCode.includes('TOKEN') || errorCode.includes('token')) {
        if (errorCode.includes('EXPIRED') || errorCode.includes('expired')) {
          userFriendlyError = 'Ödeme süresi doldu. Lütfen tekrar deneyin.';
        } else if (errorCode.includes('USED') || errorCode.includes('used')) {
          userFriendlyError = 'Ödeme zaten işlendi. Sipariş geçmişinizi kontrol edin.';
        } else {
          userFriendlyError = 'Ödeme doğrulama hatası. Lütfen tekrar deneyin.';
        }
      } else if (errorCode.includes('DECLINED') || String(result?.errorMessage || '').toLowerCase().includes('declined')) {
        userFriendlyError = 'Kartınız reddedildi. Lütfen başka bir kart deneyin.';
      } else if (errorCode.includes('3DS') || errorCode.includes('3ds')) {
        userFriendlyError = '3D Secure doğrulaması başarısız. Lütfen tekrar deneyin.';
      }

      if (resolvedConversationId) {
        try {
          await markOrderPaymentFailed({
            orderId: resolvedConversationId,
            token: token || undefined,
            paymentId: paymentId || getStringProp(result, 'paymentId'),
            errorMessage: validation.error || getStringProp(result, 'errorMessage') || 'Ödeme başarısız',
            gatewayResult: result,
          });
        } catch (e) {
          console.error('⚠️ Failed to persist payment failure on order:', e);
        }
      }

      // Return error as JSON for frontend to handle
      return NextResponse.json(
        {
          success: false,
          error: userFriendlyError,
          errorCode: result?.errorCode,
          conversationId: resolvedConversationId,
        },
        { status: 400 }
      );
    }

    // For Checkout Form retrieval, also require actual paymentStatus success when present.
    if (token && result.paymentStatus && String(result.paymentStatus).toUpperCase() !== 'SUCCESS') {
      if (resolvedConversationId) {
        try {
          await markOrderPaymentFailed({
            orderId: resolvedConversationId,
            token,
            paymentId: paymentId || getStringProp(result, 'paymentId'),
            errorMessage: getStringProp(result, 'errorMessage') || 'Ödeme başarısız',
            gatewayResult: result,
          });
        } catch (e) {
          console.error('⚠️ Failed to persist paymentStatus failure on order:', e);
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: result.errorMessage || 'Ödeme tamamlanamadı',
          conversationId: resolvedConversationId,
        },
        { status: 400 }
      );
    }

    console.log('✅ Payment successful (GET):', {
      paymentId: result.paymentId,
      conversationId: result.conversationId,
      paidPrice: result.paidPrice,
      lastFourDigits: result.lastFourDigits,
      token,
    });

    // Update order in Supabase
    try {
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', resolvedConversationId)
        .single();

      if (fetchError || !order) {
        console.error('❌ Order not found:', resolvedConversationId);
        return NextResponse.json(
          { success: false, error: 'Order not found', conversationId: resolvedConversationId },
          { status: 404 }
        );
      }

      // Idempotency: if already paid, return success JSON
      const existingPaymentStatus = getStringProp(order?.payment, 'status');
      if (String(existingPaymentStatus).toLowerCase() === 'paid') {
        console.log('✅ Payment already completed');
        return NextResponse.json(
          {
            success: true,
            orderId: resolvedConversationId,
            paymentId: getStringProp(order?.payment, 'transactionId'),
            paidAmount: (isRecord(order?.payment) ? (order.payment as any).paidPrice : undefined) || (order as any).total,
            cardLast4: getStringProp(order?.payment, 'cardLast4'),
          },
          { status: 200 }
        );
      }

      // Validate paid amount matches order total
      const paid = Number(result.paidPrice);
      const expected = Number(order.total);
      if (Number.isFinite(paid) && Number.isFinite(expected) && Math.abs(paid - expected) > 0.01) {
        console.error('❌ Paid amount mismatch', { conversationId: resolvedConversationId, paid, expected });

        try {
          await markOrderPaymentFailed({
            orderId: resolvedConversationId,
            token: token || getStringProp(order?.payment, 'token'),
            paymentId: paymentId || getStringProp(result, 'paymentId'),
            errorMessage: 'Ödeme tutarı sipariş toplamıyla eşleşmiyor',
            gatewayResult: result,
          });
        } catch (e) {
          console.error('⚠️ Failed to persist paid-amount mismatch on order:', e);
        }

        return NextResponse.json(
          {
            success: false,
            error: 'Paid amount does not match order total',
            conversationId: resolvedConversationId,
            paid,
            expected,
          },
          { status: 400 }
        );
      }

      const nowIso = new Date().toISOString();
      const timeline = Array.isArray(order?.timeline) ? order.timeline : [];
      const nextTimeline = [
        ...timeline,
        { status: 'confirmed', timestamp: nowIso, note: 'Ödeme onaylandı', automated: true },
      ];

      // Update order with payment details
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment: {
            method: 'credit_card',
            status: 'paid',
            transactionId: result.paymentId,
            token: token || getStringProp(order?.payment, 'token'),
            cardLast4: result.lastFourDigits,
            paidAt: new Date().toISOString(),
            cardType: result.cardType,
            cardAssociation: result.cardAssociation,
            installment: result.installment,
            paidPrice: result.paidPrice,
          },
          timeline: nextTimeline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resolvedConversationId);

      if (updateError) {
        console.error('❌ Failed to update order:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update order', conversationId: resolvedConversationId },
          { status: 500 }
        );
      }

      console.log('✅ Order updated successfully (GET):', resolvedConversationId);

      // Send order confirmation email after successful payment
      try {
        const customerEmailToSend = (order.customer_email || '').trim();
        const orderNumber = order.order_number;

        if (customerEmailToSend && orderNumber) {
          const delivery = isRecord(order.delivery) ? order.delivery : {};

          const deliveryAddress =
            getStringProp(delivery, 'fullAddress') ||
            getStringProp(delivery, 'recipientAddress') ||
            getStringProp(delivery, 'address');

          const deliveryDate = getStringProp(delivery, 'deliveryDate');
          const deliveryTime = getStringProp(delivery, 'deliveryTimeSlot') || getStringProp(delivery, 'deliveryTime');

          const products = order.products;
          const items = Array.isArray(products)
            ? products
                .filter((p): p is Record<string, unknown> => isRecord(p))
                .map((p) => ({
                  name: getStringProp(p, 'name') || '',
                  quantity: Number(p['quantity'] ?? 0),
                  price: Number(p['price'] ?? 0),
                  imageUrl: getStringProp(p, 'image') || getStringProp(p, 'imageUrl') || getStringProp(p, 'hoverImage') || undefined,
                }))
            : [];

          const paymentMethod = getStringProp(order.payment, 'method') || 'credit_card';

          const { EmailService } = await import('@/lib/email/emailService');
          await EmailService.sendOrderConfirmation({
            orderNumber: String(orderNumber),
            customerName: order.customer_name || '',
            customerEmail: customerEmailToSend,
            customerPhone: order.customer_phone || '',
            verificationType: 'email',
            verificationValue: customerEmailToSend,
            items,
            subtotal: Number(order.subtotal || 0),
            discount: Number(order.discount || 0),
            deliveryFee: Number(order.delivery_fee || 0),
            total: Number(order.total || 0),
            deliveryAddress,
            district: getStringProp(delivery, 'district'),
            deliveryDate,
            deliveryTime,
            recipientName: getStringProp(delivery, 'recipientName'),
            recipientPhone: getStringProp(delivery, 'recipientPhone'),
            paymentMethod,
          });

          console.log('✅ Order confirmation email sent (GET):', customerEmailToSend);
        }
      } catch (emailErr) {
        console.error('⚠️ Failed to send order confirmation email (GET):', emailErr);
        // Do not fail the payment completion if email fails
      }

      // Return success JSON
      return NextResponse.json(
        {
          success: true,
          orderId: resolvedConversationId,
          paymentId: result.paymentId,
          paidAmount: result.paidPrice,
          cardLast4: result.lastFourDigits,
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Payment completion exception (GET):', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
