import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb, getAnalyticsStatus } from '@/lib/supabase/analytics-client';

/**
 * POST /api/analytics/event
 * Kullanıcı event'i kaydet
 */
export async function POST(request: NextRequest) {
  try {
    const analyticsEnabled = await getAnalyticsStatus();
    if (!analyticsEnabled || !analyticsDb) {
      return NextResponse.json({ success: false, error: 'Analytics disabled' }, { status: 503 });
    }

    const body = await request.json();
    const {
      sessionId,
      pageViewId,
      visitorId,
      eventName,
      eventCategory,
      eventLabel,
      eventValue,
      properties,
      pageUrl,
      pagePath,
    } = body;

    if (!sessionId || !visitorId || !eventName) {
      return NextResponse.json(
        { error: 'sessionId, visitorId and eventName are required' },
        { status: 400 }
      );
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
          landing_page: pagePath || '/',
          started_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        });
    }

    // Event kaydet
    const { data, error } = await analyticsDb
      .from('visitor_events')
      .insert({
        session_id: sessionId,
        page_view_id: pageViewId,
        visitor_id: visitorId,
        event_name: eventName,
        event_category: eventCategory,
        event_label: eventLabel,
        event_value: eventValue,
        properties: properties || {},
        page_url: pageUrl,
        page_path: pagePath,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create event:', error);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    // Session'ın events_count'unu artır
    try {
      const { data: sessionData } = await analyticsDb
        .from('visitor_sessions')
        .select('events_count')
        .eq('id', sessionId)
        .single();

      await analyticsDb
        .from('visitor_sessions')
        .update({
          events_count: (sessionData?.events_count ?? 0) + 1,
          last_activity_at: new Date().toISOString(),
        } as { events_count: number; last_activity_at: string })
        .eq('id', sessionId);
    } catch {
      // Ignore errors
    }

    return NextResponse.json({ success: true, eventId: data?.id });
  } catch (error) {
    console.error('Event POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/analytics/event
 * Event'leri getir (admin için)
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAnalyticsEnabled || !analyticsDb) {
      return NextResponse.json({ events: [], total: 0, limit: 100, offset: 0 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sessionId = searchParams.get('sessionId');
    const eventName = searchParams.get('eventName');
    const eventCategory = searchParams.get('eventCategory');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = analyticsDb
      .from('visitor_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    if (eventName) {
      query = query.eq('event_name', eventName);
    }

    if (eventCategory) {
      query = query.eq('event_category', eventCategory);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to get events:', error);
      return NextResponse.json({ error: 'Failed to get events' }, { status: 500 });
    }

    return NextResponse.json({
      events: data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Event GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
