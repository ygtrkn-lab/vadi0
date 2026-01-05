import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { transformProduct } from '@/lib/transformers';

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// GET single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error || !product) {
      return NextResponse.json(
        { success: false, error: 'Ürün bulunamadı' },
        { status: 404 }
      );
    }
    
    // Transform to camelCase
    const transformedProduct = transformProduct(product);
    
    return NextResponse.json({ success: true, data: transformedProduct });
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Ürün yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const body = await request.json();
    
    console.log('🔄 Updating product:', productId);
    console.log('📝 Update data:', body);
    
    // First, get the existing product
    const { data: existingProduct, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (fetchError || !existingProduct) {
      console.error('❌ Product not found:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Ürün bulunamadı' },
        { status: 404 }
      );
    }
    
    console.log('✅ Existing product found:', existingProduct.name);
    
    // Generate slug if name changed
    let slug = existingProduct.slug;
    if (body.name && body.name !== existingProduct.name) {
      slug = body.name
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    const secondaryCategory = typeof body.secondaryCategory === 'string'
      ? body.secondaryCategory
      : typeof body.secondary_category === 'string'
        ? body.secondary_category
        : undefined;

    const extraOccasionTags = Array.isArray(body.occasionTags)
      ? (body.occasionTags as string[])
      : Array.isArray(body.occasion_tags)
        ? (body.occasion_tags as string[])
        : Array.isArray(existingProduct.occasion_tags)
          ? (existingProduct.occasion_tags as string[])
          : [];

    const buildCategoryArray = (primary: string, secondary?: string, extras?: string[]) => {
      return Array.from(new Set([primary, secondary, ...(extras || []), 'dogum-gunu-hediyeleri'].filter(Boolean)));
    };

    // Prepare update data with snake_case fields
    const updateData = {
      name: body.name ?? existingProduct.name,
      slug,
      price: body.price !== undefined ? parseFloat(body.price) : existingProduct.price,
      old_price: body.oldPrice !== undefined ? parseFloat(body.oldPrice) : existingProduct.old_price,
      discount: body.discount !== undefined ? parseInt(body.discount) : existingProduct.discount,
      image: body.image ?? existingProduct.image,
      hover_image: body.hoverImage ?? existingProduct.hover_image,
      gallery: body.gallery ?? existingProduct.gallery,
      category: body.category ?? existingProduct.category,
      occasion_tags: buildCategoryArray(body.category ?? existingProduct.category, secondaryCategory, extraOccasionTags),
      description: body.description ?? existingProduct.description,
      rating: body.rating !== undefined ? parseFloat(body.rating) : existingProduct.rating,
      review_count: body.reviewCount !== undefined ? parseInt(body.reviewCount) : existingProduct.review_count,
      in_stock: body.inStock !== undefined ? body.inStock : existingProduct.in_stock,
      stock_count: body.stockCount !== undefined ? parseInt(body.stockCount) : existingProduct.stock_count,
      updated_at: new Date().toISOString(),
    };
    
    // Auto-update inStock based on stockCount
    if (updateData.stock_count === 0) {
      updateData.in_stock = false;
    }
    
    // Update in Supabase
    const { data: updatedProduct, error: updateError } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Ürün güncellenirken hata oluştu' },
        { status: 500 }
      );
    }
    
    // Transform to camelCase
    const transformedProduct = transformProduct(updatedProduct);
    
    return NextResponse.json({ 
      success: true, 
      data: transformedProduct,
      message: 'Ürün başarıyla güncellendi' 
    });
  } catch (error) {
    console.error('Product PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Ürün güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    
    // Delete from Supabase
    const { data: deletedProduct, error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', productId)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Ürün bulunamadı veya silinemedi' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: deletedProduct,
      message: 'Ürün başarıyla silindi' 
    });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Ürün silinirken hata oluştu' },
      { status: 500 }
    );
  }
}
