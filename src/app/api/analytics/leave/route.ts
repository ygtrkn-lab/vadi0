import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb } from '@/lib/supabase/analytics-client';

/**
 * POST /api/analytics/leave
 * Beacon API ile sayfa ayrılış bilgisi (sayfa kapansa bile çalışır)
 */
export async function POST(request: NextRequest) {
  try {
    // Beacon API text/plain gönderebilir
    const text = await request.text();
    const body = JSON.parse(text);
    
    const { pageViewId, sessionId, timeOnPageSeconds, scrollDepthPercent, exitPage } = body;

    // Page view güncelle
    if (pageViewId) {
      await analyticsDb
        .from('page_views')
        .update({
          time_on_page_seconds: timeOnPageSeconds,
          scroll_depth_percent: scrollDepthPercent,
          left_at: new Date().toISOString(),
        })
        .eq('id', pageViewId);
    }

    // Session güncelle
    if (sessionId) {
      await analyticsDb
        .from('visitor_sessions')
        .update({
          exit_page: exitPage,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    }

    // Beacon API 200 OK bekler, body önemli değil
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Leave API error:', error);
    return new NextResponse(null, { status: 200 }); // Beacon için her zaman 200
  }
}
