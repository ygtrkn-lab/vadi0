import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import products from '@/data/products.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting bulk product import...');
    
    // Get existing product IDs and slugs
    const { data: existingProducts, error: fetchError } = await supabase
      .from('products')
      .select('id, slug');
    
    if (fetchError) {
      console.error('❌ Error fetching existing products:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }
    
    const existingIds = new Set(existingProducts?.map(p => p.id) || []);
    const existingSlugs = new Set(existingProducts?.map(p => p.slug) || []);
    console.log(`✅ Found ${existingIds.size} existing products (${existingSlugs.size} unique slugs)`);
    
    // Filter new products (must have unique id AND slug)
    const filteredProducts = products.filter(p => !existingIds.has(p.id) && !existingSlugs.has(p.slug));
    
    // Deduplicate by slug within new products (keep first occurrence)
    const seenSlugs = new Set<string>();
    const newProducts = filteredProducts.filter(p => {
      if (seenSlugs.has(p.slug)) {
        console.log(`⚠️ Skipping duplicate slug in source data: ${p.slug}`);
        return false;
      }
      seenSlugs.add(p.slug);
      return true;
    });
    
    console.log(`📈 ${newProducts.length} new products to insert (filtered ${filteredProducts.length - newProducts.length} duplicate slugs)`);
    
    if (newProducts.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All products already exist in database',
        stats: { total: products.length, existing: existingIds.size, inserted: 0 }
      });
    }
    
    // Convert products to Supabase format (only existing columns)
    const productsToInsert = newProducts.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description || '',
      long_description: p.longDescription || '',
      price: p.price,
      old_price: p.oldPrice,
      discount: p.discount || 0,
      image: p.image,
      hover_image: p.hoverImage,
      gallery: p.gallery || [],
      rating: p.rating || 5,
      review_count: p.reviewCount || 0,
      category: p.category,
      category_name: p.categoryName || '',
      in_stock: p.inStock !== false,
      stock_count: p.stockCount || 50,
      sku: p.sku || '',
      tags: p.tags || []
    }));
    
    // Insert in batches of 100
    const BATCH_SIZE = 100;
    let inserted = 0;
    let failed = 0;
    const errors: any[] = [];
    
    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
      const batch = productsToInsert.slice(i, i + BATCH_SIZE);
      console.log(`📦 Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(productsToInsert.length / BATCH_SIZE)} (${batch.length} products)`);
      
      const { data, error } = await supabase
        .from('products')
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
    }
    
    console.log(`\n📊 Results: Inserted ${inserted}, Failed ${failed}`);
    
    return NextResponse.json({
      success: true,
      message: `Bulk import completed: ${inserted} products inserted, ${failed} failed`,
      stats: {
        total: products.length,
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
