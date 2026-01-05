import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET single category by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id);
    
    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();
    
    if (error || !category) {
      return NextResponse.json(
        { success: false, error: 'Kategori bulunamadı' },
        { status: 404 }
      );
    }
    
    // Get product count for this category
    const { count: productCount } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category', (category as any).slug);
    
    // Convert snake_case to camelCase
    const fallbackCoverType = (category as any).cover_video ? 'video' : 'image';
    const fallbackImage = (category as any).image || '';
    const formattedCategory = {
      id: (category as any).id,
      name: (category as any).name,
      slug: (category as any).slug,
      description: (category as any).description ?? '',
      image: fallbackImage,
      coverType: (category as any).cover_type || fallbackCoverType,
      coverImage: (category as any).cover_image || fallbackImage,
      coverVideo: (category as any).cover_video || '',
      coverMobileImage: (category as any).cover_mobile_image || '',
      coverOverlay: (category as any).cover_overlay || 'dark',
      coverCtaText: (category as any).cover_cta_text || 'Keşfet',
      coverSubtitle: (category as any).cover_subtitle || '',
      productCount: productCount || 0,
      isActive: (category as any).is_active,
      createdAt: (category as any).created_at,
      updatedAt: (category as any).updated_at
    };
    
    return NextResponse.json({ 
      success: true, 
      data: formattedCategory 
    });
  } catch (error) {
    console.error('Category GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Kategori yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}
