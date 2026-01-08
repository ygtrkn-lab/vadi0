import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb, isAnalyticsEnabled } from '@/lib/supabase/analytics-client';

/**
 * GET /api/analytics/stats
 * Dashboard için özet istatistikler
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAnalyticsEnabled || !analyticsDb) {
      return NextResponse.json({ error: 'Analytics disabled' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 1d, 7d, 30d, 90d
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Tarih aralığını hesapla (günü tam kapsayacak şekilde)
    const normalizeStart = (d: Date) => { d.setHours(0, 0, 0, 0); return d; };
    const normalizeEnd = (d: Date) => { d.setHours(23, 59, 59, 999); return d; };

    let dateFrom: Date;
    const dateTo = normalizeEnd(endDate ? new Date(endDate) : new Date());

    if (startDate) {
      dateFrom = normalizeStart(new Date(startDate));
    } else {
      const days = period === '1d' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
      dateFrom = normalizeStart(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
    }

    const dateFromStr = dateFrom.toISOString();
    const dateToStr = dateTo.toISOString();

    // Paralel sorgular
    const [
      sessionsResult,
      pageViewsResult,
      eventsResult,
      topPagesResult,
      topProductsResult,
      trafficSourcesResult,
      deviceStatsResult,
      realtimeResult,
      conversionResult,
    ] = await Promise.all([
      // Toplam oturum sayısı ve benzersiz ziyaretçi
      analyticsDb
        .from('visitor_sessions')
        .select('id, visitor_id, duration_seconds, is_bounce, page_views', { count: 'exact' })
        .gte('started_at', dateFromStr)
        .lte('started_at', dateToStr),

      // Toplam sayfa görüntüleme
      analyticsDb
        .from('page_views')
        .select('id', { count: 'exact' })
        .gte('viewed_at', dateFromStr)
        .lte('viewed_at', dateToStr),

      // Toplam event
      analyticsDb
        .from('visitor_events')
        .select('id, event_name', { count: 'exact' })
        .gte('created_at', dateFromStr)
        .lte('created_at', dateToStr),

      // En çok görüntülenen sayfalar
      analyticsDb
        .from('page_views')
        .select('page_path, page_title')
        .gte('viewed_at', dateFromStr)
        .lte('viewed_at', dateToStr),

      // En çok görüntülenen ürünler
      analyticsDb
        .from('page_views')
        .select('product_id, product_name')
        .not('product_id', 'is', null)
        .gte('viewed_at', dateFromStr)
        .lte('viewed_at', dateToStr),

      // Trafik kaynakları
      analyticsDb
        .from('visitor_sessions')
        .select('utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, referrer_domain, landing_page')
        .gte('started_at', dateFromStr)
        .lte('started_at', dateToStr),

      // Cihaz istatistikleri
      analyticsDb
        .from('visitor_sessions')
        .select('device_type, browser, os')
        .gte('started_at', dateFromStr)
        .lte('started_at', dateToStr),

      // Gerçek zamanlı ziyaretçiler (son 5 dakika)
      analyticsDb
        .from('visitor_sessions')
        .select('id, visitor_id, landing_page, device_type')
        .gte('last_activity_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()),

      // Dönüşüm verileri
      analyticsDb
        .from('visitor_sessions')
        .select('converted, conversion_value')
        .eq('converted', true)
        .gte('started_at', dateFromStr)
        .lte('started_at', dateToStr),
    ]);

    // İstatistikleri hesapla
    type SessionRow = { id: string; visitor_id: string; duration_seconds: number; is_bounce: boolean; page_views: number };
    type PageViewRow = { page_path: string; page_title: string | null };
    type ProductViewRow = { product_id: number | null; product_name: string | null };
    type TrafficRow = { 
      utm_source: string | null; 
      utm_medium: string | null; 
      utm_campaign: string | null;
      utm_content: string | null;
      utm_term: string | null;
      referrer: string | null;
      referrer_domain: string | null;
      landing_page: string | null;
    };
    type DeviceRow = { device_type: string | null; browser: string | null; os: string | null };
    type EventRow = { id: string; event_name: string };
    type ConversionRow = { converted: boolean; conversion_value: number };

    const sessions = (sessionsResult.data || []) as SessionRow[];
    const totalSessions = sessionsResult.count || 0;
    const uniqueVisitors = new Set(sessions.map(s => s.visitor_id)).size;
    const totalPageViews = pageViewsResult.count || 0;
    const totalEvents = eventsResult.count || 0;
    const realtimeVisitors = realtimeResult.data?.length || 0;

    // Ortalama oturum süresi
    const totalSessionDuration = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
    const avgSessionDuration = sessions.length > 0
      ? Math.round(totalSessionDuration / sessions.length)
      : 0;

    // Bounce rate
    const bounceSessions = sessions.filter(s => s.is_bounce).length;
    const bounceRate = totalSessions > 0 ? Math.round((bounceSessions / totalSessions) * 100) : 0;

    // Ortalama sayfa/oturum
    const avgPagesPerSession = totalSessions > 0
      ? Math.round((totalPageViews / totalSessions) * 100) / 100
      : 0;

    // En çok görüntülenen sayfalar
    const pageViewsByPath: Record<string, { count: number; title: string }> = {};
    ((topPagesResult.data || []) as PageViewRow[]).forEach(pv => {
      if (!pageViewsByPath[pv.page_path]) {
        pageViewsByPath[pv.page_path] = { count: 0, title: pv.page_title || pv.page_path };
      }
      pageViewsByPath[pv.page_path].count++;
    });
    const topPages = Object.entries(pageViewsByPath)
      .map(([path, data]) => ({ path, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // En çok görüntülenen ürünler
    const productViews: Record<number, { count: number; name: string }> = {};
    ((topProductsResult.data || []) as ProductViewRow[]).forEach(pv => {
      if (!pv.product_id) return;
      if (!productViews[pv.product_id]) {
        productViews[pv.product_id] = { count: 0, name: pv.product_name || `Ürün #${pv.product_id}` };
      }
      productViews[pv.product_id].count++;
    });
    const topProducts = Object.entries(productViews)
      .map(([id, data]) => ({ productId: parseInt(id), ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Trafik kaynakları
    const trafficSources: Record<string, number> = {
      direct: 0,
      organic: 0,
      social: 0,
      paid: 0,
      referral: 0,
      email: 0,
    };
    
    // Detaylı kaynak bilgisi (TikTok, Instagram, Facebook, Google vs.)
    const detailedSources: Record<string, number> = {};
    
    ((trafficSourcesResult.data || []) as TrafficRow[]).forEach(s => {
      // Detaylı kaynak ekle
      const source = s.utm_source || s.referrer_domain || 'direct';
      const normalizedSource = source.toLowerCase()
        .replace('www.', '')
        .replace('.com', '')
        .replace('.co', '')
        .replace('.net', '')
        .replace('.org', '');
      
      // Bilinen sosyal medya platformlarını normalize et
      let displaySource = normalizedSource;
      if (normalizedSource.includes('instagram') || normalizedSource.includes('ig')) {
        displaySource = 'Instagram';
      } else if (normalizedSource.includes('facebook') || normalizedSource.includes('fb')) {
        displaySource = 'Facebook';
      } else if (normalizedSource.includes('tiktok')) {
        displaySource = 'TikTok';
      } else if (normalizedSource.includes('twitter') || normalizedSource.includes('x.')) {
        displaySource = 'Twitter/X';
      } else if (normalizedSource.includes('google')) {
        displaySource = 'Google';
      } else if (normalizedSource.includes('bing')) {
        displaySource = 'Bing';
      } else if (normalizedSource.includes('yandex')) {
        displaySource = 'Yandex';
      } else if (normalizedSource.includes('linkedin')) {
        displaySource = 'LinkedIn';
      } else if (normalizedSource.includes('youtube')) {
        displaySource = 'YouTube';
      } else if (normalizedSource.includes('pinterest')) {
        displaySource = 'Pinterest';
      } else if (normalizedSource === 'direct' || !source || source === 'direct') {
        displaySource = 'Doğrudan';
      } else {
        displaySource = source; // Orijinal kaynak adını kullan
      }
      
      detailedSources[displaySource] = (detailedSources[displaySource] || 0) + 1;
      
      // Kategori bazlı gruplama
      if (s.utm_medium === 'cpc' || s.utm_medium === 'paid') {
        trafficSources.paid++;
      } else if (s.utm_medium === 'email') {
        trafficSources.email++;
      } else if (['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin', 'youtube', 'pinterest'].some(
        platform => (s.utm_source || '').toLowerCase().includes(platform) || 
                    (s.referrer_domain || '').toLowerCase().includes(platform)
      )) {
        trafficSources.social++;
      } else if (s.referrer_domain?.match(/google|bing|yandex|yahoo/i)) {
        trafficSources.organic++;
      } else if (s.referrer_domain) {
        trafficSources.referral++;
      } else {
        trafficSources.direct++;
      }
    });
    
    // Detaylı kaynakları sırala
    const topSources = Object.entries(detailedSources)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Kampanya analizi
    const campaignStats: Record<string, { count: number; source: string; medium: string }> = {};
    const referrerStats: Record<string, { count: number; fullUrl: string }> = {};
    const landingPageStats: Record<string, number> = {};
    const mediumStats: Record<string, number> = {};
    
    ((trafficSourcesResult.data || []) as TrafficRow[]).forEach(s => {
      // Kampanya istatistikleri
      if (s.utm_campaign) {
        if (!campaignStats[s.utm_campaign]) {
          campaignStats[s.utm_campaign] = { count: 0, source: s.utm_source || '', medium: s.utm_medium || '' };
        }
        campaignStats[s.utm_campaign].count++;
      }
      
      // Referrer istatistikleri
      if (s.referrer_domain && s.referrer_domain !== 'direct') {
        if (!referrerStats[s.referrer_domain]) {
          referrerStats[s.referrer_domain] = { count: 0, fullUrl: s.referrer || '' };
        }
        referrerStats[s.referrer_domain].count++;
      }
      
      // Landing page istatistikleri
      if (s.landing_page) {
        landingPageStats[s.landing_page] = (landingPageStats[s.landing_page] || 0) + 1;
      }
      
      // Medium istatistikleri
      if (s.utm_medium) {
        mediumStats[s.utm_medium] = (mediumStats[s.utm_medium] || 0) + 1;
      }
    });
    
    // Kampanyaları sırala
    const topCampaigns = Object.entries(campaignStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Referrer'ları sırala
    const topReferrers = Object.entries(referrerStats)
      .map(([domain, data]) => ({ domain, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Landing page'leri sırala
    const topLandingPages = Object.entries(landingPageStats)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Medium'ları sırala
    const topMediums = Object.entries(mediumStats)
      .map(([medium, count]) => ({ medium, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Cihaz dağılımı
    const deviceStats: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    const browserStats: Record<string, number> = {};
    const osStats: Record<string, number> = {};
    ((deviceStatsResult.data || []) as DeviceRow[]).forEach(s => {
      if (s.device_type) deviceStats[s.device_type] = (deviceStats[s.device_type] || 0) + 1;
      if (s.browser) browserStats[s.browser] = (browserStats[s.browser] || 0) + 1;
      if (s.os) osStats[s.os] = (osStats[s.os] || 0) + 1;
    });

    // Dönüşüm verileri
    const conversions = (conversionResult.data || []) as ConversionRow[];
    const totalConversions = conversions.length;
    const conversionRate = totalSessions > 0 ? Math.round((totalConversions / totalSessions) * 10000) / 100 : 0;
    const totalRevenue = conversions.reduce((acc, c) => acc + (c.conversion_value || 0), 0);

    // Event breakdown
    const eventBreakdown: Record<string, number> = {};
    ((eventsResult.data || []) as EventRow[]).forEach(e => {
      eventBreakdown[e.event_name] = (eventBreakdown[e.event_name] || 0) + 1;
    });

    return NextResponse.json({
      period,
      dateRange: { from: dateFromStr, to: dateToStr },
      
      // Genel istatistikler
      overview: {
        totalSessions,
        uniqueVisitors,
        totalPageViews,
        totalEvents,
        avgSessionDuration,
        totalSessionDuration,
        avgPagesPerSession,
        bounceRate,
        realtimeVisitors,
      },

      // Dönüşüm
      conversions: {
        total: totalConversions,
        rate: conversionRate,
        revenue: totalRevenue,
      },

      // Trafik kaynakları (kategoriler)
      trafficSources,
      
      // Detaylı trafik kaynakları (TikTok, Instagram, Facebook vs.)
      topSources,
      
      // Kampanya analizi
      topCampaigns,
      
      // Referrer analizi
      topReferrers,
      
      // Giriş sayfaları
      topLandingPages,
      
      // Medium analizi  
      topMediums,

      // Cihaz ve tarayıcı
      devices: deviceStats,
      browsers: Object.entries(browserStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
      operatingSystems: Object.entries(osStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),

      // En popüler içerikler
      topPages,
      topProducts,

      // Event dağılımı
      eventBreakdown: Object.entries(eventBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
