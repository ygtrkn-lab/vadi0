import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Review, ReviewFilters, CreateReviewInput } from '@/lib/supabase/reviewTypes';

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

// Transform snake_case to camelCase
function transformReview(review: any): Review {
  return {
    id: review.id,
    productId: review.product_id,
    customerId: review.customer_id,
    orderId: review.order_id,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    pros: review.pros || [],
    cons: review.cons || [],
    photos: review.photos || [],
    isVerifiedPurchase: review.is_verified_purchase || false,
    isApproved: review.is_approved || false,
    helpfulCount: review.helpful_count || 0,
    unhelpfulCount: review.unhelpful_count || 0,
    sellerResponse: review.seller_response,
    createdAt: review.created_at,
    updatedAt: review.updated_at,
    customerName: review.customer_name,
    productName: review.product_name,
  };
}

// GET - Fetch reviews with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: ReviewFilters = {
      productId: searchParams.get('productId') ? parseInt(searchParams.get('productId')!) : undefined,
      customerId: searchParams.get('customerId') || undefined,
      rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined,
      isApproved: searchParams.get('isApproved') === 'true',
      isVerifiedPurchase: searchParams.get('isVerifiedPurchase') === 'true' || undefined,
      hasPhotos: searchParams.get('hasPhotos') === 'true' || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'newest',
      limit: parseInt(searchParams.get('limit') || '10'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    let query = supabaseAdmin
      .from('reviews')
      .select(`
        *,
        customers!reviews_customer_id_fkey(name),
        products!reviews_product_id_fkey(name)
      `);

    // Apply filters
    if (filters.productId) {
      query = query.eq('product_id', filters.productId);
    }
    if (filters.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }
    if (filters.rating) {
      query = query.eq('rating', filters.rating);
    }
    if (filters.isApproved !== undefined) {
      query = query.eq('is_approved', filters.isApproved);
    }
    if (filters.isVerifiedPurchase) {
      query = query.eq('is_verified_purchase', true);
    }
    if (filters.hasPhotos) {
      query = query.neq('photos', '{}');
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'helpful':
        query = query.order('helpful_count', { ascending: false });
        break;
      case 'rating-high':
        query = query.order('rating', { ascending: false });
        break;
      case 'rating-low':
        query = query.order('rating', { ascending: true });
        break;
    }

    // Apply pagination
    query = query.range(filters.offset!, filters.offset! + filters.limit! - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching reviews:', error);
      return NextResponse.json(
        { success: false, error: 'Değerlendirmeler yüklenirken hata oluştu' },
        { status: 500 }
      );
    }

    // Transform reviews
    const transformedReviews = data?.map((review: any) => ({
      ...transformReview(review),
      customerName: review.customers?.name,
      productName: review.products?.name,
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedReviews,
      total: count || data?.length || 0,
    });

  } catch (error) {
    console.error('❌ Error in GET /api/reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// POST - Create new review
export async function POST(request: NextRequest) {
  try {
    const input: CreateReviewInput = await request.json();

    // Validate required fields
    if (!input.productId || !input.customerId || !input.orderId || !input.rating || !input.title || !input.comment) {
      return NextResponse.json(
        { success: false, error: 'Tüm zorunlu alanları doldurun' },
        { status: 400 }
      );
    }

    // Validate rating
    if (input.rating < 1 || input.rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Puan 1 ile 5 arasında olmalıdır' },
        { status: 400 }
      );
    }

    // Check if customer already reviewed this product
    const { data: existingReview } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('product_id', input.productId)
      .eq('customer_id', input.customerId)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'Bu ürünü zaten değerlendirdiniz' },
        { status: 400 }
      );
    }

    // Verify purchase - check if order exists and contains this product
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('products')
      .eq('id', input.orderId)
      .eq('customer_id', input.customerId)
      .single();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Sipariş bulunamadı' },
        { status: 404 }
      );
    }

    // Check if product is in order
    const products = order.products as any[];
    const hasProduct = products.some((p: any) => 
      (p.productId === input.productId || p.product_id === input.productId || p.id === input.productId)
    );

    if (!hasProduct) {
      return NextResponse.json(
        { success: false, error: 'Bu ürünü satın almadınız' },
        { status: 403 }
      );
    }

    // Insert review
    const { data: newReview, error: insertError } = await supabaseAdmin
      .from('reviews')
      .insert({
        product_id: input.productId,
        customer_id: input.customerId,
        order_id: input.orderId,
        rating: input.rating,
        title: input.title,
        comment: input.comment,
        pros: input.pros || [],
        cons: input.cons || [],
        photos: input.photos || [],
        is_verified_purchase: true,
        is_approved: false, // Requires admin approval
        helpful_count: 0,
        unhelpful_count: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating review:', insertError);
      return NextResponse.json(
        { success: false, error: 'Değerlendirme oluşturulurken hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transformReview(newReview),
      message: 'Değerlendirmeniz alındı. Onaylandıktan sonra yayınlanacaktır.',
    });

  } catch (error) {
    console.error('❌ Error in POST /api/reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
