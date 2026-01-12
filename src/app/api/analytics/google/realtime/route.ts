import { NextResponse } from 'next/server';
import { runRealtimeReport, isConfigured } from '@/lib/google-analytics/client';

export const dynamic = 'force-dynamic';

/**
 * Google Analytics Gerçek Zamanlı Veriler
 * 
 * Son 30 dakikadaki aktif kullanıcıları gösterir
 */
export async function GET() {
  try {
    if (!isConfigured()) {
      return NextResponse.json({
        error: 'Google Analytics API not configured'
      }, { status: 503 });
    }

    // Paralel olarak tüm realtime verileri çek
    const [
      activeUsersReport,
      pageViewsReport,
      countryReport,
      deviceReport,
      pageReport
    ] = await Promise.all([
      // Toplam aktif kullanıcılar
      runRealtimeReport({
        metrics: [{ name: 'activeUsers' }]
      }),

      // Sayfa görüntülemeleri
      runRealtimeReport({
        dimensions: [{ name: 'unifiedScreenName' }],
        metrics: [{ name: 'screenPageViews' }],
        limit: 10
      }),

      // Ülkelere göre
      runRealtimeReport({
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'activeUsers' }],
        limit: 10
      }),

      // Cihazlara göre
      runRealtimeReport({
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }]
      }),

      // Aktif sayfalar
      runRealtimeReport({
        dimensions: [{ name: 'unifiedScreenName' }],
        metrics: [{ name: 'activeUsers' }],
        limit: 10
      })
    ]);

    // Aktif kullanıcı sayısı
    const activeUsers = parseInt(
      activeUsersReport.rows?.[0]?.metricValues?.[0]?.value || '0'
    );

    // Sayfa görüntülemeleri
    const pageViews = (pageViewsReport.rows || []).map(row => ({
      page: row.dimensionValues[0].value,
      views: parseInt(row.metricValues[0].value)
    }));

    // Ülkeler
    const countries = (countryReport.rows || []).map(row => ({
      country: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value)
    }));

    // Cihazlar
    const devices = (deviceReport.rows || []).map(row => ({
      device: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value)
    }));

    // Aktif sayfalar
    const activePages = (pageReport.rows || []).map(row => ({
      page: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value)
    }));

    return NextResponse.json({
      success: true,
      source: 'google-analytics-realtime',
      timestamp: new Date().toISOString(),
      activeUsers,
      pageViews,
      countries,
      devices,
      activePages,
      // Son 30 dakika
      timeWindow: '30 minutes'
    });

  } catch (error) {
    console.error('Google Analytics Realtime error:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch realtime data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
