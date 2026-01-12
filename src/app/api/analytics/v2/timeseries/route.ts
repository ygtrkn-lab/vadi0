import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb, isAnalyticsEnabled } from '@/lib/supabase/analytics-client';

/**
 * GET /api/analytics/v2/timeseries
 * Günlük zaman serisi verileri - Grafik için
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAnalyticsEnabled || !analyticsDb) {
      return NextResponse.json({ 
        error: 'Analytics disabled',
        data: []
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    // Tarih aralığını hesapla
    const days = period === '1d' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
    
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Oturum ve sayfa görüntüleme verilerini çek
    const [sessionsResult, pageViewsResult, eventsResult] = await Promise.all([
      analyticsDb
        .from('visitor_sessions')
        .select('id, visitor_id, started_at')
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString())
        .limit(10000),
      
      analyticsDb
        .from('page_views')
        .select('id, viewed_at')
        .gte('viewed_at', startDate.toISOString())
        .lte('viewed_at', endDate.toISOString())
        .limit(100000),
      
      analyticsDb
        .from('visitor_events')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .limit(100000),
    ]);

    type SessionRow = { id: string; visitor_id: string; started_at: string };
    type PageViewRow = { id: string; viewed_at: string };
    type EventRow = { id: string; created_at: string };

    const sessions = (sessionsResult.data || []) as SessionRow[];
    const pageViews = (pageViewsResult.data || []) as PageViewRow[];
    const events = (eventsResult.data || []) as EventRow[];

    // Debug log
    console.log('[Timeseries] Date range:', startDate.toISOString(), 'to', endDate.toISOString());
    console.log('[Timeseries] Sessions found:', sessions.length);
    console.log('[Timeseries] PageViews found:', pageViews.length);
    console.log('[Timeseries] Events found:', events.length);
    if (sessions.length > 0) {
      console.log('[Timeseries] First session:', sessions[0]);
    }
    if (sessionsResult.error) {
      console.error('[Timeseries] Sessions error:', sessionsResult.error);
    }

    // Günlük grupla
    const dailyData: Record<string, {
      sessions: Set<string>;
      visitors: Set<string>;
      pageViews: number;
      events: number;
    }> = {};

    // Tüm günleri başlat (bugün dahil)
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = {
        sessions: new Set(),
        visitors: new Set(),
        pageViews: 0,
        events: 0,
      };
    }

    // Debug: hangi günler oluşturuldu
    console.log('[Timeseries] Daily data keys:', Object.keys(dailyData));

    // Oturumları grupla
    sessions.forEach(session => {
      // Supabase'den gelen tarih string'ini doğru şekilde parse et
      const sessionDate = new Date(session.started_at);
      const dateKey = sessionDate.toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].sessions.add(session.id);
        dailyData[dateKey].visitors.add(session.visitor_id);
      } else {
        // Tarih aralığı dışında, bir önceki veya sonraki güne düşmüş olabilir
        // En yakın tarihi bul
        const keys = Object.keys(dailyData).sort();
        if (keys.length > 0) {
          const lastKey = keys[keys.length - 1];
          dailyData[lastKey].sessions.add(session.id);
          dailyData[lastKey].visitors.add(session.visitor_id);
        }
      }
    });

    // Sayfa görüntülemelerini grupla
    pageViews.forEach(pv => {
      const dateKey = new Date(pv.viewed_at).toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].pageViews++;
      }
    });

    // Eventleri grupla
    events.forEach(event => {
      const dateKey = new Date(event.created_at).toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].events++;
      }
    });

    // Sonuçları diziye dönüştür
    const timeSeries = Object.entries(dailyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        sessions: data.sessions.size,
        activeUsers: data.visitors.size,
        newUsers: data.visitors.size, // Şimdilik aynı, ayrı tracking gerekli
        pageViews: data.pageViews,
        events: data.events,
      }));

    // Önceki dönemle karşılaştırma için toplam hesapla
    const totals = timeSeries.reduce((acc, day) => ({
      sessions: acc.sessions + day.sessions,
      activeUsers: acc.activeUsers + day.activeUsers,
      pageViews: acc.pageViews + day.pageViews,
      events: acc.events + day.events,
    }), { sessions: 0, activeUsers: 0, pageViews: 0, events: 0 });

    return NextResponse.json({
      period,
      dateRange: { from: startDate.toISOString(), to: endDate.toISOString() },
      data: timeSeries,
      totals,
    });
  } catch (error) {
    console.error('Timeseries API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
