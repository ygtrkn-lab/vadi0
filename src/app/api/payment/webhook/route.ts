import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { IyzicoWebhookPayload } from '@/lib/payment/types';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
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
 * Verify webhook signature (V3)
 * https://docs.iyzico.com/webhook#signature-v3
 */
function verifyWebhookSignature(
  payload: IyzicoWebhookPayload,
  signature: string | null
): boolean {
  if (!signature) {
    console.error('❌ Missing webhook signature');
    return false;
  }

  const secretKey = process.env.IYZICO_SECRET_KEY!;
  const { iyziEventType, paymentId, paymentConversationId, status } = payload;

  // Signature v3 is documented as HMAC-SHA256 with secretKey.
  // Different integrations may include secretKey as prefix in the signed data.
  // Accept both common variants to reduce false negatives.
  const dataV3 = `${iyziEventType}${paymentId}${paymentConversationId}${status}`;
  const dataV3Legacy = `${secretKey}${iyziEventType}${paymentId}${paymentConversationId}${status}`;

  const expectedA = crypto.createHmac('sha256', secretKey).update(dataV3).digest('hex');
  const expectedB = crypto.createHmac('sha256', secretKey).update(dataV3Legacy).digest('hex');

  const sigBuf = Buffer.from(signature, 'utf8');
  const aBuf = Buffer.from(expectedA, 'utf8');
  const bBuf = Buffer.from(expectedB, 'utf8');

  const safeEq = (x: Buffer, y: Buffer) => x.length === y.length && crypto.timingSafeEqual(x, y);
  const isValid = safeEq(sigBuf, aBuf) || safeEq(sigBuf, bBuf);

  if (!isValid) {
    console.error('❌ Invalid webhook signature:', {
      expectedA,
      expectedB,
      received: signature,
    });
  }

  return isValid;
}

/**
 * POST /api/payment/webhook
 * Handle iyzico webhook notifications
 * 
 * Webhook is sent by iyzico server (not user browser)
 * Used for confirming payment status server-to-server
 * 
 * Headers:
 * - X-IYZ-SIGNATURE-V3: Webhook signature for verification
 * 
 * Body:
 * - iyziEventType: 'payment.success' | 'payment.failed' | 'payment.fraud' | 'refund.success'
 * - paymentId: string
 * - paymentConversationId: string (orderId)
 * - status: 'success' | 'failure'
 * - price: string
 * - paidPrice: string
 * - currency: string
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-iyz-signature-v3');
    const payload: IyzicoWebhookPayload = await request.json();

    console.log('🔷 Webhook received:', {
      eventType: payload.iyziEventType,
      paymentId: payload.paymentId,
      conversationId: payload.paymentConversationId,
      status: payload.status,
    });

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('❌ Webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('✅ Webhook signature verified');

    // Handle payment success event
    if (payload.iyziEventType === 'payment.success' && payload.status === 'success') {
      const orderId = payload.paymentConversationId;

      // Update order in database
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError || !order) {
        console.error('❌ Order not found:', orderId);
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // Idempotency: if already paid, no-op
      if (String(getStringProp(order?.payment, 'status') ?? '').toLowerCase() === 'paid') {
        return NextResponse.json({ success: true, idempotent: true });
      }

      const nowIso = new Date().toISOString();
      const timeline = Array.isArray(order?.timeline) ? order.timeline : [];
      const nextTimeline = [
        ...timeline,
        { status: 'confirmed', timestamp: nowIso, note: 'Ödeme onaylandı (webhook)', automated: true },
      ];

      const existingPayment = isRecord(order?.payment) ? (order.payment as JsonRecord) : {};

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment: {
            ...existingPayment,
            status: 'paid',
            transactionId: payload.paymentId,
            paidAt: new Date().toISOString(),
          },
          timeline: nextTimeline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('❌ Failed to update order:', updateError);
        return NextResponse.json(
          { error: 'Failed to update order' },
          { status: 500 }
        );
      }

      console.log('✅ Order updated via webhook:', orderId);
    }

    // Handle payment failed event
    if (payload.iyziEventType === 'payment.failed' || payload.status === 'failure') {
      const orderId = payload.paymentConversationId;

      const { data: order } = await supabase
        .from('orders')
        .select('payment, timeline, status')
        .eq('id', orderId)
        .single();

      // Idempotency: if already paid, never downgrade
      if (String(getStringProp(isRecord(order) ? order.payment : undefined, 'status') ?? '').toLowerCase() === 'paid') {
        return NextResponse.json({ success: true, idempotent: true });
      }

      const nowIso = new Date().toISOString();
      const timelineRaw = isRecord(order) ? order.timeline : undefined;
      const timeline = Array.isArray(timelineRaw) ? timelineRaw : [];
      const nextTimeline = [
        ...timeline,
        { status: 'payment_failed', timestamp: nowIso, note: 'Ödeme başarısız (webhook)', automated: true },
      ];

      const existingPayment = isRecord(order) && isRecord(order.payment) ? (order.payment as JsonRecord) : {};

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'payment_failed',
          payment: {
            ...existingPayment,
            status: 'failed',
            transactionId: payload.paymentId,
          },
          timeline: nextTimeline,
          notes: 'Payment failed (webhook notification)',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('❌ Failed to update failed order:', updateError);
      } else {
        console.log('✅ Failed order updated:', orderId);
      }
    }

    // Handle refund event
    if (payload.iyziEventType === 'refund.success') {
      const orderId = payload.paymentConversationId;

      const { data: order } = await supabase
        .from('orders')
        .select('payment, timeline')
        .eq('id', orderId)
        .single();

      const nowIso = new Date().toISOString();
      const timelineRaw = isRecord(order) ? order.timeline : undefined;
      const timeline = Array.isArray(timelineRaw) ? timelineRaw : [];
      const nextTimeline = [
        ...timeline,
        { status: 'cancelled', timestamp: nowIso, note: 'İade edildi (webhook)', automated: true },
      ];

      const existingPayment = isRecord(order) && isRecord(order.payment) ? (order.payment as JsonRecord) : {};

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment: {
            ...existingPayment,
            status: 'refunded',
            transactionId: payload.paymentId,
          },
          timeline: nextTimeline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('❌ Failed to update refunded order:', updateError);
      } else {
        console.log('✅ Refund processed:', orderId);
      }
    }

    // IMPORTANT: Return 200 OK to prevent webhook retries
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
    // Still return 200 to prevent retries on our parsing errors
    return NextResponse.json(
      { error: 'Webhook processing failed', details: getErrorMessage(error) },
      { status: 200 }
    );
  }
}
