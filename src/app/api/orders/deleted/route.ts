import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET - List all deleted orders
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('deleted_orders')
      .select('*')
      .eq('is_restored', false)
      .order('deleted_at', { ascending: false });

    if (error) {
      console.error('Error fetching deleted orders:', error);
      return NextResponse.json({ error: 'Failed to fetch deleted orders' }, { status: 500 });
    }

    return NextResponse.json({ orders: data || [] });
  } catch (error) {
    console.error('Error in GET /api/orders/deleted:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
