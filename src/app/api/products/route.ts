import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import supabaseAdmin from '@/lib/supabase/admin';
import { transformProduct, transformProducts } from '@/lib/transformers';

const SECONDARY_CATEGORY_SLUG = 'dogum-gunu-hediyeleri';

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

  return slug || 'urun';
}

function normalizeSku(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function generateSkuFromSlug(slug: string): string {
  return normalizeSku(`SKU-${slug}`);
}

function buildCategoryArray(primary: string, secondary?: unknown, extras?: unknown): string[] {
  const extraSingle = typeof secondary === 'string' ? secondary : undefined;
  const extraList = Array.isArray(extras) ? (extras as string[]).filter(Boolean) : [];
  return Array.from(
    new Set([
      primary,
      ...(extraSingle ? [extraSingle] : []),
      ...extraList,
      SECONDARY_CATEGORY_SLUG,
    ].filter(Boolean))
  );
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

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

async function getNextProductId(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id')
    .order('id', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error getting next product id:', error);
    // Fallback to 1; insert will fail if it already exists and will be retried.
    return 1;
  }

  const maxId = data && data[0] && typeof (data[0] as { id?: unknown }).id === 'number'
    ? (data[0] as { id: number }).id
    : 0;
  return maxId + 1;
}

async function resolveCategoryName(category: unknown): Promise<string> {
  if (typeof category !== 'string' || category.trim().length === 0) return '';

  // Most of the time category is a slug; fall back to name match.
  const bySlug = await supabaseAdmin
    .from('categories')
    .select('name')
    .eq('slug', category)
    .limit(1);

  if (bySlug.data && bySlug.data.length > 0) {
    return bySlug.data[0]?.name ?? category;
  }

  const byName = await supabaseAdmin
    .from('categories')
    .select('name')
    .eq('name', category)
    .limit(1);

  if (byName.data && byName.data.length > 0) {
    return byName.data[0]?.name ?? category;
  }

  return category;
}

async function findUniqueSlugAndSku(baseSlug: string, baseSku: string) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const suffix = attempt === 0 ? '' : `-${attempt + 1}`;
    const candidateSlug = `${baseSlug}${suffix}`;
    const candidateSku = `${baseSku}${suffix}`;

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id')
      .or(`slug.eq.${candidateSlug},sku.eq.${candidateSku}`)
      .limit(1);

    if (error) {
      console.error('Error checking slug/SKU uniqueness:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return { slug: candidateSlug, sku: candidateSku };
    }
  }

  throw new Error('Could not generate unique slug/SKU');
}

// GET all products with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const inStock = searchParams.get('inStock');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset') || '0';
    
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });
    
    // Filter by category: include primary category and secondary (occasion_tags)
    if (category) {
      // Use PostgREST OR with contains (cs) on occasion_tags
      query = query.or(`category.eq.${category},occasion_tags.cs.{${category}}`);
    }
    
    // Filter by stock
    if (inStock === 'true') {
      query = query.eq('in_stock', true);
    }
    
    // Search in name and description
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // Pagination
    if (limit) {
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    }
    
    // Order by ID
    query = query.order('id', { ascending: true });
    
    const { data: products, error, count } = await query;
    
    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
    
    // Transform products to camelCase
    const transformedProducts = products ? transformProducts(products) : [];
    
    return NextResponse.json({ 
      products: transformedProducts, 
      total: count,
      offset: parseInt(offset),
      limit: limit ? parseInt(limit) : null
    });
  } catch (error) {
    console.error('Error in GET /api/products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new product (admin only)
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Geçersiz istek gövdesi' },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Ürün adı zorunludur' },
        { status: 400 }
      );
    }

    const baseSlug = typeof input.slug === 'string' && input.slug.trim() ? input.slug.trim() : slugify(name);
    const baseSku =
      typeof input.sku === 'string' && input.sku.trim()
        ? normalizeSku(input.sku)
        : generateSkuFromSlug(baseSlug);

    const { slug, sku } = await findUniqueSlugAndSku(baseSlug, baseSku);

    const category = typeof input.category === 'string' ? input.category : '';
    const secondaryCategory = typeof input.secondaryCategory === 'string'
      ? input.secondaryCategory
      : typeof input.secondary_category === 'string'
        ? input.secondary_category
        : undefined;
    if (!category.trim()) {
      return NextResponse.json(
        { success: false, error: 'Kategori zorunludur' },
        { status: 400 }
      );
    }

    const categoryName =
      (typeof input.categoryName === 'string' && input.categoryName) ||
      (typeof input.category_name === 'string' && input.category_name) ||
      (await resolveCategoryName(category));

    const image = typeof input.image === 'string' ? input.image : '';
    if (!image.trim()) {
      return NextResponse.json(
        { success: false, error: 'Ana görsel (image) zorunludur' },
        { status: 400 }
      );
    }

    const extraOccasionTags = Array.isArray(input.occasionTags)
      ? (input.occasionTags as string[])
      : Array.isArray(input.occasion_tags)
        ? (input.occasion_tags as string[])
        : [];

    // Whitelist fields for Supabase insert (avoid unknown columns like "badge")
    const insertData = {
      // NOTE: We set id explicitly because some environments have an out-of-sync sequence,
      // which can cause duplicate key on products_pkey when relying on auto-increment.
      id: await getNextProductId(),
      name,
      slug,
      sku,
      description: typeof input.description === 'string' ? input.description : '',
      long_description:
        typeof input.longDescription === 'string'
          ? input.longDescription
          : typeof input.long_description === 'string'
            ? input.long_description
            : '',
      price: toNumber(input.price) ?? 0,
      old_price: toNumber(input.oldPrice ?? input.old_price) ?? (toNumber(input.price) ?? 0),
      discount: toNumber(input.discount) ?? 0,
      image,
      hover_image:
        typeof input.hoverImage === 'string'
          ? input.hoverImage
          : typeof input.hover_image === 'string'
            ? input.hover_image
            : '',
      gallery: Array.isArray(input.gallery) ? (input.gallery as string[]) : [],
      rating: toNumber(input.rating) ?? 0,
      review_count: toNumber(input.reviewCount ?? input.review_count) ?? 0,
      category,
      category_name: categoryName || category || '',
      occasion_tags: buildCategoryArray(category, secondaryCategory, extraOccasionTags),
      in_stock:
        typeof input.inStock === 'boolean'
          ? input.inStock
          : typeof input.in_stock === 'boolean'
            ? input.in_stock
            : true,
      stock_count: toNumber(input.stockCount ?? input.stock_count) ?? 0,
      tags: Array.isArray(input.tags) ? (input.tags as string[]) : [],
      features: Array.isArray(input.features) ? (input.features as string[]) : [],
      delivery_info:
        typeof input.deliveryInfo === 'string'
          ? input.deliveryInfo
          : typeof input.delivery_info === 'string'
            ? input.delivery_info
            : '',
      care_tips:
        typeof input.careTips === 'string'
          ? input.careTips
          : typeof input.care_tips === 'string'
            ? input.care_tips
            : '',
      color_tags: Array.isArray(input.colorTags)
        ? (input.colorTags as string[])
        : Array.isArray(input.color_tags)
          ? (input.color_tags as string[])
          : [],
    };

    // Insert product using service role (admin)
    // Retry a few times if we hit duplicate primary key (sequence out of sync).
    let createdProduct: unknown = null;
    let insertError: unknown = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = attempt === 0 ? insertData : { ...insertData, id: (insertData.id as number) + attempt };
      const { data, error } = await supabaseAdmin
        .from('products')
        .insert([candidate])
        .select('*')
        .single();

      if (error) {
        insertError = error;
        if (isDuplicatePrimaryKey(error, 'products_pkey')) {
          continue;
        }
        break;
      }

      createdProduct = data;
      insertError = null;
      break;
    }

    if (!createdProduct || insertError) {
      console.error('Error creating product:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: 'Ürün eklenirken hata oluştu',
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

    return NextResponse.json(
      {
        success: true,
        data: transformProduct(createdProduct),
        message: 'Ürün başarıyla eklendi',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/products:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update product (admin only)
export async function PUT(request: NextRequest) {
  try {
    const updatedProduct = await request.json();
    
    if (!updatedProduct.id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('products')
      .update(updatedProduct)
      .eq('id', updatedProduct.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete product (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
