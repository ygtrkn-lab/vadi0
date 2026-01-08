import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb, isAnalyticsEnabled } from '@/lib/supabase/analytics-client';

/**
 * GET /api/analytics/insights
 * Scroll depth, error tracking ve cart abandonment verileri
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAnalyticsEnabled || !analyticsDb) {
      return NextResponse.json({ error: 'Analytics disabled' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const normalizeStart = (d: Date) => { d.setHours(0, 0, 0, 0); return d; };
    const normalizeEnd = (d: Date) => { d.setHours(23, 59, 59, 999); return d; };

    // Tarih aralığını hesapla
    let dateFrom: string;
    let dateTo: string;
    const now = new Date();

    if (startDateParam || endDateParam) {
      dateFrom = normalizeStart(new Date(startDateParam || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))).toISOString();
      dateTo = normalizeEnd(new Date(endDateParam || now)).toISOString();
    } else {
      const days = period === '1d' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
      dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      dateTo = new Date().toISOString();
    }

    // Paralel sorgular
    const [
      scrollDepthResult,
      errorsResult,
      cartAbandonmentResult,
      checkoutAbandonmentResult,
    ] = await Promise.all([
      // Scroll depth verileri
      analyticsDb
        .from('visitor_events')
        .select('event_name, event_label, properties')
        .in('event_name', ['scroll_depth', 'scroll_depth_final'])
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo),

      // Hata verileri
      analyticsDb
        .from('visitor_events')
        .select('event_name, event_label, properties, created_at')
        .in('event_name', ['js_error', 'unhandled_rejection', 'api_error', 'network_error'])
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo)
        .order('created_at', { ascending: false })
        .limit(100),

      // Cart abandonment
      analyticsDb
        .from('visitor_events')
        .select('event_label, properties, created_at')
        .eq('event_name', 'cart_abandonment')
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo),

      // Checkout abandonment
      analyticsDb
        .from('visitor_events')
        .select('event_label, properties, created_at')
        .eq('event_name', 'checkout_abandonment')
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo),
    ]);

    // ==========================================
    // Scroll Depth Analizi
    // ==========================================
    type ScrollEvent = { event_name: string; event_label: string; properties: any };
    const scrollEvents = (scrollDepthResult.data || []) as ScrollEvent[];
    
    const scrollMilestones: Record<number, number> = { 25: 0, 50: 0, 75: 0, 90: 0, 100: 0 };
    const pageScrollDepth: Record<string, { total: number; count: number; avg: number }> = {};
    
    scrollEvents.forEach(event => {
      const depth = event.properties?.scroll_depth || event.properties?.max_scroll_depth;
      const pagePath = event.properties?.page_path || '/';
      
      if (event.event_name === 'scroll_depth' && depth) {
        scrollMilestones[depth] = (scrollMilestones[depth] || 0) + 1;
      }
      
      if (event.event_name === 'scroll_depth_final' && event.properties?.max_scroll_depth) {
        if (!pageScrollDepth[pagePath]) {
          pageScrollDepth[pagePath] = { total: 0, count: 0, avg: 0 };
        }
        pageScrollDepth[pagePath].total += event.properties.max_scroll_depth;
        pageScrollDepth[pagePath].count++;
        pageScrollDepth[pagePath].avg = Math.round(
          pageScrollDepth[pagePath].total / pageScrollDepth[pagePath].count
        );
      }
    });

    // En düşük scroll depth'e sahip sayfalar (potansiyel sorunlu içerik)
    const lowEngagementPages = Object.entries(pageScrollDepth)
      .filter(([_, data]) => data.count >= 3) // En az 3 ziyaret
      .map(([path, data]) => ({ path, ...data }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 10);

    // ==========================================
    // Error Tracking Analizi
    // ==========================================
    type ErrorEvent = { event_name: string; event_label: string; properties: any; created_at: string };
    const errorEvents = (errorsResult.data || []) as ErrorEvent[];
    
    const errorsByType: Record<string, number> = {};
    const errorsByPage: Record<string, number> = {};
    const recentErrors: Array<{
      type: string;
      message: string;
      page: string;
      timestamp: string;
      count?: number;
    }> = [];
    
    // Hataları grupla
    const errorGroups: Record<string, { count: number; lastSeen: string; type: string; page: string }> = {};
    
    errorEvents.forEach(event => {
      // Tipe göre say
      errorsByType[event.event_name] = (errorsByType[event.event_name] || 0) + 1;
      
      // Sayfaya göre say
      const page = event.properties?.page_path || 'unknown';
      errorsByPage[page] = (errorsByPage[page] || 0) + 1;
      
      // Hata grupla (aynı mesajı tekrarlama)
      const errorKey = `${event.event_name}:${event.event_label}`;
      if (!errorGroups[errorKey]) {
        errorGroups[errorKey] = {
          count: 1,
          lastSeen: event.created_at,
          type: event.event_name,
          page,
        };
        recentErrors.push({
          type: event.event_name,
          message: event.event_label,
          page,
          timestamp: event.created_at,
        });
      } else {
        errorGroups[errorKey].count++;
      }
    });

    // Tekrarlayan hataları güncelle
    recentErrors.forEach(error => {
      const key = `${error.type}:${error.message}`;
      if (errorGroups[key]) {
        error.count = errorGroups[key].count;
      }
    });

    // ==========================================
    // Cart Abandonment Analizi
    // ==========================================
    type AbandonmentEvent = { event_label: string; properties: any; created_at: string };
    const cartAbandons = (cartAbandonmentResult.data || []) as AbandonmentEvent[];
    const checkoutAbandons = (checkoutAbandonmentResult.data || []) as AbandonmentEvent[];

    let totalCartValue = 0;
    let totalCartItems = 0;
    const abandonedProducts: Record<string, { name: string; count: number }> = {};
    const abandonmentByHour: Record<number, number> = {};

    [...cartAbandons, ...checkoutAbandons].forEach(event => {
      const props = event.properties || {};
      
      // Toplam değer
      totalCartValue += props.cart_total || 0;
      totalCartItems += props.cart_items_count || 0;
      
      // Hangi ürünler terk edildi
      if (props.cart_items && Array.isArray(props.cart_items)) {
        props.cart_items.forEach((item: any) => {
          const key = item.id || item.name;
          if (key) {
            if (!abandonedProducts[key]) {
              abandonedProducts[key] = { name: item.name || `Ürün #${key}`, count: 0 };
            }
            abandonedProducts[key].count += item.quantity || 1;
          }
        });
      }
      
      // Saate göre dağılım
      const hour = new Date(event.created_at).getHours();
      abandonmentByHour[hour] = (abandonmentByHour[hour] || 0) + 1;
    });

    // En çok terk edilen ürünler
    const topAbandonedProducts = Object.entries(abandonedProducts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Saate göre abandonment dağılımı
    const abandonmentByHourArray = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      count: abandonmentByHour[hour] || 0,
    }));

    return NextResponse.json({
      period,
      dateRange: { from: dateFrom, to: dateTo },
      
      // Scroll Depth
      scrollDepth: {
        milestones: scrollMilestones,
        lowEngagementPages,
        totalMeasurements: scrollEvents.filter(e => e.event_name === 'scroll_depth_final').length,
      },
      
      // Error Tracking
      errors: {
        total: errorEvents.length,
        byType: errorsByType,
        byPage: Object.entries(errorsByPage)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
        recent: recentErrors.slice(0, 20),
      },
      
      // Cart Abandonment
      cartAbandonment: {
        cartAbandons: cartAbandons.length,
        checkoutAbandons: checkoutAbandons.length,
        totalAbandons: cartAbandons.length + checkoutAbandons.length,
        totalLostRevenue: totalCartValue,
        avgCartValue: cartAbandons.length + checkoutAbandons.length > 0 
          ? Math.round(totalCartValue / (cartAbandons.length + checkoutAbandons.length))
          : 0,
        totalItemsAbandoned: totalCartItems,
        topAbandonedProducts,
        byHour: abandonmentByHourArray,
      },
    });
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
