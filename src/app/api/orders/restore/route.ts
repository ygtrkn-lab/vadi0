import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase/admin';

// POST - Restore a deleted order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deletedOrderId } = body;

    if (!deletedOrderId) {
      return NextResponse.json({ error: 'Deleted order ID is required' }, { status: 400 });
    }

    // Get the deleted order
    const { data: deletedOrder, error: fetchError } = await supabaseAdmin
      .from('deleted_orders')
      .select('*')
      .eq('id', deletedOrderId)
      .single();

    if (fetchError || !deletedOrder) {
      console.error('Error fetching deleted order:', fetchError);
      return NextResponse.json({ error: 'Deleted order not found', details: fetchError?.message }, { status: 404 });
    }

    // Restore the order to orders table
    const orderData = deletedOrder.order_data;
    
    if (!orderData) {
      return NextResponse.json({ error: 'Order data is missing' }, { status: 400 });
    }

    // Insert back to orders table with proper data structure
    const { data: restoredOrder, error: insertError } = await supabaseAdmin
      .from('orders')
      .insert({
        ...(typeof orderData === 'string' ? JSON.parse(orderData) : orderData),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error restoring order:', insertError);
      return NextResponse.json({ 
        error: 'Failed to restore order', 
        details: insertError.message 
      }, { status: 500 });
    }

    // Mark the deleted_orders record as restored
    const { error: updateError } = await supabaseAdmin
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
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
