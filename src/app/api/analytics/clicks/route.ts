import { NextResponse } from 'next/server';
import { analyticsDb } from '@/lib/supabase/analytics-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '/';
    const period = searchParams.get('period') || '7d';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const normalizeStart = (d: Date) => { d.setHours(0, 0, 0, 0); return d; };
    const normalizeEnd = (d: Date) => { d.setHours(23, 59, 59, 999); return d; };
    
    // Calculate date range
    let startDate: Date;
    let endDate: Date;
    const now = new Date();
    
    if (startDateParam || endDateParam) {
      startDate = normalizeStart(new Date(startDateParam || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)));
      endDate = normalizeEnd(new Date(endDateParam || now));
    } else {
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
      endDate = now;
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
      .select('id, event_name, properties, created_at, session_id')
      .eq('event_name', 'click')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
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
        click.properties?.page_path?.includes(page) ||
        click.properties?.pagePath?.includes(page)
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
      const data = click.properties || {};
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
      const pagePath = click.properties?.page_path || click.properties?.pagePath || '';
      return pagePath.includes('/sepet');
    });

    const cartClickSummary: Record<string, number> = {};
    cartClicks.forEach((click: any) => {
      const text = click.properties?.element_text || click.properties?.text || 
                   click.properties?.element_id || click.properties?.elementId || 'Bilinmeyen';
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
        element: click.properties?.element_type || click.properties?.elementType || 'unknown',
        text: click.properties?.element_text || click.properties?.text || '',
        x: click.properties?.x,
        y: click.properties?.y,
        page: click.properties?.page_path || click.properties?.pagePath || '/'
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
