import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// POST - Validate and apply coupon
export async function POST(request: NextRequest) {
  try {
    const { code, orderTotal } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'Kupon kodu gereklidir.' },
        { status: 400 }
      );
    }
    
    // Find coupon by code
    const { data: coupon, error } = await (supabase as any)
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();
    
    if (error || !coupon) {
      return NextResponse.json(
        { error: 'Geçersiz kupon kodu.' },
        { status: 404 }
      );
    }
    
    // Check if coupon is active
    if (!coupon.is_active) {
      return NextResponse.json(
        { error: 'Bu kupon artık geçerli değil.' },
        { status: 400 }
      );
    }
    
    // Check validity dates
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = new Date(coupon.valid_until);
    
    if (now < validFrom || now > validUntil) {
      return NextResponse.json(
        { error: 'Bu kupon şu anda geçerli değil.' },
        { status: 400 }
      );
    }
    
    // Check usage limit
    if (coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json(
        { error: 'Bu kupon kullanım limitine ulaşmış.' },
        { status: 400 }
      );
    }
    
    // Check minimum order amount
    if (orderTotal < coupon.min_order_amount) {
      return NextResponse.json(
        { 
          error: `Bu kuponu kullanmak için minimum ${coupon.min_order_amount} TL sipariş vermelisiniz.` 
        },
        { status: 400 }
      );
    }
    
    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.round((orderTotal * coupon.value) / 100);
      
      // Apply max discount limit if exists
      if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
        discount = coupon.max_discount_amount;
      }
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    }
    
    // Increment usage count
    await (supabase as any)
      .from('coupons')
      .update({ used_count: coupon.used_count + 1 })
      .eq('id', coupon.id);
    
    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
      discount,
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({ error: 'Kupon doğrulanamadı.' }, { status: 500 });
  }
}
