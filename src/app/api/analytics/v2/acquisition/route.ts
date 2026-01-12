import { NextRequest, NextResponse } from 'next/server';
import { analyticsDb, isAnalyticsEnabled } from '@/lib/supabase/analytics-client';

/**
 * GET /api/analytics/v2/acquisition
 * Trafik kaynağı analizi - Google Analytics benzeri
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAnalyticsEnabled || !analyticsDb) {
      return NextResponse.json({ 
        error: 'Analytics disabled',
        sources: [],
        channels: [],
        campaigns: []
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

    // Mevcut ve önceki dönem verilerini çek
    const [currentResult, previousResult] = await Promise.all([
      analyticsDb
        .from('visitor_sessions')
        .select('id, visitor_id, utm_source, utm_medium, utm_campaign, referrer_domain')
        .gte('started_at', currentPeriodStart.toISOString())
        .lte('started_at', currentPeriodEnd.toISOString()),
      
      analyticsDb
        .from('visitor_sessions')
        .select('id, visitor_id, utm_source, utm_medium, utm_campaign, referrer_domain')
        .gte('started_at', previousPeriodStart.toISOString())
        .lte('started_at', previousPeriodEnd.toISOString()),
    ]);

    type SessionRow = { 
      id: string; 
      visitor_id: string; 
      utm_source: string | null; 
      utm_medium: string | null; 
      utm_campaign: string | null;
      referrer_domain: string | null;
    };

    const currentSessions = (currentResult.data || []) as SessionRow[];
    const previousSessions = (previousResult.data || []) as SessionRow[];

    // Kaynak normalize fonksiyonu
    const normalizeSource = (source: string | null, referrerDomain: string | null): string => {
      const raw = source || referrerDomain || 'direct';
      const s = raw.toLowerCase().replace('www.', '').replace('.com', '').replace('.co', '');
      
      if (s.includes('instagram') || s === 'ig') return 'ig';
      if (s.includes('facebook') || s === 'fb') return 'fb';
      if (s.includes('google')) return 'google';
      if (s.includes('tiktok')) return 'tiktok';
      if (s.includes('twitter') || s === 'x') return 'twitter';
      if (s.includes('youtube')) return 'youtube';
      if (s === 'direct' || !source) return '(direct)';
      if (s.includes('pangleglobal')) return 'an'; // Audience Network
      
      return raw;
    };

    // Kaynak görünen ad
    const getDisplaySource = (source: string): string => {
      const map: Record<string, string> = {
        'ig': 'Instagram',
        'fb': 'Facebook',
        'google': 'Google',
        'tiktok': 'TikTok',
        'twitter': 'Twitter/X',
        'youtube': 'YouTube',
        '(direct)': 'Doğrudan',
        'an': 'Audience Network',
      };
      return map[source] || source;
    };

    // Kanal grubu belirleme
    const getChannelGroup = (medium: string | null, source: string): string => {
      if (medium === 'cpc' || medium === 'paid' || medium === 'ppc') return 'Paid Social';
      if (medium === 'organic') return 'Organic Search';
      if (medium === 'email') return 'Email';
      if (medium === 'referral') return 'Referral';
      if (medium === 'social' || ['ig', 'fb', 'tiktok', 'twitter', 'youtube'].includes(source)) return 'Organic Social';
      if (source === '(direct)') return 'Direct';
      if (source === 'an') return 'Paid Other';
      return 'Unassigned';
    };

    // Mevcut dönem kaynakları
    const currentSourceMap: Record<string, { sessions: number; users: Set<string> }> = {};
    const currentChannelMap: Record<string, { sessions: number; users: Set<string> }> = {};
    const currentCampaignMap: Record<string, { sessions: number; users: Set<string>; source: string; medium: string }> = {};

    currentSessions.forEach(s => {
      const source = normalizeSource(s.utm_source, s.referrer_domain);
      const channel = getChannelGroup(s.utm_medium, source);
      
      // Kaynak
      if (!currentSourceMap[source]) {
        currentSourceMap[source] = { sessions: 0, users: new Set() };
      }
      currentSourceMap[source].sessions++;
      currentSourceMap[source].users.add(s.visitor_id);
      
      // Kanal
      if (!currentChannelMap[channel]) {
        currentChannelMap[channel] = { sessions: 0, users: new Set() };
      }
      currentChannelMap[channel].sessions++;
      currentChannelMap[channel].users.add(s.visitor_id);
      
      // Kampanya
      if (s.utm_campaign) {
        if (!currentCampaignMap[s.utm_campaign]) {
          currentCampaignMap[s.utm_campaign] = { 
            sessions: 0, 
            users: new Set(), 
            source: s.utm_source || '', 
            medium: s.utm_medium || '' 
          };
        }
        currentCampaignMap[s.utm_campaign].sessions++;
        currentCampaignMap[s.utm_campaign].users.add(s.visitor_id);
      }
    });

    // Önceki dönem kaynakları
    const previousSourceMap: Record<string, number> = {};
    const previousChannelMap: Record<string, number> = {};

    previousSessions.forEach(s => {
      const source = normalizeSource(s.utm_source, s.referrer_domain);
      const channel = getChannelGroup(s.utm_medium, source);
      
      previousSourceMap[source] = (previousSourceMap[source] || 0) + 1;
      previousChannelMap[channel] = (previousChannelMap[channel] || 0) + 1;
    });

    // Trend hesaplama
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 1000) / 10;
    };

    // Kaynak listesi
    const sources = Object.entries(currentSourceMap)
      .map(([source, data]) => ({
        source: getDisplaySource(source),
        sourceKey: source,
        sessions: data.sessions,
        sessionsTrend: calculateTrend(data.sessions, previousSourceMap[source] || 0),
        users: data.users.size,
        newUsers: Math.round(data.users.size * 0.85), // Yaklaşık
      }))
      .sort((a, b) => b.sessions - a.sessions);

    // Kanal listesi
    const channels = Object.entries(currentChannelMap)
      .map(([channel, data]) => ({
        channel,
        sessions: data.sessions,
        sessionsTrend: calculateTrend(data.sessions, previousChannelMap[channel] || 0),
        users: data.users.size,
      }))
      .sort((a, b) => b.sessions - a.sessions);

    // Kampanya listesi
    const campaigns = Object.entries(currentCampaignMap)
      .map(([name, data]) => ({
        name,
        sessions: data.sessions,
        users: data.users.size,
        source: data.source,
        medium: data.medium,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10);

    return NextResponse.json({
      period,
      dateRange: {
        current: { from: currentPeriodStart.toISOString(), to: currentPeriodEnd.toISOString() },
        previous: { from: previousPeriodStart.toISOString(), to: previousPeriodEnd.toISOString() },
      },
      sources,
      channels,
      campaigns,
      totals: {
        sessions: currentSessions.length,
        users: new Set(currentSessions.map(s => s.visitor_id)).size,
      },
    });
  } catch (error) {
    console.error('Acquisition API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
