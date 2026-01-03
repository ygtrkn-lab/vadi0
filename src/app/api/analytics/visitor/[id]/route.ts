import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb, isAnalyticsEnabled } from '@/lib/supabase/analytics-client';

// Type definitions
interface SessionDetail {
  id: string;
  visitor_id: string;
  ip_address: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  device_type: string | null;
  device_model: string | null;
  browser: string | null;
  browser_version: string | null;
  os: string | null;
  os_version: string | null;
  screen_width: number | null;
  screen_height: number | null;
  language: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  referrer: string | null;
  referrer_domain: string | null;
  landing_page: string | null;
  exit_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  page_views: number;
  events_count: number;
  duration_seconds: number;
  is_bounce: boolean;
  customer_id: string | null;
  converted: boolean;
  conversion_value: number;
  started_at: string;
  last_activity_at: string;
  ended_at: string | null;
}

interface PageViewDetail {
  id: string;
  page_url: string;
  page_path: string;
  page_title: string | null;
  page_type: string | null;
  product_id: number | null;
  product_name: string | null;
  category_slug: string | null;
  category_name: string | null;
  referrer_path: string | null;
  load_time_ms: number | null;
  time_on_page_seconds: number;
  scroll_depth_percent: number;
  viewed_at: string;
  left_at: string | null;
}

interface EventDetail {
  id: string;
  event_name: string;
  event_category: string | null;
  event_label: string | null;
  event_value: number | null;
  properties: Record<string, any>;
  page_url: string | null;
  page_path: string | null;
  created_at: string;
}

/**
 * GET /api/analytics/visitor/[id]
 * Tek ziyaretçinin tüm oturumları ve detayları
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAnalyticsEnabled || !analyticsDb) {
      return NextResponse.json({ error: 'Analytics disabled' }, { status: 503 });
    }

    const { id: visitorId } = await params;

    if (!visitorId) {
      return NextResponse.json({ error: 'visitorId is required' }, { status: 400 });
    }

    // Bu visitor'ın tüm session'ları
    const { data: sessions, error: sessionsError } = await analyticsDb
      .from('visitor_sessions')
      .select('*')
      .eq('visitor_id', visitorId)
      .order('started_at', { ascending: false });

    if (sessionsError) {
      console.error('Failed to get visitor sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to get visitor data' }, { status: 500 });
    }

    const typedSessions = (sessions || []) as SessionDetail[];

    if (typedSessions.length === 0) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    // Tüm session ID'leri
    const sessionIds = typedSessions.map(s => s.id);

    // Bu visitor'ın tüm page view'ları
    const { data: pageViews } = await analyticsDb
      .from('page_views')
      .select('*')
      .in('session_id', sessionIds)
      .order('viewed_at', { ascending: true });

    // Bu visitor'ın tüm event'leri
    const { data: events } = await analyticsDb
      .from('visitor_events')
      .select('*')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true });

    const typedPageViews = (pageViews || []) as PageViewDetail[];
    const typedEvents = (events || []) as EventDetail[];

    // Visitor özeti
    const firstSession = typedSessions[typedSessions.length - 1];
    const lastSession = typedSessions[0];
    const totalSessions = typedSessions.length;
    const totalPageViews = typedPageViews.length;
    const totalEvents = typedEvents.length;
    const totalDuration = typedSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
    const converted = typedSessions.some(s => s.converted);
    const totalConversionValue = typedSessions.reduce((acc, s) => acc + (s.conversion_value || 0), 0);

    // Ziyaret edilen benzersiz sayfalar
    const uniquePages = [...new Set(typedPageViews.map(pv => pv.page_path))];

    // Event breakdown
    const eventBreakdown: Record<string, number> = {};
    typedEvents.forEach(e => {
      eventBreakdown[e.event_name] = (eventBreakdown[e.event_name] || 0) + 1;
    });

    // Kullanıcı yolculuğu (User Journey) - zamana göre sıralı tüm aksiyonlar
    const journey: Array<{
      type: 'page_view' | 'event';
      timestamp: string;
      data: PageViewDetail | EventDetail;
    }> = [];

    typedPageViews.forEach(pv => {
      journey.push({
        type: 'page_view',
        timestamp: pv.viewed_at,
        data: pv,
      });
    });

    typedEvents.forEach(e => {
      journey.push({
        type: 'event',
        timestamp: e.created_at,
        data: e,
      });
    });

    // Zamana göre sırala
    journey.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Cihaz bilgileri (en son session'dan)
    const deviceInfo = {
      type: lastSession.device_type,
      model: lastSession.device_model,
      browser: lastSession.browser,
      browserVersion: lastSession.browser_version,
      os: lastSession.os,
      osVersion: lastSession.os_version,
      screenWidth: lastSession.screen_width,
      screenHeight: lastSession.screen_height,
      language: lastSession.language,
    };

    // Trafik kaynakları
    const trafficSources = typedSessions.map(s => ({
      sessionId: s.id,
      source: s.utm_source || (s.referrer_domain ? 'referral' : 'direct'),
      medium: s.utm_medium,
      campaign: s.utm_campaign,
      referrer: s.referrer,
      referrerDomain: s.referrer_domain,
      landingPage: s.landing_page,
    }));

    return NextResponse.json({
      visitorId,
      
      // Özet
      summary: {
        firstVisit: firstSession.started_at,
        lastVisit: lastSession.started_at,
        totalSessions,
        totalPageViews,
        totalEvents,
        totalDuration,
        avgSessionDuration: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0,
        converted,
        totalConversionValue,
        customerId: lastSession.customer_id,
      },

      // Cihaz bilgileri
      device: deviceInfo,

      // Ziyaret edilen sayfalar
      uniquePages,
      
      // Event dağılımı
      eventBreakdown,

      // Trafik kaynakları
      trafficSources,

      // Tüm oturumlar
      sessions: typedSessions.map(s => ({
        id: s.id,
        startedAt: s.started_at,
        endedAt: s.ended_at,
        duration: s.duration_seconds,
        pageViews: s.page_views,
        eventsCount: s.events_count,
        isBounce: s.is_bounce,
        converted: s.converted,
        conversionValue: s.conversion_value,
        landingPage: s.landing_page,
        exitPage: s.exit_page,
        source: s.utm_source || (s.referrer_domain ? 'referral' : 'direct'),
      })),

      // Kullanıcı yolculuğu (zaman sıralı)
      journey,
    });
  } catch (error) {
    console.error('Visitor API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
