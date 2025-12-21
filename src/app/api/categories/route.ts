import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import supabaseAdmin from '@/lib/supabase/admin';

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  if (!('code' in error)) return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

function isDuplicatePrimaryKey(error: unknown, constraintName: string): boolean {
  const code = getErrorCode(error);
  if (code !== '23505') return false;
  if (!error || typeof error !== 'object') return false;
  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' && message.includes(constraintName);
}

async function getNextCategoryId(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id')
    .order('id', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error getting next category id:', error);
    return 1;
  }

  const maxId = data && data[0] && typeof (data[0] as { id?: unknown }).id === 'number'
    ? (data[0] as { id: number }).id
    : 0;
  return maxId + 1;
}

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'kategori';
}

async function findUniqueCategorySlug(baseSlug: string) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('slug', candidate)
      .limit(1);

    if (error) {
      console.error('Error checking category slug uniqueness:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return candidate;
    }
  }

  throw new Error('Could not generate unique category slug');
}

function formatCategory(cat: any, productCount: number) {
  return {
    ...cat,
    productCount,
    isActive: cat.is_active,
    createdAt: cat.created_at,
    updatedAt: cat.updated_at,
  };
}

// GET - Fetch all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('all') === 'true';
    const onlyWithProducts = searchParams.get('hasProducts') === 'true';

    let query = supabase.from('categories').select('*').order('order', { ascending: true });
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: categories, error } = await query;
    
    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
    
    // Compute product counts dynamically from products table
    const { data: productRows, error: productsError } = await supabase
      .from('products')
      .select('category, occasion_tags, image');

    if (productsError) {
      console.error('Error fetching products for category counts:', productsError);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    const counts = new Map<string, number>();
    const images = new Map<string, string>();
    for (const row of productRows ?? []) {
      const primarySlug = (row as any)?.category;
      const secondarySlugs: string[] = Array.isArray((row as any)?.occasion_tags)
        ? ((row as any).occasion_tags as string[])
        : [];
      const productImage = (row as any)?.image;
      if (typeof primarySlug === 'string' && primarySlug) {
        counts.set(primarySlug, (counts.get(primarySlug) ?? 0) + 1);
        if (typeof productImage === 'string' && productImage && !images.has(primarySlug)) {
          images.set(primarySlug, productImage);
        }
      }
      for (const s of secondarySlugs) {
        if (typeof s === 'string' && s) {
          counts.set(s, (counts.get(s) ?? 0) + 1);
          if (typeof productImage === 'string' && productImage && !images.has(s)) {
            images.set(s, productImage);
          }
        }
      }
    }

    let formattedCategories = (categories ?? []).map((cat: any) => {
      const pc = counts.get(cat.slug) ?? 0;
      const dynamic = formatCategory(cat, pc);
      // Önce kategorinin kendi görseli, yoksa o kategoriye ait bir ürünün görseli
      const dynamicImage = cat.image || images.get(cat.slug) || '';
      return { ...dynamic, image: dynamicImage };
    });

    // Filter out categories with no products if hasProducts param is true
    if (onlyWithProducts) {
      formattedCategories = formattedCategories.filter((cat: any) => cat.productCount > 0);
    }

    // Pin special categories first visually across lists
    const PIN_SLUGS = ['haftanin-kampanyalari', 'dogum-gunu-hediyeleri'];
    formattedCategories.sort((a: any, b: any) => {
      const ai = PIN_SLUGS.indexOf(a.slug);
      const bi = PIN_SLUGS.indexOf(b.slug);
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi; // preserve defined PIN_SLUGS order
      }
      // Preserve existing order otherwise
      return (a.order ?? 0) - (b.order ?? 0);
    });
    
    return NextResponse.json({ 
      categories: formattedCategories,
      total: categories?.length || 0
    });
  } catch (error) {
    console.error('Error in GET /api/categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new category (admin only)
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    
    console.log('📝 Creating category:', body);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Geçersiz istek gövdesi' },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;
    
    // Validate required fields
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'İsim zorunludur' },
        { status: 400 }
      );
    }

    const baseSlug =
      typeof input.slug === 'string' && input.slug.trim()
        ? input.slug.trim()
        : slugify(name);

    const slug = await findUniqueCategorySlug(baseSlug);

    // Pick next order if not provided
    let orderValue = 0;
    const providedOrder = typeof input.order === 'number' ? input.order : undefined;
    if (providedOrder !== undefined && Number.isFinite(providedOrder)) {
      orderValue = providedOrder;
    } else {
      const { data: maxRow, error: maxError } = await supabaseAdmin
        .from('categories')
        .select('order')
        .order('order', { ascending: false })
        .limit(1);
      if (maxError) {
        console.error('Error getting max category order:', maxError);
      }
      const maxOrder = (maxRow && maxRow[0] && typeof (maxRow[0] as any).order === 'number')
        ? (maxRow[0] as any).order
        : 0;
      orderValue = maxOrder + 1;
    }
    
    // Convert camelCase to snake_case for database
    const insertData = {
      // NOTE: We set id explicitly because some environments have an out-of-sync sequence,
      // which can cause duplicate key on categories_pkey when relying on auto-increment.
      id: await getNextCategoryId(),
      name,
      slug,
      description: typeof input.description === 'string' ? input.description : '',
      image: typeof input.image === 'string' ? input.image : '',
      product_count: 0,
      order: orderValue,
      is_active:
        typeof input.isActive === 'boolean'
          ? input.isActive
          : typeof input.is_active === 'boolean'
            ? input.is_active
            : true,
    };
    
    // Insert category using admin client
    // Retry a few times if we hit duplicate primary key (sequence out of sync).
    let createdCategory: any = null;
    let insertError: unknown = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = attempt === 0 ? insertData : { ...insertData, id: (insertData.id as number) + attempt };
      const { data, error } = await supabaseAdmin
        .from('categories')
        .insert([candidate])
        .select()
        .single();

      if (error) {
        insertError = error;
        if (isDuplicatePrimaryKey(error, 'categories_pkey')) {
          continue;
        }
        break;
      }

      createdCategory = data;
      insertError = null;
      break;
    }
    
    if (insertError || !createdCategory) {
      console.error('❌ Error creating category:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Kategori oluşturulamadı',
          ...(process.env.NODE_ENV !== 'production' && insertError
            ? {
                details: {
                  message: (insertError as { message?: string }).message,
                  code: getErrorCode(insertError),
                },
              }
            : {}),
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Category created:', createdCategory);
    
    return NextResponse.json(
      {
        success: true,
        data: formatCategory(createdCategory, 0),
        message: 'Kategori başarıyla oluşturuldu',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/categories:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update category (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    
    console.log('🔄 Updating category:', (body as any)?.id);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Geçersiz istek gövdesi' },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;
    
    if (typeof input.id !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Kategori ID zorunludur' },
        { status: 400 }
      );
    }
    
    // Get existing category
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', input.id)
      .single();
    
    if (fetchError || !existing) {
      console.error('❌ Category not found:', fetchError);
      return NextResponse.json({ success: false, error: 'Kategori bulunamadı' }, { status: 404 });
    }
    
    // Convert camelCase to snake_case for database
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (typeof input.name === 'string') updateData.name = input.name;
    if (typeof input.description === 'string') updateData.description = input.description;
    if (typeof input.image === 'string') updateData.image = input.image;
    if (typeof input.order === 'number') updateData.order = input.order;
    if (typeof input.isActive === 'boolean') updateData.is_active = input.isActive;
    if (typeof input.productCount === 'number') updateData.product_count = input.productCount;

    // Slug: allow updates, but ensure uniqueness.
    if (typeof input.slug === 'string' && input.slug.trim()) {
      const desired = input.slug.trim();
      if (desired !== (existing as any).slug) {
        const unique = await findUniqueCategorySlug(desired);
        updateData.slug = unique;
      }
    } else if (typeof input.name === 'string' && input.name.trim() && input.name !== (existing as any).name) {
      // If name changed but slug omitted, regenerate.
      const regenerated = await findUniqueCategorySlug(slugify(input.name));
      updateData.slug = regenerated;
    }
    
    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error updating category:', error);
      return NextResponse.json({ success: false, error: 'Kategori güncellenemedi' }, { status: 500 });
    }
    
    console.log('✅ Category updated:', data);
    
    // Recompute productCount dynamically for response (primary + secondary)
    const slug = (data as any).slug as string;
    const { count: primaryCount } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category', slug);

    const { count: secondaryCount } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .contains('occasion_tags', [slug]);

    return NextResponse.json({
      success: true,
      data: formatCategory(data, productCount || 0),
      message: 'Kategori başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Error in PUT /api/categories:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete category (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('🗑️ Deleting category:', id);
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Kategori ID zorunludur' },
        { status: 400 }
      );
    }
    
    const categoryId = parseInt(id);
    
    // Check if category has products
    const { data: category } = await supabaseAdmin
      .from('categories')
      .select('slug, product_count')
      .eq('id', categoryId)
      .single();
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Kategori bulunamadı' },
        { status: 404 }
      );
    }
    
    // Count products in this category
    const { count: productCount } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category', category.slug);
    
    if (productCount && productCount > 0) {
      return NextResponse.json(
        { success: false, error: `Bu kategoride ${productCount} ürün var. Önce ürünleri başka kategoriye taşıyın.` },
        { status: 400 }
      );
    }
    
    // Delete category using admin client
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', categoryId);
    
    if (error) {
      console.error('❌ Error deleting category:', error);
      return NextResponse.json({ success: false, error: 'Kategori silinemedi' }, { status: 500 });
    }
    
    console.log('✅ Category deleted');
    
    return NextResponse.json({ 
      success: true,
      message: 'Kategori başarıyla silindi'
    });
  } catch (error) {
    console.error('Error in DELETE /api/categories:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
