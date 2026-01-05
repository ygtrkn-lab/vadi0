import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET - Fetch all coupons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    
    let query = supabase.from('coupons').select('*');
    
    // Filter by active status if specified
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }
    
    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });
    
    const { data: coupons, error } = await query;
    
    if (error) {
      console.error('Error fetching coupons:', error);
      return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
    }
    
    return NextResponse.json(coupons || []);
  } catch (error) {
    console.error('Error in GET /api/coupons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new coupon (admin only)
export async function POST(request: NextRequest) {
  try {
    const newCoupon = await request.json();
    
    // Validate required fields
    if (!newCoupon.code || !newCoupon.type || !newCoupon.value) {
      return NextResponse.json(
        { error: 'Code, type, and value are required' },
        { status: 400 }
      );
    }
    
    // Normalize code to uppercase
    newCoupon.code = newCoupon.code.toUpperCase();
    
    // Check if code already exists
    const { data: existing } = await (supabase as any)
      .from('coupons')
      .select('id')
      .eq('code', newCoupon.code)
      .single();
    
    if (existing) {
      return NextResponse.json(
        { error: 'Bu kupon kodu zaten mevcut.' },
        { status: 400 }
      );
    }
    
    // Set default values
    const couponData = {
      ...newCoupon,
      min_order_amount: newCoupon.min_order_amount || 0,
      usage_limit: newCoupon.usage_limit || 1,
      used_count: 0,
      is_active: newCoupon.is_active !== false,
    };
    
    // Insert coupon
    const { data, error } = await (supabase as any)
      .from('coupons')
      .insert([couponData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating coupon:', error);
      return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/coupons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update coupon (admin only)
export async function PUT(request: NextRequest) {
  try {
    const updatedCoupon = await request.json();
    
    if (!updatedCoupon.id) {
      return NextResponse.json(
        { error: 'Coupon ID is required' },
        { status: 400 }
      );
    }
    
    // Normalize code if being updated
    if (updatedCoupon.code) {
      updatedCoupon.code = updatedCoupon.code.toUpperCase();
    }
    
    const { data, error } = await (supabase as any)
      .from('coupons')
      .update(updatedCoupon)
      .eq('id', updatedCoupon.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating coupon:', error);
      return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/coupons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete coupon (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Coupon ID is required' },
        { status: 400 }
      );
    }
    
    const { error } = await (supabase as any)
      .from('coupons')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting coupon:', error);
      return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/coupons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
