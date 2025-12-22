import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb } from '@/lib/supabase/analytics-client';

// Type definitions
interface RealtimeSession {
  id: string;
  visitor_id: string;
  device_type: string | null;
  device_model: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  landing_page: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  page_views: number;
  started_at: string;
  last_activity_at: string;
}

interface PageViewData {
  session_id: string;
  page_path: string;
  page_title: string | null;
  viewed_at: string;
}

/**
 * GET /api/analytics/realtime
 * Gerçek zamanlı ziyaretçi bilgileri
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minutes = parseInt(searchParams.get('minutes') || '5');

    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();

    // Aktif oturumlar
    const { data: sessions, error: sessionsError } = await analyticsDb
      .from('visitor_sessions')
      .select(`
        id,
        visitor_id,
        device_type,
        device_model,
        browser,
        os,
        country,
        city,
        landing_page,
        utm_source,
        utm_campaign,
        page_views,
        started_at,
        last_activity_at
      `)
      .gte('last_activity_at', cutoffTime)
      .order('last_activity_at', { ascending: false });

    if (sessionsError) {
      console.error('Failed to get realtime sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to get realtime data' }, { status: 500 });
    }

    const typedSessions = (sessions || []) as RealtimeSession[];

    // Her oturum için son sayfa görüntüleme
    const sessionIds = typedSessions.map(s => s.id);
    
    let currentPages: Record<string, PageViewData> = {};
    if (sessionIds.length > 0) {
      const { data: pageViews } = await analyticsDb
        .from('page_views')
        .select('session_id, page_path, page_title, viewed_at')
        .in('session_id', sessionIds)
        .order('viewed_at', { ascending: false });

      // Her oturum için en son sayfa
      ((pageViews || []) as PageViewData[]).forEach(pv => {
        if (!currentPages[pv.session_id]) {
          currentPages[pv.session_id] = pv;
        }
      });
    }

    // Aktif sayfalar özeti
    const activePages: Record<string, number> = {};
    Object.values(currentPages).forEach((pv) => {
      activePages[pv.page_path] = (activePages[pv.page_path] || 0) + 1;
    });

    const visitors = typedSessions.map(s => ({
      sessionId: s.id,
      visitorId: s.visitor_id,
      device: s.device_type,
      deviceModel: s.device_model,
      browser: s.browser,
      os: s.os,
      location: s.city ? `${s.city}, ${s.country}` : s.country,
      landingPage: s.landing_page,
      currentPage: currentPages[s.id]?.page_path || s.landing_page,
      pageTitle: currentPages[s.id]?.page_title,
      source: s.utm_source || 'direct',
      campaign: s.utm_campaign,
      pageViews: s.page_views,
      startedAt: s.started_at,
      lastActivity: s.last_activity_at,
      // Dakika cinsinden süre
      duration: Math.round((Date.now() - new Date(s.started_at).getTime()) / 60000),
    }));

    return NextResponse.json({
      count: visitors.length,
      visitors,
      activePages: Object.entries(activePages)
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Realtime API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
