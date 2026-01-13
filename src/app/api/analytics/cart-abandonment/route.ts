import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb, getAnalyticsStatus } from '@/lib/supabase/analytics-client';
// IP hash kullanılmıyor; doğrudan IP tutulacak

/**
 * Gerçek IP adresini al (proxy arkasında bile)
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return '127.0.0.1';
}

/**
 * POST /api/analytics/cart-abandonment
 * Sepet terk kaydı oluştur (20sn+ geçirip adres formuna ulaşan kullanıcılar)
 */
export async function POST(request: NextRequest) {
  try {
    const analyticsEnabled = await getAnalyticsStatus();
    if (!analyticsEnabled || !analyticsDb) {
      return NextResponse.json({ success: false, error: 'Analytics disabled' }, { status: 503 });
    }

    // Beacon API text/plain gönderebilir
    let body;
    try {
      const text = await request.text();
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const {
      visitorId,
      sessionId,
      customerId,
      customerEmail,
      customerPhone,
      cartItems,
      cartTotal,
      cartItemCount,
      reachedStep,
      reachedAddressForm,
      filledFields,
      timeOnCartSeconds,
      timeOnRecipientSeconds,
      timeOnMessageSeconds,
      timeOnPaymentSeconds,
      totalCheckoutSeconds,
      selectedDistrict,
      selectedNeighborhood,
      selectedDeliveryDate,
      deviceType,
      browser,
      os,
      userAgent,
      screenWidth,
      screenHeight,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      landingPage,
      startedAt,
      interactions,
    } = body;

    // Minimum 20 saniye geçirmemiş veya adres formuna ulaşmamışsa kaydetme
    if (totalCheckoutSeconds < 20 || !reachedAddressForm) {
      return NextResponse.json({ 
        success: false, 
        reason: 'Criteria not met: must spend 20+ seconds and reach address form' 
      }, { status: 200 });
    }

    const clientIP = getClientIP(request);

    // Son 30 dakikada aynı IP'den kayıt var mı kontrol et (spam önleme)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recentRecord } = await analyticsDb
      .from('cart_abandonment')
      .select('id, total_checkout_seconds')
      .eq('ip_address', clientIP)
      .gte('abandoned_at', thirtyMinutesAgo)
      .order('abandoned_at', { ascending: false })
      .limit(1)
      .single();

    if (recentRecord) {
      // Mevcut kaydı güncelle (daha uzun süre geçirdiyse)
      if (totalCheckoutSeconds > recentRecord.total_checkout_seconds) {
        const { error } = await analyticsDb
          .from('cart_abandonment')
          .update({
            cart_items: cartItems || [],
            cart_total: cartTotal || 0,
            cart_item_count: cartItemCount || 0,
            reached_step: reachedStep || 'cart',
            reached_address_form: reachedAddressForm,
            filled_fields: filledFields || {},
            time_on_cart_seconds: timeOnCartSeconds || 0,
            time_on_recipient_seconds: timeOnRecipientSeconds || 0,
            time_on_message_seconds: timeOnMessageSeconds || 0,
            time_on_payment_seconds: timeOnPaymentSeconds || 0,
            total_checkout_seconds: totalCheckoutSeconds || 0,
            selected_district: selectedDistrict,
            selected_neighborhood: selectedNeighborhood,
            selected_delivery_date: selectedDeliveryDate,
            interactions: interactions || {},
            abandoned_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', recentRecord.id);

        if (error) {
          console.error('Failed to update cart abandonment:', error);
        }

        return NextResponse.json({ 
          success: true, 
          action: 'updated',
          id: recentRecord.id 
        });
      }

      return NextResponse.json({ 
        success: true, 
        action: 'skipped',
        reason: 'Recent record exists with longer duration' 
      });
    }

    // Yeni kayıt oluştur
    const { data, error } = await analyticsDb
      .from('cart_abandonment')
      .insert({
        ip_address: clientIP,
        visitor_id: visitorId,
        session_id: sessionId,
        customer_id: customerId,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        cart_items: cartItems || [],
        cart_total: cartTotal || 0,
        cart_item_count: cartItemCount || 0,
        reached_step: reachedStep || 'cart',
        reached_address_form: reachedAddressForm,
        filled_fields: filledFields || {},
        time_on_cart_seconds: timeOnCartSeconds || 0,
        time_on_recipient_seconds: timeOnRecipientSeconds || 0,
        time_on_message_seconds: timeOnMessageSeconds || 0,
        time_on_payment_seconds: timeOnPaymentSeconds || 0,
        total_checkout_seconds: totalCheckoutSeconds || 0,
        selected_district: selectedDistrict,
        selected_neighborhood: selectedNeighborhood,
        selected_delivery_date: selectedDeliveryDate,
        device_type: deviceType,
        browser: browser,
        os: os,
        user_agent: userAgent,
        screen_width: screenWidth,
        screen_height: screenHeight,
        referrer: referrer,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        landing_page: landingPage,
        started_at: startedAt || new Date().toISOString(),
        abandoned_at: new Date().toISOString(),
        interactions: interactions || {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create cart abandonment record:', error);
      return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      action: 'created',
      id: data?.id 
    });
  } catch (error) {
    console.error('Cart abandonment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/analytics/cart-abandonment
 * Admin için sepet terk kayıtlarını listele
 */
export async function GET(request: NextRequest) {
  try {
    const analyticsEnabled = await getAnalyticsStatus();
    if (!analyticsEnabled || !analyticsDb) {
      return NextResponse.json({ success: false, error: 'Analytics disabled' }, { status: 503 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7d';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status'); // 'abandoned', 'recovered', 'converted'
    const minTime = parseInt(searchParams.get('minTime') || '20');
    const step = searchParams.get('step'); // 'recipient', 'message', 'payment'
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // Tarih aralığını hesapla
    const now = new Date();
    let fromDate: Date | undefined;
    let toDate: Date = now;

    const parseDateStart = (value: string) => {
      const d = new Date(value);
      if (isNaN(d.getTime())) return undefined;
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      return start;
    };

    const parseDateEnd = (value: string) => {
      const d = new Date(value);
      if (isNaN(d.getTime())) return undefined;
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      return end;
    };

    if (fromParam) {
      const parsedFrom = parseDateStart(fromParam);
      if (parsedFrom) {
        fromDate = parsedFrom;
      }
    }

    if (toParam) {
      const parsedTo = parseDateEnd(toParam);
      if (parsedTo) {
        toDate = parsedTo;
      }
    }

    if (!fromDate) {
      switch (period) {
        case '1d':
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    }

    if (fromDate && toDate < fromDate) {
      toDate = new Date(fromDate);
      toDate.setHours(23, 59, 59, 999);
    }

    // Sorgu oluştur
    let query = analyticsDb
      .from('cart_abandonment')
      .select('*', { count: 'exact' })
      .gte('abandoned_at', fromDate.toISOString())
      .lte('abandoned_at', toDate.toISOString())
      .gte('total_checkout_seconds', minTime)
      .order('abandoned_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (step) {
      query = query.eq('reached_step', step);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch cart abandonments:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Özet istatistikler
    const { data: summaryData } = await analyticsDb
      .from('cart_abandonment')
      .select('cart_total, total_checkout_seconds, reached_step, device_type, status, ip_address, interactions')
      .gte('abandoned_at', fromDate.toISOString())
      .lte('abandoned_at', toDate.toISOString())
      .gte('total_checkout_seconds', minTime);

    const fieldAggregates: Record<string, { errors: number; totalInputMs: number; input: number }> = {};
    let scrollCount = 0;
    let scrollMaxSum = 0;
    let timeTo50Sum = 0;
    let timeTo50Count = 0;
    let timeTo90Sum = 0;
    let timeTo90Count = 0;
    let timeToFirstInputSum = 0;
    let timeToFirstInputCount = 0;
    let timeToFirstErrorSum = 0;
    let timeToFirstErrorCount = 0;

    summaryData?.forEach((record) => {
      const interactions = (record as any).interactions || {};
      const fields = interactions.fields || {};
      Object.entries(fields).forEach(([field, metrics]: [string, any]) => {
        if (!fieldAggregates[field]) {
          fieldAggregates[field] = { errors: 0, totalInputMs: 0, input: 0 };
        }
        fieldAggregates[field].errors += metrics?.errors || 0;
        fieldAggregates[field].totalInputMs += metrics?.totalInputMs || 0;
        fieldAggregates[field].input += metrics?.input || 0;
      });

      const scroll = interactions.scroll;
      if (scroll && typeof scroll.maxDepthPercent === 'number') {
        scrollCount += 1;
        scrollMaxSum += scroll.maxDepthPercent || 0;
        if (scroll.timeTo50PercentMs) {
          timeTo50Sum += scroll.timeTo50PercentMs;
          timeTo50Count += 1;
        }
        if (scroll.timeTo90PercentMs) {
          timeTo90Sum += scroll.timeTo90PercentMs;
          timeTo90Count += 1;
        }
      }

      if (typeof interactions.timeToFirstInputMs === 'number') {
        timeToFirstInputSum += interactions.timeToFirstInputMs;
        timeToFirstInputCount += 1;
      }

      if (typeof interactions.timeToFirstErrorMs === 'number') {
        timeToFirstErrorSum += interactions.timeToFirstErrorMs;
        timeToFirstErrorCount += 1;
      }
    });

    const topErrorFields = Object.entries(fieldAggregates)
      .filter(([, m]) => (m.errors || 0) > 0)
      .sort((a, b) => b[1].errors - a[1].errors)
      .slice(0, 5)
      .map(([field, m]) => ({ field, errors: m.errors }));

    const topSlowFields = Object.entries(fieldAggregates)
      .filter(([, m]) => (m.totalInputMs || 0) > 0)
      .sort((a, b) => b[1].totalInputMs - a[1].totalInputMs)
      .slice(0, 5)
      .map(([field, m]) => ({ field, ms: Math.round(m.totalInputMs) }));

    const summary = {
      totalRecords: count || 0,
      uniqueIPs: new Set(summaryData?.map(r => r.ip_address) || []).size,
      totalAbandonedValue: summaryData?.reduce((sum, r) => sum + (r.cart_total || 0), 0) || 0,
      avgTimeSeconds: summaryData?.length 
        ? Math.round(summaryData.reduce((sum, r) => sum + (r.total_checkout_seconds || 0), 0) / summaryData.length)
        : 0,
      byStep: {
        cart: summaryData?.filter(r => r.reached_step === 'cart').length || 0,
        recipient: summaryData?.filter(r => r.reached_step === 'recipient').length || 0,
        message: summaryData?.filter(r => r.reached_step === 'message').length || 0,
        payment: summaryData?.filter(r => r.reached_step === 'payment').length || 0,
      },
      byDevice: {
        desktop: summaryData?.filter(r => r.device_type === 'desktop').length || 0,
        mobile: summaryData?.filter(r => r.device_type === 'mobile').length || 0,
        tablet: summaryData?.filter(r => r.device_type === 'tablet').length || 0,
      },
      byStatus: {
        abandoned: summaryData?.filter(r => r.status === 'abandoned').length || 0,
        recovered: summaryData?.filter(r => r.status === 'recovered').length || 0,
        converted: summaryData?.filter(r => r.status === 'converted').length || 0,
      },
      interactions: {
        topErrorFields,
        topSlowFields,
        avgMaxScrollPercent: scrollCount ? Math.round(scrollMaxSum / scrollCount) : 0,
        avgTimeToFirstInputSeconds: timeToFirstInputCount ? Math.round((timeToFirstInputSum / timeToFirstInputCount) / 1000) : undefined,
        avgTimeToFirstErrorSeconds: timeToFirstErrorCount ? Math.round((timeToFirstErrorSum / timeToFirstErrorCount) / 1000) : undefined,
        avgTimeTo50ScrollSeconds: timeTo50Count ? Math.round((timeTo50Sum / timeTo50Count) / 1000) : undefined,
        avgTimeTo90ScrollSeconds: timeTo90Count ? Math.round((timeTo90Sum / timeTo90Count) / 1000) : undefined,
      },
    };

    return NextResponse.json({
      success: true,
      period,
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      summary,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Cart abandonment GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
