/**
 * Sipariş Otomasyonu Sistemi (Supabase)
 *
 * KURAL (senin dokümanına göre):
 * - Ödemesi başarılı olan sipariş, teslim gününe kadar "Ödeme alındı / onaylandı" (status: confirmed) bekler.
 * - Durum geçişleri sadece TESLİMAT GÜNÜ ve belirlenen saatlerde otomatik olur.
 *
 * Senaryo 1 (11:00–17:00 arası verilen siparişler / noon):
 * - Teslim günü 11:00 -> processing (Hazırlanıyor)
 * - Teslim günü 12:00 -> shipped (Kargoda)
 * - Teslim günü 18:00 -> delivered (Teslim Edildi)
 *
 * Senaryo 2 (17:00–22:00 arası verilen siparişler / evening):
 * - Teslim günü 18:00 -> processing
 * - Teslim günü 19:00 -> shipped
 * - Teslim günü 22:30 -> delivered
 *
 * Notlar:
 * - Otomasyon sadece payment.status === 'paid' olan siparişlerde çalışır.
 * - Zaman hesapları Europe/Istanbul'a göre yapılır (Vercel UTC olsa bile).
 */

import supabaseAdmin from '@/lib/supabase/admin';
import { EmailService } from '@/lib/email/emailService';
import { getIyzicoClient } from '@/lib/payment/iyzico';
import { isTokenExpired, mapIyzicoErrorToTurkish } from '@/lib/payment/paymentCompletion';

const ISTANBUL_TZ = 'Europe/Istanbul';

export type OrderTimeGroup = 'noon' | 'evening' | 'overnight';

// Supabase row shape (minimal fields used by automation)
export interface OrderRow {
  id: string;
  order_number: number;
  status: string;
  customer_email?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery: unknown;
  payment: unknown;
  order_time_group: string | null;
  timeline: unknown;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
}

function getDeliveryFields(order: OrderRow): {
  deliveryDate?: string;
  deliveryTime?: string;
  deliveryAddress?: string;
  district?: string;
  recipientName?: string;
  recipientPhone?: string;
} {
  const delivery = isRecord(order.delivery) ? order.delivery : undefined;
  if (!delivery) return {};

  return {
    deliveryDate: getString(delivery['deliveryDate']) || undefined,
    deliveryTime: getString(delivery['deliveryTimeSlot']) || undefined,
    deliveryAddress: getString(delivery['fullAddress']) || undefined,
    district: getString(delivery['district']) || undefined,
    recipientName: getString(delivery['recipientName']) || undefined,
    recipientPhone: getString(delivery['recipientPhone']) || undefined,
  };
}

interface AutomationSchedule {
  targetStatus: 'processing' | 'shipped' | 'delivered';
  targetTime: Date;
  automated: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function hasStatusEmailNotification(timeline: unknown, status: string): boolean {
  if (!Array.isArray(timeline)) return false;
  const target = status.toLowerCase();
  return timeline.some((t) => {
    if (!isRecord(t)) return false;
    const type = getString(t['type']).toLowerCase();
    const channel = getString(t['channel']).toLowerCase();
    const event = getString(t['event']).toLowerCase();
    const s = getString(t['status']).toLowerCase();
    const success = t['success'] === true;
    return type === 'notification' && channel === 'email' && event === 'order_status' && s === target && success;
  });
}

function getIstanbulDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ISTANBUL_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function normalizeDeliveryDateString(value: unknown): string | null {
  const raw = getString(value);
  if (!raw) return null;

  const m = /^\d{4}-\d{2}-\d{2}/.exec(raw);
  if (m) return m[0];

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return getIstanbulDateKey(parsed);
}

function parseDeliveryDateKeyFromOrder(order: OrderRow): string | null {
  const delivery = isRecord(order.delivery) ? order.delivery : undefined;
  const deliveryDateValue = delivery ? delivery['deliveryDate'] : undefined;
  const deliveryDateString = getString(deliveryDateValue);
  if (!deliveryDateString) return null;

  // If already in YYYY-MM-DD... keep the first part
  const m = /^\d{4}-\d{2}-\d{2}/.exec(deliveryDateString);
  if (m) return m[0];

  const parsed = new Date(deliveryDateString);
  if (Number.isNaN(parsed.getTime())) return null;
  return getIstanbulDateKey(parsed);
}

function getIstanbulHour(orderDate: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ISTANBUL_TZ,
    hour: '2-digit',
    hour12: false,
  }).formatToParts(orderDate);

  const hourPart = parts.find((p) => p.type === 'hour');
  const hour = hourPart ? parseInt(hourPart.value, 10) : NaN;
  return Number.isFinite(hour) ? hour : orderDate.getHours();
}

function isPaymentPaid(payment: unknown): boolean {
  if (!isRecord(payment)) return false;
  const status = getString(payment['status']).toLowerCase();
  return status === 'paid';
}

function isValidOrderTimeGroup(value: unknown): value is OrderTimeGroup {
  if (typeof value !== 'string') return false;
  const v = value.toLowerCase();
  return v === 'noon' || v === 'evening' || v === 'overnight';
}

/**
 * Siparişin hangi zaman grubuna ait olduğunu belirle (sipariş saatine göre)
 */
function getOrderTimeGroup(orderDate: Date): OrderTimeGroup {
  const hour = getIstanbulHour(orderDate);
  
  // 11:00 - 17:00 arası → Öğle grubu
  if (hour >= 11 && hour < 17) {
    return 'noon';
  }
  
  // 17:00 - 22:00 arası → Akşam grubu
  if (hour >= 17 && hour < 22) {
    return 'evening';
  }
  
  // Diğer saatler → Gecelik (ertesi gün öğle grubu programını takip eder)
  return 'overnight';
}

/**
 * Sipariş için otomatik durum güncelleme programını hesapla
 * TESLİMAT TARİHİNE göre programlar
 */
export function calculateAutomationSchedule(order: OrderRow): AutomationSchedule[] {
  const schedule: AutomationSchedule[] = [];

  const deliveryKey = parseDeliveryDateKeyFromOrder(order);
  if (!deliveryKey) return schedule;

  // Sipariş zaman grubu (DB'de varsa onu kullan, yoksa created_at'ten hesapla)
  const storedGroup = (order.order_time_group || '').toLowerCase();
  const timeGroup: OrderTimeGroup =
    storedGroup === 'noon' || storedGroup === 'evening' || storedGroup === 'overnight'
      ? (storedGroup as OrderTimeGroup)
      : getOrderTimeGroup(new Date(order.created_at));

  const effectiveGroup: OrderTimeGroup = timeGroup === 'overnight' ? 'noon' : timeGroup;

  // Teslim günündeki hedef zamanları Istanbul saatine göre hesapla
  const processingTime =
    effectiveGroup === 'noon'
      ? new Date(`${deliveryKey}T11:00:00+03:00`)
      : new Date(`${deliveryKey}T18:00:00+03:00`);

  const shippedTime =
    effectiveGroup === 'noon'
      ? new Date(`${deliveryKey}T12:00:00+03:00`)
      : new Date(`${deliveryKey}T19:00:00+03:00`);

  const deliveredTime =
    effectiveGroup === 'noon'
      ? new Date(`${deliveryKey}T18:00:00+03:00`)
      : new Date(`${deliveryKey}T22:30:00+03:00`);

  // Programı oluştur (sadece ileriye dönük durumlar)
  if (order.status === 'confirmed') {
    schedule.push({ targetStatus: 'processing', targetTime: processingTime, automated: true });
    schedule.push({ targetStatus: 'shipped', targetTime: shippedTime, automated: true });
    schedule.push({ targetStatus: 'delivered', targetTime: deliveredTime, automated: true });
  } else if (order.status === 'processing') {
    schedule.push({ targetStatus: 'shipped', targetTime: shippedTime, automated: true });
    schedule.push({ targetStatus: 'delivered', targetTime: deliveredTime, automated: true });
  } else if (order.status === 'shipped') {
    schedule.push({ targetStatus: 'delivered', targetTime: deliveredTime, automated: true });
  }
  
  return schedule;
}

/**
 * Şu an güncellenmeleri gereken siparişleri bul ve güncelle
 * Sadece TESLİMAT TARİHİ BUGÜN OLAN siparişleri işler
 */
export async function processAutomatedUpdates(): Promise<{
  updated: number;
  orders: Array<{ orderNumber: number; oldStatus: string; newStatus: string }>;
}> {
  try {
    const now = new Date();
    const todayKey = getIstanbulDateKey(now);
    const nowIso = now.toISOString();

    // -1) NEW: Verify stuck payments with iyzico
    // Orders that have payment.token but payment.status is still 'pending'
    // Query iyzico to check if payment was actually successful
    {
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: stuckPayments, error: stuckErr } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, status, customer_email, customer_name, customer_phone, delivery, payment, order_time_group, timeline, created_at, updated_at, delivered_at, products, subtotal, discount, delivery_fee, total')
        .in('status', ['pending', 'pending_payment'])
        .lt('created_at', tenMinutesAgo)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: true })
        .limit(100);

      if (stuckErr) {
        console.error('Automation stuck payments query error:', stuckErr);
      } else {
        // Filter orders that have a token but payment.status is not 'paid'
        const ordersToVerify = (stuckPayments || []).filter((order) => {
          const payment = isRecord(order.payment) ? order.payment : {};
          const paymentStatus = getString(payment['status']).toLowerCase();
          const token = getString(payment['token']);
          return token && paymentStatus !== 'paid';
        });

        if (ordersToVerify.length > 0) {
          console.log(`Automation: Verifying ${ordersToVerify.length} stuck payments with iyzico`);
          const iyzicoClient = getIyzicoClient();

          for (const order of ordersToVerify as unknown as OrderRow[]) {
            const payment = isRecord(order.payment) ? order.payment : {};
            const token = getString(payment['token']);
            const tokenCreatedAt = getString(payment['tokenCreatedAt']);
            
            if (!token) continue;

            // Check if token has expired - mark as failed without calling iyzico
            if (isTokenExpired(tokenCreatedAt)) {
              console.log(`Automation: Token expired for order ${order.order_number}, marking as failed`);
              const timelineArr = Array.isArray(order.timeline) ? [...order.timeline] : [];
              timelineArr.push({
                status: 'payment_failed',
                timestamp: nowIso,
                note: 'Ödeme süresi doldu',
                automated: true,
              });

              await supabaseAdmin
                .from('orders')
                .update({
                  status: 'payment_failed',
                  payment: {
                    ...payment,
                    status: 'failed',
                    errorMessage: 'Ödeme süresi doldu',
                    errorCode: 'TOKEN_EXPIRED',
                  },
                  timeline: timelineArr,
                  updated_at: nowIso,
                })
                .eq('id', order.id);

              continue;
            }

            try {
              const result = await iyzicoClient.retrieveCheckoutForm({
                locale: 'tr',
                conversationId: order.id,
                token,
              });

              if (result.status === 'success' && String(result.paymentStatus).toUpperCase() === 'SUCCESS') {
                // Payment was successful - update order
                const timelineArr = Array.isArray(order.timeline) ? [...order.timeline] : [];
                timelineArr.push({
                  status: 'confirmed',
                  timestamp: nowIso,
                  note: 'Ödeme onaylandı (otomatik iyzico doğrulama)',
                  automated: true,
                });

                const { error: updateErr } = await supabaseAdmin
                  .from('orders')
                  .update({
                    status: 'confirmed',
                    payment: {
                      ...payment,
                      method: 'credit_card',
                      status: 'paid',
                      transactionId: result.paymentId,
                      cardLast4: result.lastFourDigits,
                      paidAt: nowIso,
                      cardType: result.cardType,
                      cardAssociation: result.cardAssociation,
                      installment: result.installment,
                      paidPrice: result.paidPrice,
                    },
                    timeline: timelineArr,
                    updated_at: nowIso,
                  })
                  .eq('id', order.id);

                if (updateErr) {
                  console.error('Automation: Failed to update verified order:', order.id, updateErr);
                } else {
                  console.log(`Automation: Fixed stuck order ${order.order_number} via iyzico verification`);

                  // Send confirmation email (non-blocking)
                  try {
                    const customerEmail = (order.customer_email || '').toString().trim();
                    if (customerEmail && order.order_number) {
                      const deliveryFields = getDeliveryFields(order);
                      const products = isRecord(order) ? (order as any).products : undefined;
                      const items = Array.isArray(products)
                        ? products
                            .filter((p): p is Record<string, unknown> => isRecord(p))
                            .map((p) => ({
                              name: getString(p['name']),
                              quantity: Number(p['quantity'] ?? 0),
                              price: Number(p['price'] ?? 0),
                              imageUrl: getString(p['image']) || getString(p['imageUrl']) || getString(p['hoverImage']) || undefined,
                            }))
                        : [];

                      await EmailService.sendOrderConfirmation({
                        orderNumber: String(order.order_number),
                        customerName: order.customer_name || '',
                        customerEmail,
                        customerPhone: order.customer_phone || '',
                        verificationType: 'email',
                        verificationValue: customerEmail,
                        items,
                        subtotal: Number((order as any).subtotal || 0),
                        discount: Number((order as any).discount || 0),
                        deliveryFee: Number((order as any).delivery_fee || 0),
                        total: Number((order as any).total || 0),
                        ...deliveryFields,
                        paymentMethod: 'credit_card',
                      });
                      console.log(`Automation: Email sent for recovered order ${order.order_number}`);
                    }
                  } catch (emailErr) {
                    console.error(`Automation: Email failed for order ${order.order_number}:`, emailErr);
                  }
                }
              } else if (result.status === 'failure' || String(result.paymentStatus).toUpperCase() === 'FAILURE') {
                // Payment actually failed - mark as failed
                const userFriendlyError = mapIyzicoErrorToTurkish(result.errorCode, result.errorMessage);
                const timelineArr = Array.isArray(order.timeline) ? [...order.timeline] : [];
                timelineArr.push({
                  status: 'payment_failed',
                  timestamp: nowIso,
                  note: userFriendlyError,
                  automated: true,
                });

                await supabaseAdmin
                  .from('orders')
                  .update({
                    status: 'payment_failed',
                    payment: {
                      ...payment,
                      status: 'failed',
                      errorCode: result.errorCode,
                      errorMessage: userFriendlyError,
                    },
                    timeline: timelineArr,
                    updated_at: nowIso,
                  })
                  .eq('id', order.id);

                console.log(`Automation: Marked order ${order.order_number} as payment_failed via iyzico verification`);
              }
              // If still pending, leave it alone
            } catch (iyziErr) {
              console.error(`Automation: iyzico verification error for order ${order.order_number}:`, iyziErr);
            }
          }
        }
      }
    }

    // 0) Fully-automatic safety net:
    // If a legacy order is already paid but still stuck in pending/pending_payment,
    // move it to 'confirmed' immediately so it can follow delivery-day automation later.
    // This makes the system hands-free (no manual backfill required).
    {
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const { data: legacyPaidPending, error: legacyErr } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, status, customer_email, customer_name, customer_phone, delivery, payment, order_time_group, timeline, created_at, updated_at, delivered_at')
        .in('status', ['pending', 'pending_payment'])
        .filter('payment->>status', 'eq', 'paid')
        .gte('created_at', sixtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(2000);

      if (legacyErr) {
        console.error('Automation legacy normalize query error:', legacyErr);
      } else {
        for (const order of (legacyPaidPending as unknown as OrderRow[]) || []) {
          if (!isPaymentPaid(order.payment)) continue;

          const oldStatus = order.status;
          const timelineArr = Array.isArray(order.timeline) ? [...order.timeline] : [];
          const hasConfirmed = timelineArr.some(
            (t) => isRecord(t) && getString((t as Record<string, unknown>)['status']).toLowerCase() === 'confirmed'
          );

          if (!hasConfirmed) {
            timelineArr.push({
              status: 'confirmed',
              timestamp: nowIso,
              note: 'Ödeme onaylandı (otomatik)',
              automated: true,
            });
          }

          const storedGroup = isValidOrderTimeGroup(order.order_time_group) ? order.order_time_group : null;
          const computedGroup = getOrderTimeGroup(new Date(order.created_at));
          const nextGroup: OrderTimeGroup = storedGroup ?? computedGroup;

          const updatePayload: Record<string, unknown> = {
            status: 'confirmed',
            updated_at: nowIso,
            timeline: timelineArr,
            order_time_group: nextGroup,
          };

          const delivery = isRecord(order.delivery) ? order.delivery : undefined;
          if (delivery) {
            const currentRaw = getString(delivery['deliveryDate']);
            const normalized = normalizeDeliveryDateString(delivery['deliveryDate']);
            if (normalized && currentRaw && currentRaw !== normalized) {
              updatePayload.delivery = { ...delivery, deliveryDate: normalized };
            }
          }

          const { error: updateErr } = await supabaseAdmin
            .from('orders')
            .update(updatePayload)
            .eq('id', order.id)
            .eq('status', oldStatus);

          if (updateErr) {
            console.error('Automation legacy normalize update error:', {
              orderId: order.id,
              orderNumber: order.order_number,
              oldStatus,
              error: updateErr,
            });
            continue;
          }

          // Send confirmed status email (non-fatal, idempotent via timeline notification)
          try {
            const customerEmail = (order.customer_email || '').toString().trim();
            const customerName = (order.customer_name || '').toString().trim() || 'Değerli Müşterimiz';
            const alreadyNotified = hasStatusEmailNotification(timelineArr, 'confirmed');

            if (customerEmail && !alreadyNotified) {
              const deliveryFields = getDeliveryFields(order);
              const sent = await EmailService.sendOrderStatusUpdate({
                customerEmail,
                customerName,
                orderNumber: String(order.order_number),
                status: 'confirmed',
                ...deliveryFields,
              });

              if (sent) {
                const notificationEntry = {
                  type: 'notification',
                  channel: 'email',
                  event: 'order_status',
                  status: 'confirmed',
                  timestamp: nowIso,
                  success: true,
                  automated: true,
                };

                const nextTimeline = [...timelineArr, notificationEntry];
                await supabaseAdmin
                  .from('orders')
                  .update({ timeline: nextTimeline })
                  .eq('id', order.id)
                  .eq('status', 'confirmed');
              }
            }
          } catch (emailErr) {
            console.error('Automation confirmed email error:', {
              orderId: order.id,
              orderNumber: order.order_number,
              error: emailErr,
            });
          }
        }
      }
    }

    // Aktif durumlar: teslim edilmemiş / iptal edilmemiş
    const activeStatuses = ['confirmed', 'processing', 'shipped'];

    // Önce "delivery.deliveryDate" JSON alanı bugün ile başlayanları dene (performans için)
    const { data: candidates1, error: err1 } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, customer_email, customer_name, customer_phone, delivery, payment, order_time_group, timeline, created_at, updated_at, delivered_at')
      .in('status', activeStatuses)
      .like('delivery->>deliveryDate', `${todayKey}%`)
      .order('created_at', { ascending: false })
      .limit(2000);

    if (err1) {
      console.error('Automation query error (primary):', err1);
    }

    let candidates: OrderRow[] = (candidates1 as unknown as OrderRow[]) || [];

    // Fallback: format farklıysa (like eşleşmezse) son 14 günün aktif siparişlerini çekip uygulamada filtrele
    if (candidates.length === 0) {
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: candidates2, error: err2 } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, status, customer_email, customer_name, customer_phone, delivery, payment, order_time_group, timeline, created_at, updated_at, delivered_at')
        .in('status', activeStatuses)
        .gte('created_at', fourteenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(5000);

      if (err2) {
        console.error('Automation query error (fallback):', err2);
        return { updated: 0, orders: [] };
      }
      candidates = (candidates2 as unknown as OrderRow[]) || [];
    }

    const updatedOrders: Array<{ orderNumber: number; oldStatus: string; newStatus: string }> = [];

    for (const order of candidates) {
      // Only paid orders
      if (!isPaymentPaid(order.payment)) continue;

      const deliveryKey = parseDeliveryDateKeyFromOrder(order);
      if (!deliveryKey) continue;
      if (deliveryKey !== todayKey) continue; // Sadece teslimat günü

      // Bu sipariş için programı hesapla
      const schedule = calculateAutomationSchedule(order);
      if (schedule.length === 0) continue;

      // Şu an güncellenmelisi gereken bir durum var mı?
      for (const item of schedule) {
        if (now >= item.targetTime && order.status !== item.targetStatus) {
          // Durum sırasını kontrol et (geriye gitme)
          const statusOrder = ['confirmed', 'processing', 'shipped', 'delivered'];
          const currentIndex = statusOrder.indexOf(order.status);
          const targetIndex = statusOrder.indexOf(item.targetStatus);
          if (currentIndex === -1 || targetIndex === -1) break;
          if (targetIndex <= currentIndex) break;

          const oldStatus = order.status;
          const newStatus = item.targetStatus;

          const timelineArr = Array.isArray(order.timeline) ? [...order.timeline] : [];

          const statusLabels: Record<string, string> = {
            processing: 'Sipariş Hazırlanıyor',
            shipped: 'Kargoya Verildi',
            delivered: 'Teslim Edildi',
          };

          timelineArr.push({
            status: newStatus,
            timestamp: nowIso,
            note: statusLabels[newStatus] || '',
            automated: true,
          });

          // order_time_group yoksa hesaplayıp yaz (opsiyonel ama faydalı)
          const storedGroup = (order.order_time_group || '').toLowerCase();
          const computedGroup = getOrderTimeGroup(new Date(order.created_at));
          const nextGroup =
            storedGroup === 'noon' || storedGroup === 'evening' || storedGroup === 'overnight'
              ? storedGroup
              : computedGroup;

          const updatePayload: Record<string, unknown> = {
            status: newStatus,
            updated_at: nowIso,
            timeline: timelineArr,
            order_time_group: nextGroup,
          };

          if (newStatus === 'delivered') {
            updatePayload.delivered_at = nowIso;
          }

          const { error: updateErr } = await supabaseAdmin
            .from('orders')
            .update(updatePayload)
            .eq('id', order.id)
            .eq('status', oldStatus); // idempotent guard

          if (updateErr) {
            console.error('Automation update error:', {
              orderId: order.id,
              orderNumber: order.order_number,
              oldStatus,
              newStatus,
              error: updateErr,
            });
            break;
          }

          updatedOrders.push({
            orderNumber: order.order_number,
            oldStatus,
            newStatus,
          });

          // Send status update email (non-fatal)
          try {
            const customerEmail = (order.customer_email || '').toString().trim();
            const customerName = (order.customer_name || '').toString().trim() || 'Değerli Müşterimiz';

            if (customerEmail && (newStatus === 'processing' || newStatus === 'shipped' || newStatus === 'delivered')) {
              const deliveryFields = getDeliveryFields(order);
              const sent = await EmailService.sendOrderStatusUpdate({
                customerEmail,
                customerName,
                orderNumber: String(order.order_number),
                status: newStatus,
                ...deliveryFields,
              });

              if (sent) {
                const notificationEntry = {
                  type: 'notification',
                  channel: 'email',
                  event: 'order_status',
                  status: newStatus,
                  timestamp: nowIso,
                  success: true,
                  automated: true,
                };

                const nextTimeline = [...timelineArr, notificationEntry];
                await supabaseAdmin
                  .from('orders')
                  .update({ timeline: nextTimeline })
                  .eq('id', order.id)
                  .eq('status', newStatus);
              }
            }
          } catch (emailErr) {
            console.error('Automation status email error:', {
              orderId: order.id,
              orderNumber: order.order_number,
              status: newStatus,
              error: emailErr,
            });
          }

          break; // Bir seferde sadece bir durum güncellemesi yap
        }
      }
    }

    return {
      updated: updatedOrders.length,
      orders: updatedOrders,
    };
  } catch (error) {
    console.error('Automation error:', error);
    return { updated: 0, orders: [] };
  }
}

/**
 * Tahmini teslimat saatini hesapla
 */
export function getEstimatedDeliveryTime(order: OrderRow): string {
  const deliveryKey = parseDeliveryDateKeyFromOrder(order);
  if (!deliveryKey) {
    return 'Teslimat tarihi belirtilmedi';
  }

  const storedGroup = (order.order_time_group || '').toLowerCase();
  const timeGroup: OrderTimeGroup =
    storedGroup === 'noon' || storedGroup === 'evening' || storedGroup === 'overnight'
      ? (storedGroup as OrderTimeGroup)
      : getOrderTimeGroup(new Date(order.created_at));

  const effectiveGroup: OrderTimeGroup = timeGroup === 'overnight' ? 'noon' : timeGroup;
  const estimated =
    effectiveGroup === 'noon'
      ? new Date(`${deliveryKey}T18:00:00+03:00`)
      : new Date(`${deliveryKey}T22:30:00+03:00`);

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ISTANBUL_TZ,
  };

  return estimated.toLocaleString('tr-TR', options);
}

/**
 * Sipariş için bir sonraki otomatik güncelleme zamanını getir
 */
export function getNextAutomationTime(order: OrderRow): Date | null {
  if (order.status === 'delivered' || order.status === 'cancelled') {
    return null;
  }

  const schedule = calculateAutomationSchedule(order);
  const now = new Date();

  for (const item of schedule) {
    if (item.targetTime > now) {
      return item.targetTime;
    }
  }

  return null;
}

/**
 * Yeni sipariş için zaman grubunu hesapla
 * Sipariş oluşturulurken kullanılır
 */
export function getOrderTimeGroupForNewOrder(): OrderTimeGroup {
  return getOrderTimeGroup(new Date());
}
