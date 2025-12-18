import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting bulk order import...');

    const body = await request.json().catch(() => null);
    const orders = Array.isArray((body as any)?.orders) ? (body as any).orders : null;
    if (!orders) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing orders array in request body. Send { "orders": [...] }',
        },
        { status: 400 }
      );
    }
    
    // Optionally set the DB sequence (no local file reads)
    try {
      const { data: maxExisting } = await supabase
        .from('orders')
        .select('order_number')
        .order('order_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const maxExistingNumber = typeof (maxExisting as any)?.order_number === 'number'
        ? Number((maxExisting as any).order_number)
        : 100000;

      const maxIncomingNumber = Math.max(
        0,
        ...orders
          .map((o: any) => Number(o?.orderNumber))
          .filter((n: number) => Number.isFinite(n))
      );

      const nextOrderNumber = Math.max(maxExistingNumber + 1, maxIncomingNumber + 1, 100001);
      console.log(`🔢 Setting order_number sequence to ${nextOrderNumber}`);
      const { error: seqError } = await supabase.rpc('set_order_sequence', { seq_value: nextOrderNumber });
      if (seqError) {
        console.warn(`⚠️  Could not set sequence (may not exist yet):`, seqError.message);
      }
    } catch (seqError: any) {
      console.warn('⚠️  Sequence setup skipped:', seqError?.message || seqError);
    }
    
    // Get valid customer IDs from Supabase
    const { data: existingCustomers } = await supabase
      .from('customers')
      .select('id');
    const validCustomerIds = new Set(existingCustomers?.map(c => c.id) || []);
    console.log(`✅ Found ${validCustomerIds.size} valid customer IDs`);
    
    // Get existing orders by order_number (unique)
    const { data: existingOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number');
    
    if (fetchError) {
      console.error('❌ Error fetching existing orders:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }
    
    const existingIds = new Set(existingOrders?.map(o => o.id) || []);
    const existingOrderNumbers = new Set(existingOrders?.map(o => o.order_number) || []);
    console.log(`✅ Found ${existingIds.size} existing orders (${existingOrderNumbers.size} unique order numbers)`);
    
    // Filter new orders (must have unique id AND order_number)
    const filteredOrders = orders.filter((o: any) => 
      !existingIds.has(o.id) && !existingOrderNumbers.has(o.orderNumber)
    );
    
    // Deduplicate by order_number within new orders (keep first occurrence)
    const seenOrderNumbers = new Set<number>();
    const newOrders = filteredOrders.filter((o: any) => {
      if (seenOrderNumbers.has(o.orderNumber)) {
        console.log(`⚠️ Skipping duplicate order_number in source data: ${o.orderNumber}`);
        return false;
      }
      seenOrderNumbers.add(o.orderNumber);
      return true;
    });
    
    console.log(`📈 ${newOrders.length} new orders to insert (filtered ${filteredOrders.length - newOrders.length} duplicates)`);
    
    if (newOrders.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All orders already exist in database',
        stats: { total: orders.length, existing: existingIds.size, inserted: 0 }
      });
    }
    
    // Transform orders to Supabase format (camelCase → snake_case)
    const ordersToInsert = newOrders.map((o: any) => {
      // Only use customer_id if it exists in Supabase, otherwise NULL (guest)
      const customerId = o.customerId && validCustomerIds.has(o.customerId) ? o.customerId : null;
      const isGuest = !customerId || o.isGuest;
      
      return {
        id: o.id,
        order_number: o.orderNumber,
        customer_id: customerId,
        customer_name: o.customerName || o.delivery?.recipientName || '',
        customer_email: o.customerEmail || '',
        customer_phone: o.customerPhone || o.delivery?.recipientPhone || '',
        is_guest: isGuest,
        products: o.products,
        delivery: o.delivery,
        payment: o.payment,
        message: o.message || null,
        subtotal: o.subtotal,
        delivery_fee: o.deliveryFee || 0,
        discount: o.discount || 0,
        total: o.total,
        status: o.status,
        order_time_group: o.orderTimeGroup || null,
        timeline: o.timeline || [],
        notes: o.notes || '',
        created_at: o.createdAt,
        updated_at: o.updatedAt,
        delivered_at: o.deliveredAt || null
      };
    });
    
    // Insert in batches of 50
    const BATCH_SIZE = 50;
    let inserted = 0;
    let failed = 0;
    const errors: any[] = [];
    
    for (let i = 0; i < ordersToInsert.length; i += BATCH_SIZE) {
      const batch = ordersToInsert.slice(i, i + BATCH_SIZE);
      console.log(`📦 Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(ordersToInsert.length / BATCH_SIZE)} (${batch.length} orders)`);
      
      const { data, error } = await supabase
        .from('orders')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
        failed += batch.length;
        errors.push({ batch: Math.floor(i / BATCH_SIZE) + 1, error: error.message });
      } else {
        console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} inserted successfully`);
        inserted += batch.length;
      }
      
      // Rate limiting
      if (i + BATCH_SIZE < ordersToInsert.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    console.log(`\n📊 Results: Inserted ${inserted}, Failed ${failed}`);
    
    return NextResponse.json({
      success: true,
      message: `Bulk import completed: ${inserted} orders inserted, ${failed} failed`,
      stats: {
        total: orders.length,
        existing: existingIds.size,
        inserted,
        failed
      },
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error: any) {
    console.error('💥 Fatal error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
