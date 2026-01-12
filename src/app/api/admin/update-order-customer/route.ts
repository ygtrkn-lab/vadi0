import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * POST /api/admin/update-order-customer
 * Update customer info on an existing order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, customerName, customerEmail, customerPhone } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      })
      .eq('id', orderId)
      .select('id, order_number, customer_name, customer_email, customer_phone')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
