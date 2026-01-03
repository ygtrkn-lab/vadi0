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
    const formattedCategory = {
      ...(category as any),
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
