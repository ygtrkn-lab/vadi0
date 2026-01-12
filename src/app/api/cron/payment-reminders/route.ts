import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase/admin';
import { EmailService } from '@/lib/email/emailService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Ödeme Hatırlatma Cron Job
 * 
 * Bu cron job şu siparişlere email gönderir:
 * 1. pending_payment - Ödeme bekleniyor (havale/EFT)
 * 2. awaiting_payment - Havale bekleniyor
 * 3. payment_failed - Ödeme başarısız oldu
 * 
 * Kurallar:
 * - İlk hatırlatma: Sipariş oluşturulduktan 1 saat sonra
 * - İkinci hatırlatma: 6 saat sonra
 * - Son hatırlatma: 24 saat sonra
 * - Maksimum 3 hatırlatma gönderilir
 */

interface OrderRow {
  id: string;
  order_number: number;
  status: string;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  delivery: Record<string, unknown> | null;
  payment: Record<string, unknown> | null;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }> | null;
  total: number;
  created_at: string;
  updated_at: string;
}

interface ReminderMeta {
  count: number;
  lastSentAt: string | null;
  firstSentAt: string | null;
}

// Hatırlatma aralıkları (saat cinsinden)
const REMINDER_INTERVALS = [1, 6, 24]; // 1 saat, 6 saat, 24 saat sonra
const MAX_REMINDERS = 3;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getString(value: unknown): string {
  if (typeof value === 'string') return value;
  return '';
}

function getReminderMeta(payment: Record<string, unknown> | null): ReminderMeta {
  if (!payment || !isRecord(payment.reminderMeta)) {
    return { count: 0, lastSentAt: null, firstSentAt: null };
  }
  const meta = payment.reminderMeta as Record<string, unknown>;
  return {
    count: typeof meta.count === 'number' ? meta.count : 0,
    lastSentAt: getString(meta.lastSentAt) || null,
    firstSentAt: getString(meta.firstSentAt) || null,
  };
}

function shouldSendReminder(order: OrderRow): { shouldSend: boolean; reason: string } {
  const payment = order.payment;
  if (!payment) return { shouldSend: false, reason: 'No payment info' };
  
  const reminderMeta = getReminderMeta(payment);
  const now = new Date();
  const createdAt = new Date(order.created_at);
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  
  // Maksimum hatırlatma sayısına ulaşıldı mı?
  if (reminderMeta.count >= MAX_REMINDERS) {
    return { shouldSend: false, reason: `Max reminders reached (${MAX_REMINDERS})` };
  }
  
  // İlk hatırlatma için yeterli süre geçti mi?
  const nextReminderInterval = REMINDER_INTERVALS[reminderMeta.count] || REMINDER_INTERVALS[REMINDER_INTERVALS.length - 1];
  
  if (reminderMeta.count === 0) {
    // İlk hatırlatma
    if (hoursSinceCreation < nextReminderInterval) {
      return { shouldSend: false, reason: `Too early for first reminder (${hoursSinceCreation.toFixed(1)}h < ${nextReminderInterval}h)` };
    }
  } else if (reminderMeta.lastSentAt) {
    // Sonraki hatırlatmalar
    const lastSent = new Date(reminderMeta.lastSentAt);
    const hoursSinceLastReminder = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastReminder < nextReminderInterval) {
      return { shouldSend: false, reason: `Too early for next reminder (${hoursSinceLastReminder.toFixed(1)}h < ${nextReminderInterval}h)` };
    }
  }
  
  return { shouldSend: true, reason: 'Ready to send' };
}

async function sendPaymentReminder(order: OrderRow): Promise<boolean> {
  const email = order.customer_email;
  if (!email) {
    console.log(`[PaymentReminder] No email for order #${order.order_number}`);
    return false;
  }
  
  const delivery = order.delivery || {};
  const payment = order.payment || {};
  const reminderMeta = getReminderMeta(payment);
  
  // Sipariş ürünlerini hazırla
  const items = (order.items || []).map(item => ({
    name: item.name || 'Ürün',
    quantity: item.quantity || 1,
    price: item.price || 0,
    imageUrl: item.imageUrl,
  }));
  
  try {
    // Amazon tarzı ödeme hatırlatma emaili gönder
    const success = await EmailService.sendPaymentReminderEmail({
      customerEmail: email,
      customerName: order.customer_name || 'Değerli Müşterimiz',
      orderNumber: String(order.order_number),
      status: order.status as 'pending_payment' | 'awaiting_payment' | 'payment_failed',
      reminderCount: reminderMeta.count + 1,
      items: items.length > 0 ? items : [{ name: 'Çiçek Siparişi', quantity: 1, price: order.total }],
      total: order.total,
      deliveryDate: getString(delivery.deliveryDate) || undefined,
      deliveryTime: getString(delivery.deliveryTimeSlot) || undefined,
      createdAt: order.created_at,
    });
    
    if (!success) {
      console.error(`[PaymentReminder] Failed to send email for order #${order.order_number}`);
      return false;
    }
    
    // Hatırlatma meta bilgisini güncelle
    const now = new Date().toISOString();
    const updatedPayment = {
      ...payment,
      reminderMeta: {
        count: reminderMeta.count + 1,
        lastSentAt: now,
        firstSentAt: reminderMeta.firstSentAt || now,
      },
    };
    
    // Veritabanını güncelle
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ payment: updatedPayment })
      .eq('id', order.id);
    
    if (updateError) {
      console.error(`[PaymentReminder] Failed to update order #${order.order_number}:`, updateError);
    }
    
    console.log(`[PaymentReminder] ✅ Sent reminder #${reminderMeta.count + 1} for order #${order.order_number} to ${email}`);
    return true;
    
  } catch (error) {
    console.error(`[PaymentReminder] Error sending email for order #${order.order_number}:`, error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Cron job güvenlik kontrolü (Vercel cron header)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Vercel cron'dan gelen istekler için kontrol
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Manuel tetikleme için de izin ver (development)
      const isLocalDev = process.env.NODE_ENV === 'development';
      if (!isLocalDev) {
        console.log('[PaymentReminder] Unauthorized cron request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    console.log('[PaymentReminder] Starting payment reminder job...');
    
    // Ödeme bekleyen ve başarısız siparişleri çek
    // Son 48 saat içinde oluşturulmuş olanlar
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 48);
    
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .in('status', ['pending_payment', 'awaiting_payment', 'payment_failed'])
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('[PaymentReminder] Error fetching orders:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    if (!orders || orders.length === 0) {
      console.log('[PaymentReminder] No pending payment orders found');
      return NextResponse.json({
        success: true,
        message: 'No pending payment orders',
        processed: 0,
        sent: 0,
        duration: Date.now() - startTime,
      });
    }
    
    console.log(`[PaymentReminder] Found ${orders.length} orders to check`);
    
    let processedCount = 0;
    let sentCount = 0;
    const results: Array<{ orderNumber: number; status: string; action: string }> = [];
    
    for (const order of orders as OrderRow[]) {
      processedCount++;
      
      // Email var mı kontrol et
      if (!order.customer_email) {
        results.push({ orderNumber: order.order_number, status: order.status, action: 'skipped_no_email' });
        continue;
      }
      
      // Hatırlatma göndermeli mi?
      const { shouldSend, reason } = shouldSendReminder(order);
      
      if (!shouldSend) {
        results.push({ orderNumber: order.order_number, status: order.status, action: `skipped: ${reason}` });
        continue;
      }
      
      // Hatırlatma gönder
      const sent = await sendPaymentReminder(order);
      
      if (sent) {
        sentCount++;
        results.push({ orderNumber: order.order_number, status: order.status, action: 'reminder_sent' });
      } else {
        results.push({ orderNumber: order.order_number, status: order.status, action: 'send_failed' });
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[PaymentReminder] Completed. Processed: ${processedCount}, Sent: ${sentCount}, Duration: ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      processed: processedCount,
      sent: sentCount,
      duration,
      results,
    });
    
  } catch (error) {
    console.error('[PaymentReminder] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
