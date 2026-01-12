import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb, getAnalyticsStatus } from '@/lib/supabase/analytics-client';
import crypto from 'crypto';

/**
 * POST /api/analytics/session
 * Yeni oturum başlat
 */
export async function POST(request: NextRequest) {
  try {
    const analyticsEnabled = await getAnalyticsStatus();
    if (!analyticsEnabled || !analyticsDb) {
      // Fail-soft: never return a hard error for client-side tracking.
      return NextResponse.json({ success: false, disabled: true }, { status: 200 });
    }

    const body = await request.json();
    const {
      sessionId,
      visitorId,
      deviceType,
      deviceModel,
      browser,
      browserVersion,
      os,
      osVersion,
      screenWidth,
      screenHeight,
      language,
      referrer,
      referrerDomain,
      landingPage,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
    } = body;

    if (!sessionId || !visitorId) {
      return NextResponse.json(
        { error: 'sessionId and visitorId are required' },
        { status: 400 }
      );
    }

    // IP adresini al
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

    // IP'yi hashle (KVKK uyumluluğu için)
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);

    // IP'yi anonim hale getir (son oktet maskeleme)
    const ipParts = ip.split('.');
    const anonymizedIp = ipParts.length === 4 
      ? `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0`
      : ip;

    // User agent
    const userAgent = request.headers.get('user-agent') || '';

    const { data, error } = await analyticsDb
      .from('visitor_sessions')
      .insert({
        id: sessionId,
        visitor_id: visitorId,
        ip_address: anonymizedIp,
        ip_hash: ipHash,
        user_agent: userAgent,
        device_type: deviceType,
        browser: browser,
        browser_version: browserVersion,
        os: os,
        os_version: osVersion,
        screen_width: screenWidth,
        screen_height: screenHeight,
        language: language,
        referrer: referrer,
        referrer_domain: referrerDomain,
        landing_page: landingPage,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_term: utmTerm,
        utm_content: utmContent,
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create session:', error);
      // Fail-soft: keep returning 2xx so Lighthouse/PageSpeed doesn't treat it as a broken resource.
      return NextResponse.json({ success: false }, { status: 200 });
    }

    return NextResponse.json({ success: true, sessionId: data?.id });
  } catch (error) {
    console.error('Session API error:', error);
    // Fail-soft
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

/**
 * PATCH /api/analytics/session
 * Oturumu güncelle
 */
export async function PATCH(request: NextRequest) {
  try {
    const analyticsEnabled = await getAnalyticsStatus();
    if (!analyticsEnabled || !analyticsDb) {
      return NextResponse.json({ success: false, disabled: true }, { status: 200 });
    }

    const body = await request.json();
    const { sessionId, customerId, converted, conversionValue, exitPage, ended } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const updateData: {
      last_activity_at: string;
      customer_id?: string;
      converted?: boolean;
      conversion_value?: number;
      exit_page?: string;
      ended_at?: string;
    } = {
      last_activity_at: new Date().toISOString(),
    };

    if (customerId) {
      updateData.customer_id = customerId;
    }

    if (converted !== undefined) {
      updateData.converted = converted;
    }

    if (conversionValue !== undefined) {
      updateData.conversion_value = conversionValue;
    }

    if (exitPage) {
      updateData.exit_page = exitPage;
    }

    if (ended) {
      updateData.ended_at = new Date().toISOString();
    }

    const { error } = await analyticsDb
      .from('visitor_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) {
      console.error('Failed to update session:', error);
      return NextResponse.json({ success: false }, { status: 200 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session PATCH error:', error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

/**
 * GET /api/analytics/session
 * Aktif oturumları getir (admin için)
 */
export async function GET(request: NextRequest) {
  try {
    const analyticsEnabled = await getAnalyticsStatus();
    if (!analyticsEnabled || !analyticsDb) {
      return NextResponse.json({ sessions: [], total: 0, limit: 50, offset: 0 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const activeOnly = searchParams.get('active') === 'true';

    let query = analyticsDb
      .from('visitor_sessions')
      .select('*', { count: 'exact' })
      .order('last_activity_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Son 30 dakikada aktif olanlar
    if (activeOnly) {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      query = query.gte('last_activity_at', thirtyMinsAgo);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to get sessions:', error);
      return NextResponse.json({ sessions: [], total: 0, limit, offset });
    }

    return NextResponse.json({
      sessions: data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Session GET error:', error);
    return NextResponse.json({ sessions: [], total: 0, limit: 50, offset: 0 });
  }
}
