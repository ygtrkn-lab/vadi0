import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb, getAnalyticsStatus } from '@/lib/supabase/analytics-client';

/**
 * POST /api/analytics/pageview
 * Sayfa görüntüleme kaydet
 */
export async function POST(request: NextRequest) {
  try {
    // Analytics devre dışıysa veya DB bağlantısı yoksa
    const analyticsEnabled = await getAnalyticsStatus();
    if (!analyticsEnabled || !analyticsDb) {
      return NextResponse.json({ success: false, error: 'Analytics disabled' }, { status: 503 });
    }

    const body = await request.json();
    const {
      sessionId,
      visitorId,
      pageUrl,
      pagePath,
      pageTitle,
      pageType,
      productId,
      productName,
      categorySlug,
      categoryName,
      referrerPath,
      loadTimeMs,
    } = body;

    if (!sessionId || !visitorId || !pageUrl || !pagePath) {
      return NextResponse.json(
        { error: 'sessionId, visitorId, pageUrl and pagePath are required' },
        { status: 400 }
      );
    }

    // Sayfa tipini otomatik belirle
    let detectedPageType = pageType;
    if (!detectedPageType) {
      if (pagePath === '/') {
        detectedPageType = 'home';
      } else if (pagePath.startsWith('/sepet')) {
        detectedPageType = 'cart';
      } else if (pagePath.startsWith('/payment') || pagePath.startsWith('/odeme')) {
        detectedPageType = 'checkout';
      } else if (pagePath.startsWith('/hesabim')) {
        detectedPageType = 'account';
      } else if (pagePath.startsWith('/arama')) {
        detectedPageType = 'search';
      } else if (pagePath.startsWith('/siparis-takip')) {
        detectedPageType = 'order_tracking';
      } else if (productId) {
        detectedPageType = 'product';
      } else if (categorySlug) {
        detectedPageType = 'category';
      } else {
        detectedPageType = 'page';
      }
    }

    // Önce session var mı kontrol et
    const { data: existingSession } = await analyticsDb
      .from('visitor_sessions')
      .select('id')
      .eq('id', sessionId)
      .single();

    // Session yoksa, önce session oluştur
    if (!existingSession) {
      await analyticsDb
        .from('visitor_sessions')
        .insert({
          id: sessionId,
          visitor_id: visitorId,
          landing_page: pagePath,
          started_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        });
    }

    // Page view ekle
    const { data, error } = await analyticsDb
      .from('page_views')
      .insert({
        session_id: sessionId,
        visitor_id: visitorId,
        page_url: pageUrl,
        page_path: pagePath,
        page_title: pageTitle,
        page_type: detectedPageType,
        product_id: productId,
        product_name: productName,
        category_slug: categorySlug,
        category_name: categoryName,
        referrer_path: referrerPath,
        load_time_ms: loadTimeMs,
        viewed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create page view:', error);
      return NextResponse.json({ error: 'Failed to create page view' }, { status: 500 });
    }

    // Session'ın page_views sayısını artır ve is_bounce güncelle
    const { data: sessionData } = await analyticsDb
      .from('visitor_sessions')
      .select('page_views')
      .eq('id', sessionId)
      .single();

    const newPageViewCount = (sessionData?.page_views ?? 0) + 1;

    await analyticsDb
      .from('visitor_sessions')
      .update({
        page_views: newPageViewCount,
        is_bounce: newPageViewCount <= 1,
        last_activity_at: new Date().toISOString(),
      } as { page_views: number; is_bounce: boolean; last_activity_at: string })
      .eq('id', sessionId);

    return NextResponse.json({ success: true, pageViewId: data?.id });
  } catch (error) {
    console.error('PageView POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/analytics/pageview
 * Sayfa görüntüleme güncelle (süre, scroll derinliği)
 */
export async function PATCH(request: NextRequest) {
  try {
    if (!isAnalyticsEnabled || !analyticsDb) {
      return NextResponse.json({ success: false, error: 'Analytics disabled' }, { status: 503 });
    }

    const body = await request.json();
    const { pageViewId, timeOnPageSeconds, scrollDepthPercent } = body;

    if (!pageViewId) {
      return NextResponse.json({ error: 'pageViewId is required' }, { status: 400 });
    }

    const updateData: {
      left_at: string;
      time_on_page_seconds?: number;
      scroll_depth_percent?: number;
    } = {
      left_at: new Date().toISOString(),
    };

    if (timeOnPageSeconds !== undefined) {
      updateData.time_on_page_seconds = timeOnPageSeconds;
    }

    if (scrollDepthPercent !== undefined) {
      updateData.scroll_depth_percent = scrollDepthPercent;
    }

    const { error } = await analyticsDb
      .from('page_views')
      .update(updateData)
      .eq('id', pageViewId);

    if (error) {
      console.error('Failed to update page view:', error);
      return NextResponse.json({ error: 'Failed to update page view' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PageView PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/analytics/pageview
 * Sayfa görüntülemelerini getir (admin için)
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAnalyticsEnabled || !analyticsDb) {
      return NextResponse.json({ pageViews: [], total: 0, limit: 100, offset: 0 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sessionId = searchParams.get('sessionId');
    const pagePath = searchParams.get('pagePath');
    const pageType = searchParams.get('pageType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = analyticsDb
      .from('page_views')
      .select('*', { count: 'exact' })
      .order('viewed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    if (pagePath) {
      query = query.eq('page_path', pagePath);
    }

    if (pageType) {
      query = query.eq('page_type', pageType);
    }

    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      query = query.gte('viewed_at', s.toISOString());
    }

    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      query = query.lte('viewed_at', e.toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to get page views:', error);
      return NextResponse.json({ error: 'Failed to get page views' }, { status: 500 });
    }

    return NextResponse.json({
      pageViews: data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('PageView GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
