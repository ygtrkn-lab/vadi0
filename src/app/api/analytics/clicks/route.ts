import { NextResponse } from 'next/server';
import { analyticsDb } from '@/lib/supabase/analytics-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '/';
    const period = searchParams.get('period') || '7d';
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const supabase = analyticsDb;
    
    // Check if analytics is enabled
    if (!supabase) {
      return NextResponse.json({
        totalClicks: 0,
        topElements: [],
        cartClicks: { total: 0, breakdown: [] },
        rawClicks: []
      });
    }

    // Get click events with details
    const { data: clicks, error } = await supabase
      .from('visitor_events')
      .select('id, event_type, event_data, created_at, session_id')
      .eq('event_type', 'click')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('Clicks fetch error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Filter by page if specified
    let filteredClicks = clicks || [];
    if (page !== 'all') {
      filteredClicks = filteredClicks.filter((click: any) => 
        click.event_data?.page_path?.includes(page) ||
        click.event_data?.pagePath?.includes(page)
      );
    }

    // Aggregate click data for heatmap
    const clickAggregation: Record<string, {
      element: string;
      text: string;
      count: number;
      positions: { x: number; y: number }[];
    }> = {};

    filteredClicks.forEach((click: any) => {
      const data = click.event_data || {};
      const key = data.element_id || data.elementId || data.element_text || data.text || 'unknown';
      
      if (!clickAggregation[key]) {
        clickAggregation[key] = {
          element: data.element_type || data.elementType || data.element || 'unknown',
          text: data.element_text || data.text || key,
          count: 0,
          positions: []
        };
      }
      
      clickAggregation[key].count++;
      
      if (data.x !== undefined && data.y !== undefined) {
        clickAggregation[key].positions.push({
          x: data.x,
          y: data.y
        });
      }
    });

    // Get top clicked elements
    const topElements = Object.entries(clickAggregation)
      .map(([key, value]) => ({
        id: key,
        ...value
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Get cart-specific click data
    const cartClicks = filteredClicks.filter((click: any) => {
      const pagePath = click.event_data?.page_path || click.event_data?.pagePath || '';
      return pagePath.includes('/sepet');
    });

    const cartClickSummary: Record<string, number> = {};
    cartClicks.forEach((click: any) => {
      const text = click.event_data?.element_text || click.event_data?.text || 
                   click.event_data?.element_id || click.event_data?.elementId || 'Bilinmeyen';
      cartClickSummary[text] = (cartClickSummary[text] || 0) + 1;
    });

    return NextResponse.json({
      totalClicks: filteredClicks.length,
      topElements,
      cartClicks: {
        total: cartClicks.length,
        breakdown: Object.entries(cartClickSummary)
          .map(([text, count]) => ({ text, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15)
      },
      rawClicks: filteredClicks.slice(0, 100).map((click: any) => ({
        id: click.id,
        timestamp: click.created_at,
        element: click.event_data?.element_type || click.event_data?.elementType || 'unknown',
        text: click.event_data?.element_text || click.event_data?.text || '',
        x: click.event_data?.x,
        y: click.event_data?.y,
        page: click.event_data?.page_path || click.event_data?.pagePath || '/'
      }))
    });
  } catch (error) {
    console.error('Clicks API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
