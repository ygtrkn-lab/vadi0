import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// POST - Restore a deleted order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deletedOrderId } = body;

    if (!deletedOrderId) {
      return NextResponse.json({ error: 'Deleted order ID is required' }, { status: 400 });
    }

    // Get the deleted order
    const { data: deletedOrder, error: fetchError } = await supabase
      .from('deleted_orders')
      .select('*')
      .eq('id', deletedOrderId)
      .single();

    if (fetchError || !deletedOrder) {
      console.error('Error fetching deleted order:', fetchError);
      return NextResponse.json({ error: 'Deleted order not found' }, { status: 404 });
    }

    // Restore the order to orders table
    const orderData = deletedOrder.order_data;
    
    // Insert back to orders table
    const { data: restoredOrder, error: insertError } = await supabase
      .from('orders')
      .insert({
        ...orderData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error restoring order:', insertError);
      return NextResponse.json({ error: 'Failed to restore order' }, { status: 500 });
    }

    // Mark the deleted_orders record as restored
    const { error: updateError } = await supabase
      .from('deleted_orders')
      .update({
        is_restored: true,
        restored_at: new Date().toISOString(),
      })
      .eq('id', deletedOrderId);

    if (updateError) {
      console.error('Error updating deleted order status:', updateError);
      // Don't fail the request, order is already restored
    }

    return NextResponse.json({ 
      success: true, 
      order: restoredOrder,
      message: 'Order restored successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/orders/restore:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
