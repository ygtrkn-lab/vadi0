import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import coupons from '@/data/coupons.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting bulk coupon import...');
    
    // Get existing coupons by code (unique)
    const { data: existingCoupons, error: fetchError } = await supabase
      .from('coupons')
      .select('id, code');
    
    if (fetchError) {
      console.error('❌ Error fetching existing coupons:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }
    
    const existingIds = new Set(existingCoupons?.map(c => c.id) || []);
    const existingCodes = new Set(existingCoupons?.map(c => c.code.toUpperCase()) || []);
    console.log(`✅ Found ${existingIds.size} existing coupons (${existingCodes.size} unique codes)`);
    
    // Filter new coupons (must have unique id AND code)
    const filteredCoupons = coupons.filter((c: any) => 
      !existingIds.has(c.id) && !existingCodes.has(c.code.toUpperCase())
    );
    
    // Deduplicate by code within new coupons (keep first occurrence)
    const seenCodes = new Set<string>();
    const newCoupons = filteredCoupons.filter((c: any) => {
      const code = c.code.toUpperCase();
      if (seenCodes.has(code)) {
        console.log(`⚠️ Skipping duplicate code in source data: ${code}`);
        return false;
      }
      seenCodes.add(code);
      return true;
    });
    
    console.log(`📈 ${newCoupons.length} new coupons to insert (filtered ${filteredCoupons.length - newCoupons.length} duplicates)`);
    
    if (newCoupons.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All coupons already exist in database',
        stats: { total: coupons.length, existing: existingIds.size, inserted: 0 }
      });
    }
    
    // Transform coupons to Supabase format (camelCase → snake_case)
    const couponsToInsert = newCoupons.map((c: any) => ({
      id: c.id,
      code: c.code.toUpperCase(),
      description: c.description || '',
      type: c.type,
      value: c.value,
      min_order_amount: c.minOrderAmount || 0,
      max_discount_amount: c.maxDiscount || null,  // Fixed: maxDiscount → max_discount_amount
      usage_limit: c.usageLimit || null,
      used_count: c.usedCount || 0,
      valid_from: c.validFrom,
      valid_until: c.validUntil,
      is_active: c.isActive !== false,
      applicable_categories: c.applicableCategories || [],
      applicable_products: c.applicableProducts || [],
      created_at: c.createdAt || new Date().toISOString(),
      updated_at: c.updatedAt || new Date().toISOString()
    }));
    
    // Insert all at once (small dataset)
    console.log(`📦 Inserting ${couponsToInsert.length} coupons...`);
    
    const { data, error } = await supabase
      .from('coupons')
      .insert(couponsToInsert)
      .select();
    
    if (error) {
      console.error(`❌ Insert failed:`, error.message);
      return NextResponse.json({
        success: false,
        message: `Insert failed: ${error.message}`,
        stats: {
          total: coupons.length,
          existing: existingIds.size,
          inserted: 0,
          failed: couponsToInsert.length
        },
        errors: [{ error: error.message }]
      });
    }
    
    console.log(`✅ Successfully inserted ${data?.length || 0} coupons`);
    
    return NextResponse.json({
      success: true,
      message: `Bulk import completed: ${data?.length || 0} coupons inserted`,
      stats: {
        total: coupons.length,
        existing: existingIds.size,
        inserted: data?.length || 0,
        failed: 0
      }
    });
    
  } catch (error: any) {
    console.error('💥 Fatal error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
