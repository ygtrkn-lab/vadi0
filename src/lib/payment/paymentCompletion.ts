/**
 * Centralized Payment Completion Module
 * 
 * This module handles server-side payment completion to prevent lost payments.
 * All payment completion routes should use these functions for consistency.
 */

import { createClient } from '@supabase/supabase-js';
import { getIyzicoClient } from '@/lib/payment/iyzico';

// Initialize Supabase client (service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Token expiration time in minutes (iyzico tokens typically expire in 30 mins)
const TOKEN_EXPIRATION_MINUTES = 25;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null;
}

function getStringProp(obj: unknown, key: string): string | undefined {
  if (!isRecord(obj)) return undefined;
  const val = obj[key];
  return typeof val === 'string' ? val : undefined;
}

/**
 * Map iyzico error codes to user-friendly Turkish messages
 */
export function mapIyzicoErrorToTurkish(errorCode?: string, errorMessage?: string): string {
  if (!errorCode && !errorMessage) {
    return 'Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.';
  }

  const code = (errorCode || '').toUpperCase();
  const message = (errorMessage || '').toLowerCase();

  // Token related errors
  if (code.includes('TOKEN') || message.includes('token')) {
    if (message.includes('expired') || message.includes('süre')) {
      return 'Ödeme süresi doldu. Lütfen sayfayı yenileyip tekrar deneyin.';
    }
    if (message.includes('not found') || message.includes('bulunamadı')) {
      return 'Ödeme oturumu bulunamadı. Lütfen sepetinize dönüp tekrar deneyin.';
    }
    if (message.includes('already used') || message.includes('kullanılmış')) {
      return 'Bu ödeme işlemi zaten tamamlandı.';
    }
  }

  // Security/3DS errors
  if (message.includes('güvenlik') || message.includes('security') || message.includes('3ds')) {
    return 'Banka güvenlik doğrulaması başarısız oldu. Lütfen bankanızla iletişime geçin veya başka bir kart deneyin.';
  }

  // Card declined
  if (code.includes('DECLINED') || message.includes('declined') || message.includes('reddedildi')) {
    return 'Kartınız reddedildi. Lütfen bankanızla iletişime geçin veya başka bir kart deneyin.';
  }

  // Insufficient funds
  if (code.includes('INSUFFICIENT') || message.includes('insufficient') || message.includes('yetersiz')) {
    return 'Kart bakiyeniz yetersiz. Lütfen başka bir kart deneyin.';
  }

  // Card limit
  if (code.includes('LIMIT') || message.includes('limit')) {
    return 'Kart limitiniz aşıldı. Lütfen başka bir kart deneyin.';
  }

  // Invalid card
  if (code.includes('INVALID') || message.includes('invalid') || message.includes('geçersiz')) {
    return 'Kart bilgileri geçersiz. Lütfen bilgileri kontrol edip tekrar deneyin.';
  }

  // Fraud
  if (code.includes('FRAUD') || message.includes('fraud') || message.includes('şüpheli')) {
    return 'İşlem güvenlik nedeniyle reddedildi. Lütfen bankanızla iletişime geçin.';
  }

  // Connection/timeout
  if (code.includes('TIMEOUT') || code.includes('CONNECTION') || message.includes('timeout') || message.includes('connection')) {
    return 'Banka bağlantısı zaman aşımına uğradı. Lütfen tekrar deneyin.';
  }

  // If iyzico returns a Turkish message, use it directly
  if (errorMessage && /[ğüşıöçĞÜŞİÖÇ]/.test(errorMessage)) {
    return errorMessage;
  }

  // Default
  return 'Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin veya başka bir kart kullanın.';
}

/**
 * Check if token has expired based on tokenCreatedAt
 */
export function isTokenExpired(tokenCreatedAt: string | undefined): boolean {
  if (!tokenCreatedAt) {
    return false; // If no timestamp, don't block (backward compatibility)
  }

  const createdAt = new Date(tokenCreatedAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  
  return diffMinutes > TOKEN_EXPIRATION_MINUTES;
}

/**
 * Get remaining time until token expires
 */
export function getTokenRemainingMinutes(tokenCreatedAt: string | undefined): number {
  if (!tokenCreatedAt) {
    return TOKEN_EXPIRATION_MINUTES; // Assume fresh if no timestamp
  }

  const createdAt = new Date(tokenCreatedAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  const remaining = TOKEN_EXPIRATION_MINUTES - diffMinutes;
  
  return Math.max(0, Math.round(remaining));
}

export interface PaymentCompletionResult {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  paidAmount?: string;
  cardLast4?: string;
  cardType?: string;
  cardAssociation?: string;
  installment?: number;
  error?: string;
  errorCode?: string;
  alreadyCompleted?: boolean;
}

/**
 * Complete payment server-side to prevent lost payments.
 * This is the main function used by all payment completion routes.
 * 
 * It handles:
 * - Token expiration checking
 * - Idempotency (skip if already paid)
 * - Race condition prevention (completionStartedAt locking)
 * - iyzico verification
 * - Order status update
 * - Email sending (non-blocking)
 */
export async function completePaymentServerSide(
  token: string,
  conversationId?: string
): Promise<PaymentCompletionResult> {
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
      console.error('⚠️ Payment completion: Order not found for token');
      return { 
        success: false, 
        error: 'Sipariş bulunamadı. Lütfen sepetinize dönüp tekrar deneyin.',
        errorCode: 'ORDER_NOT_FOUND'
      };
    }

    const orderId = order.id as string;
    const existingPayment = isRecord(order.payment) ? order.payment : {};
    const existingPaymentStatus = typeof existingPayment.status === 'string' ? existingPayment.status : '';

    // Idempotency: if already paid, skip
    if (existingPaymentStatus.toLowerCase() === 'paid') {
      console.log('✅ Payment completion: Order already paid, skipping', { orderId });
      return { 
        success: true, 
        orderId,
        paymentId: getStringProp(existingPayment, 'transactionId'),
        paidAmount: getStringProp(existingPayment, 'paidPrice'),
        cardLast4: getStringProp(existingPayment, 'cardLast4'),
        cardType: getStringProp(existingPayment, 'cardType'),
        cardAssociation: getStringProp(existingPayment, 'cardAssociation'),
        installment: existingPayment.installment as number | undefined,
        alreadyCompleted: true
      };
    }

    // Check token expiration
    const tokenCreatedAt = getStringProp(existingPayment, 'tokenCreatedAt');
    if (isTokenExpired(tokenCreatedAt)) {
      console.log('⚠️ Payment completion: Token expired', { orderId, tokenCreatedAt });
      return {
        success: false,
        orderId,
        error: 'Ödeme süresi doldu. Lütfen sayfayı yenileyip tekrar deneyin.',
        errorCode: 'TOKEN_EXPIRED'
      };
    }

    // Race condition prevention: check if completion is already in progress
    const completionStartedAt = getStringProp(existingPayment, 'completionStartedAt');
    if (completionStartedAt) {
      const startedAt = new Date(completionStartedAt);
      const now = new Date();
      const diffSeconds = (now.getTime() - startedAt.getTime()) / 1000;
      
      // If completion started less than 30 seconds ago, wait
      if (diffSeconds < 30) {
        console.log('⚠️ Payment completion: Already in progress, waiting...', { orderId, diffSeconds });
        // Wait a bit and check again
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Re-fetch order to check if it's now paid
        const { data: refreshedOrder } = await supabase
          .from('orders')
          .select('id, status, payment')
          .eq('id', orderId)
          .single();
        
        if (refreshedOrder) {
          const refreshedPayment = isRecord(refreshedOrder.payment) ? refreshedOrder.payment : {};
          const refreshedStatus = getStringProp(refreshedPayment, 'status');
          if (refreshedStatus?.toLowerCase() === 'paid') {
            return { 
              success: true, 
              orderId,
              paymentId: getStringProp(refreshedPayment, 'transactionId'),
              alreadyCompleted: true
            };
          }
        }
      }
    }

    // Mark completion as started (race condition prevention)
    const nowIso = new Date().toISOString();
    await supabase
      .from('orders')
      .update({
        payment: {
          ...existingPayment,
          completionStartedAt: nowIso,
        },
        updated_at: nowIso,
      })
      .eq('id', orderId);

    // Retrieve payment result from iyzico
    const iyzicoClient = getIyzicoClient();
    let result;
    
    try {
      result = await iyzicoClient.retrieveCheckoutForm({
        locale: 'tr',
        conversationId: orderId,
        token,
      });
    } catch (iyzicoError: unknown) {
      console.error('❌ Payment completion: iyzico API error', iyzicoError);
      const errorMsg = iyzicoError instanceof Error ? iyzicoError.message : String(iyzicoError);
      return {
        success: false,
        orderId,
        error: mapIyzicoErrorToTurkish(undefined, errorMsg),
        errorCode: 'IYZICO_API_ERROR'
      };
    }

    // Check if payment was successful
    if (result.status !== 'success' || String(result.paymentStatus).toUpperCase() !== 'SUCCESS') {
      console.log('⚠️ Payment completion: Payment not successful', {
        orderId,
        status: result.status,
        paymentStatus: result.paymentStatus,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      });

      // Map error to user-friendly Turkish message
      const userFriendlyError = mapIyzicoErrorToTurkish(result.errorCode, result.errorMessage);

      // Update order with failure
      const timeline = Array.isArray(order.timeline) ? order.timeline : [];
      await supabase
        .from('orders')
        .update({
          status: 'payment_failed',
          payment: {
            ...existingPayment,
            method: 'credit_card',
            status: 'failed',
            token,
            errorCode: result.errorCode,
            errorMessage: result.errorMessage,
            errorGroup: result.errorGroup,
            completionStartedAt: undefined, // Clear lock
          },
          timeline: [
            ...timeline,
            { status: 'payment_failed', timestamp: nowIso, note: userFriendlyError, automated: true },
          ],
          updated_at: nowIso,
        })
        .eq('id', orderId);

      return { 
        success: false, 
        orderId, 
        error: userFriendlyError,
        errorCode: result.errorCode || 'PAYMENT_FAILED'
      };
    }

    // Payment successful - update order to confirmed
    const timeline = Array.isArray(order.timeline) ? order.timeline : [];
    const nextTimeline = [
      ...timeline,
      { status: 'confirmed', timestamp: nowIso, note: 'Ödeme onaylandı', automated: true },
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
          completionStartedAt: undefined, // Clear lock
        },
        timeline: nextTimeline,
        updated_at: nowIso,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('❌ Payment completion: Failed to update order', updateError);
      return { 
        success: false, 
        orderId, 
        error: 'Sipariş güncellenemedi. Lütfen müşteri hizmetleriyle iletişime geçin.',
        errorCode: 'UPDATE_FAILED'
      };
    }

    console.log('✅ Payment completion: Order updated successfully', { orderId, paymentId: result.paymentId });

    // Send confirmation email (non-blocking)
    sendConfirmationEmail(orderId).catch(err => {
      console.error('⚠️ Payment completion: Email failed (non-blocking)', err);
    });

    return { 
      success: true, 
      orderId,
      paymentId: result.paymentId,
      paidAmount: result.paidPrice,
      cardLast4: result.lastFourDigits,
      cardType: result.cardType,
      cardAssociation: result.cardAssociation,
      installment: result.installment,
    };
  } catch (err) {
    console.error('❌ Payment completion error:', err);
    return { 
      success: false, 
      error: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
      errorCode: 'UNEXPECTED_ERROR'
    };
  }
}

/**
 * Send order confirmation email (non-blocking helper)
 */
async function sendConfirmationEmail(orderId: string): Promise<void> {
  const { data: fullOrder } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!fullOrder?.customer_email || !fullOrder?.order_number) {
    console.log('⚠️ Email: Missing customer email or order number', { orderId });
    return;
  }

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

  console.log('✅ Payment completion: Email sent', { orderId });
}

/**
 * Mark order payment as failed
 */
export async function markOrderPaymentFailed(params: {
  orderId: string;
  token?: string;
  paymentId?: string;
  errorMessage: string;
  errorCode?: string;
  gatewayResult?: unknown;
}): Promise<void> {
  const nowIso = new Date().toISOString();

  const { data: order } = await supabase
    .from('orders')
    .select('status, payment, timeline')
    .eq('id', params.orderId)
    .single();

  // If order is already paid, do not downgrade
  const orderPayment = isRecord(order) ? order.payment : undefined;
  const orderPaymentStatus = getStringProp(orderPayment, 'status');
  if (String(orderPaymentStatus ?? '').toLowerCase() === 'paid') {
    return;
  }

  const timelineRaw = isRecord(order) ? order.timeline : undefined;
  const timeline = Array.isArray(timelineRaw) ? timelineRaw : [];
  const nextTimeline = [
    ...timeline,
    {
      status: 'payment_failed',
      timestamp: nowIso,
      note: params.errorMessage,
      automated: true,
    },
  ];

  const prevPayment = isRecord(orderPayment) ? orderPayment : {};
  const gateway = params.gatewayResult;

  await supabase
    .from('orders')
    .update({
      status: 'payment_failed',
      payment: {
        ...prevPayment,
        method: (prevPayment as JsonRecord).method || 'credit_card',
        status: 'failed',
        token: params.token || (prevPayment as JsonRecord).token,
        transactionId:
          params.paymentId ||
          (prevPayment as JsonRecord).transactionId ||
          getStringProp(gateway, 'paymentId'),
        errorCode: params.errorCode || (isRecord(gateway) ? gateway.errorCode : undefined),
        errorMessage: getStringProp(gateway, 'errorMessage') || params.errorMessage,
        errorGroup: isRecord(gateway) ? gateway.errorGroup : undefined,
        completionStartedAt: undefined, // Clear lock
      },
      timeline: nextTimeline,
      updated_at: nowIso,
    })
    .eq('id', params.orderId);
}
