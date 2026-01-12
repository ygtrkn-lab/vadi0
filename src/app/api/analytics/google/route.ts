import { NextRequest, NextResponse } from 'next/server';
import { 
  runReport, 
  runRealtimeReport, 
  isConfigured, 
  getConfigurationStatus 
} from '@/lib/google-analytics/client';

export const dynamic = 'force-dynamic';

/**
 * Google Analytics Data API Endpoint
 * 
 * Örnek kullanım:
 * GET /api/analytics/google?period=7d
 * GET /api/analytics/google?period=30d
 * GET /api/analytics/google?startDate=2024-01-01&endDate=2024-01-31
 */
export async function GET(request: NextRequest) {
  try {
    // Yapılandırma kontrolü
    if (!isConfigured()) {
      const status = getConfigurationStatus();
      return NextResponse.json({
        error: 'Google Analytics API not configured',
        missingVariables: status.missingVars,
        instructions: status.instructions,
        // Fallback: Supabase verilerini kullan
        fallbackAvailable: true,
        fallbackEndpoint: '/api/analytics/v2/kpis'
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Tarih aralığını hesapla
    let startDate: string;
    let endDate: string = 'today';

    if (startDateParam && endDateParam) {
      startDate = startDateParam;
      endDate = endDateParam;
    } else {
      const days = parseInt(period.replace('d', '')) || 7;
      startDate = `${days}daysAgo`;
    }

    // Karşılaştırma için önceki dönem
    const previousPeriodDays = parseInt(period.replace('d', '')) || 7;
    const previousStartDate = `${previousPeriodDays * 2}daysAgo`;
    const previousEndDate = `${previousPeriodDays + 1}daysAgo`;

    // Ana metrikleri çek
    const [mainReport, previousReport, realtimeReport, topPagesReport, acquisitionReport] = await Promise.all([
      // Ana dönem raporu
      runReport({
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'engagedSessions' },
          { name: 'newUsers' },
          { name: 'eventCount' },
          { name: 'conversions' },
          { name: 'totalRevenue' }
        ]
      }),

      // Önceki dönem (karşılaştırma için)
      runReport({
        dateRanges: [{ startDate: previousStartDate, endDate: previousEndDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'engagedSessions' },
          { name: 'newUsers' }
        ]
      }),

      // Gerçek zamanlı veri
      runRealtimeReport({
        metrics: [
          { name: 'activeUsers' }
        ]
      }).catch(() => null), // Realtime başarısız olursa null

      // En çok ziyaret edilen sayfalar
      runReport({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'activeUsers' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' }
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 20
      }),

      // Trafik kaynakları
      runReport({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'conversions' }
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 20
      })
    ]);

    // Ana metrikler
    const currentMetrics = mainReport.rows?.[0]?.metricValues || [];
    const previousMetrics = previousReport.rows?.[0]?.metricValues || [];

    const getValue = (arr: { value: string }[], index: number) => 
      parseFloat(arr[index]?.value || '0');

    // Trend hesapla
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // KPI'lar
    const kpis = {
      activeUsers: {
        value: getValue(currentMetrics, 0),
        trend: calculateTrend(getValue(currentMetrics, 0), getValue(previousMetrics, 0))
      },
      sessions: {
        value: getValue(currentMetrics, 1),
        trend: calculateTrend(getValue(currentMetrics, 1), getValue(previousMetrics, 1))
      },
      pageViews: {
        value: getValue(currentMetrics, 2),
        trend: calculateTrend(getValue(currentMetrics, 2), getValue(previousMetrics, 2))
      },
      avgSessionDuration: {
        value: getValue(currentMetrics, 3),
        formatted: formatDuration(getValue(currentMetrics, 3)),
        trend: calculateTrend(getValue(currentMetrics, 3), getValue(previousMetrics, 3))
      },
      bounceRate: {
        value: getValue(currentMetrics, 4) * 100,
        trend: calculateTrend(getValue(currentMetrics, 4), getValue(previousMetrics, 4))
      },
      engagedSessions: {
        value: getValue(currentMetrics, 5),
        trend: calculateTrend(getValue(currentMetrics, 5), getValue(previousMetrics, 5))
      },
      newUsers: {
        value: getValue(currentMetrics, 6),
        trend: calculateTrend(getValue(currentMetrics, 6), getValue(previousMetrics, 6))
      },
      eventCount: {
        value: getValue(currentMetrics, 7),
        trend: 0
      },
      conversions: {
        value: getValue(currentMetrics, 8),
        trend: 0
      },
      revenue: {
        value: getValue(currentMetrics, 9),
        formatted: formatCurrency(getValue(currentMetrics, 9)),
        trend: 0
      }
    };

    // Gerçek zamanlı kullanıcılar
    const realtimeUsers = realtimeReport?.rows?.[0]?.metricValues?.[0]?.value || '0';

    // En çok ziyaret edilen sayfalar
    const topPages = (topPagesReport.rows || []).map(row => ({
      path: row.dimensionValues[0].value,
      title: row.dimensionValues[1].value || row.dimensionValues[0].value,
      views: parseInt(row.metricValues[0].value),
      users: parseInt(row.metricValues[1].value),
      avgDuration: parseFloat(row.metricValues[2].value),
      bounceRate: parseFloat(row.metricValues[3].value) * 100
    }));

    // Trafik kaynakları
    const acquisitionSources = (acquisitionReport.rows || []).map(row => ({
      source: row.dimensionValues[0].value,
      medium: row.dimensionValues[1].value,
      sessions: parseInt(row.metricValues[0].value),
      users: parseInt(row.metricValues[1].value),
      bounceRate: parseFloat(row.metricValues[2].value) * 100,
      avgDuration: parseFloat(row.metricValues[3].value),
      conversions: parseInt(row.metricValues[4].value)
    }));

    return NextResponse.json({
      success: true,
      source: 'google-analytics',
      period,
      dateRange: { startDate, endDate },
      realtime: {
        activeUsers: parseInt(realtimeUsers)
      },
      kpis,
      topPages,
      acquisitionSources,
      metadata: {
        propertyId: process.env.GOOGLE_ANALYTICS_PROPERTY_ID,
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Google Analytics API error:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch Google Analytics data',
      message: error instanceof Error ? error.message : 'Unknown error',
      fallbackAvailable: true,
      fallbackEndpoint: '/api/analytics/v2/kpis'
    }, { status: 500 });
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
