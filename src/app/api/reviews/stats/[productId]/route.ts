import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ReviewStats } from '@/lib/supabase/reviewTypes';

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

// GET - Get review statistics for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const productIdNum = parseInt(productId);

    // Fetch all approved reviews for this product
    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select('rating, is_verified_purchase, photos')
      .eq('product_id', productIdNum)
      .eq('is_approved', true);

    if (error) {
      console.error('❌ Error fetching reviews:', error);
      return NextResponse.json(
        { success: false, error: 'İstatistikler yüklenirken hata oluştu' },
        { status: 500 }
      );
    }

    const totalReviews = reviews?.length || 0;

    if (totalReviews === 0) {
      return NextResponse.json({
        success: true,
        data: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          verifiedPurchaseCount: 0,
          withPhotosCount: 0,
        } as ReviewStats,
      });
    }

    // Calculate statistics
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    let verifiedPurchaseCount = 0;
    let withPhotosCount = 0;

    reviews.forEach((review) => {
      totalRating += review.rating;
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      
      if (review.is_verified_purchase) {
        verifiedPurchaseCount++;
      }
      
      if (review.photos && review.photos.length > 0) {
        withPhotosCount++;
      }
    });

    const averageRating = parseFloat((totalRating / totalReviews).toFixed(1));

    const stats: ReviewStats = {
      averageRating,
      totalReviews,
      ratingDistribution,
      verifiedPurchaseCount,
      withPhotosCount,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('❌ Error in GET /api/reviews/stats/[productId]:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
