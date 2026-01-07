import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase/server-client';

export async function GET() {
  try {
    // Fetch only the latest order_number and updated_at to minimize cost
    const { data, error } = await supabase
      .from('orders')
      .select('order_number, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching latest order meta:', error);
      return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }

    const latest = data?.[0] || null;
    return NextResponse.json({
      lastOrderNumber: latest?.order_number ?? null,
      lastUpdatedAt: latest?.updated_at ?? null,
    });
  } catch (err) {
    console.error('Error in GET /api/orders/ping:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
