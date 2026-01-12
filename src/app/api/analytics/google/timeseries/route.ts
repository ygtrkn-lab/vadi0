import { NextRequest, NextResponse } from 'next/server';
import { runReport, isConfigured } from '@/lib/google-analytics/client';

export const dynamic = 'force-dynamic';

/**
 * Google Analytics Zaman Serisi Verileri
 * 
 * Günlük/saatlik breakdown için kullanılır
 */
export async function GET(request: NextRequest) {
  try {
    if (!isConfigured()) {
      return NextResponse.json({
        error: 'Google Analytics API not configured',
        fallbackEndpoint: '/api/analytics/v2/timeseries'
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const granularity = searchParams.get('granularity') || 'day'; // day, hour

    const days = parseInt(period.replace('d', '')) || 7;
    const startDate = `${days}daysAgo`;
    const endDate = 'today';

    // Günlük veya saatlik breakdown
    const dimensions = granularity === 'hour' 
      ? [{ name: 'dateHour' }]
      : [{ name: 'date' }];

    const report = await runReport({
      dateRanges: [{ startDate, endDate }],
      dimensions,
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'eventCount' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'newUsers' }
      ],
      orderBys: [{ dimension: { dimensionName: dimensions[0].name }, desc: false }]
    });

    const data = (report.rows || []).map(row => {
      const dateValue = row.dimensionValues[0].value;
      
      // Format date (YYYYMMDD -> YYYY-MM-DD)
      let formattedDate: string;
      if (granularity === 'hour') {
        // YYYYMMDDHH -> YYYY-MM-DD HH:00
        formattedDate = `${dateValue.slice(0, 4)}-${dateValue.slice(4, 6)}-${dateValue.slice(6, 8)} ${dateValue.slice(8, 10)}:00`;
      } else {
        formattedDate = `${dateValue.slice(0, 4)}-${dateValue.slice(4, 6)}-${dateValue.slice(6, 8)}`;
      }

      return {
        date: formattedDate,
        activeUsers: parseInt(row.metricValues[0].value),
        sessions: parseInt(row.metricValues[1].value),
        pageViews: parseInt(row.metricValues[2].value),
        events: parseInt(row.metricValues[3].value),
        avgSessionDuration: parseFloat(row.metricValues[4].value),
        bounceRate: parseFloat(row.metricValues[5].value) * 100,
        newUsers: parseInt(row.metricValues[6].value)
      };
    });

    return NextResponse.json({
      success: true,
      source: 'google-analytics',
      period,
      granularity,
      data
    });

  } catch (error) {
    console.error('Google Analytics Timeseries error:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch timeseries data',
      message: error instanceof Error ? error.message : 'Unknown error',
      fallbackEndpoint: '/api/analytics/v2/timeseries'
    }, { status: 500 });
  }
}
