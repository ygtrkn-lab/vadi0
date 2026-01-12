import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb, isAnalyticsEnabled } from '@/lib/supabase/analytics-client';

/**
 * GET /api/analytics/v2/kpis
 * Ana KPI metrikleri - Trend hesaplamalı
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAnalyticsEnabled || !analyticsDb) {
      return NextResponse.json({ 
        error: 'Analytics disabled',
        kpis: getEmptyKPIs()
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    // Tarih aralıklarını hesapla
    const days = period === '1d' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
    
    const now = new Date();
    const currentPeriodEnd = new Date(now);
    currentPeriodEnd.setHours(23, 59, 59, 999);
    
    const currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - days);
    currentPeriodStart.setHours(0, 0, 0, 0);
    
    const previousPeriodEnd = new Date(currentPeriodStart);
    previousPeriodEnd.setMilliseconds(-1);
    
    const previousPeriodStart = new Date(previousPeriodEnd);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
    previousPeriodStart.setHours(0, 0, 0, 0);

    // Paralel sorgular - mevcut ve önceki dönem
    const [
      currentSessions,
      previousSessions,
      currentPageViews,
      previousPageViews,
      currentEvents,
      previousEvents,
      currentConversions,
      previousConversions,
    ] = await Promise.all([
      // Mevcut dönem oturumları
      analyticsDb
        .from('visitor_sessions')
        .select('id, visitor_id, duration_seconds, is_bounce, conversion_value, converted')
        .gte('started_at', currentPeriodStart.toISOString())
        .lte('started_at', currentPeriodEnd.toISOString()),
      
      // Önceki dönem oturumları
      analyticsDb
        .from('visitor_sessions')
        .select('id, visitor_id, duration_seconds, is_bounce, conversion_value, converted')
        .gte('started_at', previousPeriodStart.toISOString())
        .lte('started_at', previousPeriodEnd.toISOString()),
      
      // Mevcut dönem sayfa görüntüleme
      analyticsDb
        .from('page_views')
        .select('id', { count: 'exact' })
        .gte('viewed_at', currentPeriodStart.toISOString())
        .lte('viewed_at', currentPeriodEnd.toISOString()),
      
      // Önceki dönem sayfa görüntüleme
      analyticsDb
        .from('page_views')
        .select('id', { count: 'exact' })
        .gte('viewed_at', previousPeriodStart.toISOString())
        .lte('viewed_at', previousPeriodEnd.toISOString()),
      
      // Mevcut dönem eventler
      analyticsDb
        .from('visitor_events')
        .select('id', { count: 'exact' })
        .gte('created_at', currentPeriodStart.toISOString())
        .lte('created_at', currentPeriodEnd.toISOString()),
      
      // Önceki dönem eventler
      analyticsDb
        .from('visitor_events')
        .select('id', { count: 'exact' })
        .gte('created_at', previousPeriodStart.toISOString())
        .lte('created_at', previousPeriodEnd.toISOString()),
      
      // Mevcut dönem dönüşümler
      analyticsDb
        .from('visitor_sessions')
        .select('id, conversion_value')
        .eq('converted', true)
        .gte('started_at', currentPeriodStart.toISOString())
        .lte('started_at', currentPeriodEnd.toISOString()),
      
      // Önceki dönem dönüşümler
      analyticsDb
        .from('visitor_sessions')
        .select('id, conversion_value')
        .eq('converted', true)
        .gte('started_at', previousPeriodStart.toISOString())
        .lte('started_at', previousPeriodEnd.toISOString()),
    ]);

    // Mevcut dönem hesaplamaları
    type SessionRow = { id: string; visitor_id: string; duration_seconds: number; is_bounce: boolean; conversion_value: number; converted: boolean };
    
    const currentSessionsData = (currentSessions.data || []) as SessionRow[];
    const previousSessionsData = (previousSessions.data || []) as SessionRow[];

    // Aktif kullanıcılar
    const currentActiveUsers = new Set(currentSessionsData.map(s => s.visitor_id)).size;
    const previousActiveUsers = new Set(previousSessionsData.map(s => s.visitor_id)).size;

    // Oturumlar
    const currentSessionCount = currentSessionsData.length;
    const previousSessionCount = previousSessionsData.length;

    // Ortalama süre
    const currentTotalDuration = currentSessionsData.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
    const previousTotalDuration = previousSessionsData.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
    const currentAvgDuration = currentSessionCount > 0 ? currentTotalDuration / currentSessionCount : 0;
    const previousAvgDuration = previousSessionCount > 0 ? previousTotalDuration / previousSessionCount : 0;

    // Bounce rate
    const currentBounces = currentSessionsData.filter(s => s.is_bounce).length;
    const previousBounces = previousSessionsData.filter(s => s.is_bounce).length;
    const currentBounceRate = currentSessionCount > 0 ? (currentBounces / currentSessionCount) * 100 : 0;
    const previousBounceRate = previousSessionCount > 0 ? (previousBounces / previousSessionCount) * 100 : 0;

    // Eventler
    const currentEventCount = currentEvents.count || 0;
    const previousEventCount = previousEvents.count || 0;

    // Sayfa görüntüleme
    const currentPageViewCount = currentPageViews.count || 0;
    const previousPageViewCount = previousPageViews.count || 0;

    // Dönüşümler
    type ConversionRow = { id: string; conversion_value: number };
    const currentConversionsData = (currentConversions.data || []) as ConversionRow[];
    const previousConversionsData = (previousConversions.data || []) as ConversionRow[];
    const currentConversionCount = currentConversionsData.length;
    const previousConversionCount = previousConversionsData.length;
    const currentRevenue = currentConversionsData.reduce((acc, c) => acc + (c.conversion_value || 0), 0);
    const previousRevenue = previousConversionsData.reduce((acc, c) => acc + (c.conversion_value || 0), 0);

    // Trend hesaplama fonksiyonu
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const kpis = {
      activeUsers: currentActiveUsers,
      activeUsersTrend: calculateTrend(currentActiveUsers, previousActiveUsers),
      
      newUsers: currentActiveUsers, // Yeni user tracking için ayrı tablo lazım, şimdilik aynı
      newUsersTrend: calculateTrend(currentActiveUsers, previousActiveUsers),
      
      sessions: currentSessionCount,
      sessionsTrend: calculateTrend(currentSessionCount, previousSessionCount),
      
      avgEngagementTime: Math.round(currentAvgDuration),
      avgEngagementTimeTrend: calculateTrend(currentAvgDuration, previousAvgDuration),
      
      totalEvents: currentEventCount,
      totalEventsTrend: calculateTrend(currentEventCount, previousEventCount),
      
      pageViews: currentPageViewCount,
      pageViewsTrend: calculateTrend(currentPageViewCount, previousPageViewCount),
      
      bounceRate: Math.round(currentBounceRate * 10) / 10,
      bounceRateTrend: calculateTrend(currentBounceRate, previousBounceRate),
      
      conversions: currentConversionCount,
      conversionsTrend: calculateTrend(currentConversionCount, previousConversionCount),
      
      revenue: currentRevenue,
      revenueTrend: calculateTrend(currentRevenue, previousRevenue),
      
      conversionRate: currentSessionCount > 0 ? (currentConversionCount / currentSessionCount) * 100 : 0,
    };

    return NextResponse.json({
      period,
      dateRange: {
        current: { from: currentPeriodStart.toISOString(), to: currentPeriodEnd.toISOString() },
        previous: { from: previousPeriodStart.toISOString(), to: previousPeriodEnd.toISOString() },
      },
      kpis,
    });
  } catch (error) {
    console.error('KPIs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getEmptyKPIs() {
  return {
    activeUsers: 0,
    activeUsersTrend: 0,
    newUsers: 0,
    newUsersTrend: 0,
    sessions: 0,
    sessionsTrend: 0,
    avgEngagementTime: 0,
    avgEngagementTimeTrend: 0,
    totalEvents: 0,
    totalEventsTrend: 0,
    pageViews: 0,
    pageViewsTrend: 0,
    bounceRate: 0,
    bounceRateTrend: 0,
    conversions: 0,
    conversionsTrend: 0,
    revenue: 0,
    revenueTrend: 0,
    conversionRate: 0,
  };
}
