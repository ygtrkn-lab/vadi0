import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase/admin';

const ISTANBUL_TZ = 'Europe/Istanbul';

function getIstanbulHour(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ISTANBUL_TZ,
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const hourPart = parts.find((p) => p.type === 'hour');
  const hour = hourPart ? parseInt(hourPart.value, 10) : NaN;
  return Number.isFinite(hour) ? hour : date.getHours();
}

function computeOrderTimeGroup(createdAtIso: string): 'noon' | 'evening' | 'overnight' {
  const createdAt = new Date(createdAtIso);
  const hour = getIstanbulHour(createdAt);

  if (hour >= 11 && hour < 17) return 'noon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'overnight';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function normalizeDeliveryDate(value: unknown): string | null {
  const raw = getString(value);
  if (!raw) return null;

  const m = /^\d{4}-\d{2}-\d{2}/.exec(raw);
  if (m) return m[0];

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  // Return YYYY-MM-DD in Istanbul timezone.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ISTANBUL_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

/**
 * POST /api/orders/backfill-paid
 *
 * One-time data fix to make existing "paid" orders eligible for delivery-day automation.
 *
 * - If payment.status == 'paid' and status is pending/pending_payment => set status 'confirmed'
 * - If order_time_group is missing => compute it from created_at (Istanbul time)
 * - If delivery.deliveryDate is not normalized => normalize to YYYY-MM-DD
 * - Optionally append timeline 'confirmed' entry when status is changed
 *
 * Auth:
 * - If CRON_SECRET is set, requires header: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const nowIso = new Date().toISOString();

    // Fetch paid orders (limit to a sane number for one run)
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, payment, delivery, order_time_group, timeline, created_at')
      .filter('payment->>status', 'eq', 'paid')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error) {
      console.error('Backfill query error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const updated: Array<{ orderNumber: number; changes: string[] }> = [];
    let updatedCount = 0;

    for (const order of orders || []) {
      const changes: string[] = [];
      const updatePayload: any = {};

      const status = String((order as any).status || '');
      const createdAt = String((order as any).created_at || '');

      // Fix missing/incorrect order_time_group
      const existingGroup = String(((order as any).order_time_group || '') as string).toLowerCase();
      if (!existingGroup || (existingGroup !== 'noon' && existingGroup !== 'evening' && existingGroup !== 'overnight')) {
        if (createdAt) {
          updatePayload.order_time_group = computeOrderTimeGroup(createdAt);
          changes.push('order_time_group');
        }
      }

      // Normalize deliveryDate
      const delivery = isRecord((order as any).delivery) ? ((order as any).delivery as Record<string, unknown>) : null;
      if (delivery) {
        const currentRaw = getString(delivery.deliveryDate);
        const normalized = normalizeDeliveryDate(delivery.deliveryDate);
        if (normalized && currentRaw && currentRaw !== normalized) {
          updatePayload.delivery = { ...delivery, deliveryDate: normalized };
          changes.push('delivery.deliveryDate');
        }
      }

      // Fix status to confirmed for paid orders
      if (status === 'pending' || status === 'pending_payment') {
        updatePayload.status = 'confirmed';
        changes.push('status');

        const timelineArr = Array.isArray((order as any).timeline) ? ([...(order as any).timeline] as any[]) : [];
        const hasConfirmed = timelineArr.some((t) => isRecord(t) && String(t.status || '').toLowerCase() === 'confirmed');
        if (!hasConfirmed) {
          timelineArr.push({
            status: 'confirmed',
            timestamp: nowIso,
            note: 'Ödeme onaylandı (backfill)',
            automated: true,
          });
          updatePayload.timeline = timelineArr;
          changes.push('timeline');
        }
      }

      if (changes.length === 0) continue;
      updatePayload.updated_at = nowIso;

      const { error: updateError } = await (supabaseAdmin as any)
        .from('orders')
        .update(updatePayload as any)
        .eq('id', (order as any).id);

      if (updateError) {
        console.error('Backfill update error:', { id: (order as any).id, error: updateError });
        continue;
      }

      updatedCount += 1;
      updated.push({ orderNumber: (order as any).order_number, changes });
    }

    return NextResponse.json({
      success: true,
      scanned: (orders || []).length,
      updated: updatedCount,
      details: updated,
      timestamp: nowIso,
    });
  } catch (e) {
    console.error('Backfill endpoint error:', e);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
