import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// GET - Fetch single review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        *,
        customers!reviews_customer_id_fkey(name),
        products!reviews_product_id_fkey(name)
      `)
      .eq('id', reviewId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Değerlendirme bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        customerName: data.customers?.name,
        productName: data.products?.name,
      },
    });

  } catch (error) {
    console.error('❌ Error in GET /api/reviews/[reviewId]:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// PATCH - Update review (approval, seller response)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const body = await request.json();

    const updateData: any = {};

    // Admin approval
    if (body.isApproved !== undefined) {
      updateData.is_approved = body.isApproved;
    }

    // Seller response
    if (body.sellerResponse) {
      updateData.seller_response = {
        message: body.sellerResponse.message,
        respondedBy: body.sellerResponse.respondedBy,
        respondedAt: new Date().toISOString(),
      };
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Güncellenecek alan belirtilmedi' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating review:', error);
      return NextResponse.json(
        { success: false, error: 'Değerlendirme güncellenirken hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Değerlendirme güncellendi',
    });

  } catch (error) {
    console.error('❌ Error in PATCH /api/reviews/[reviewId]:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// DELETE - Delete review (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;

    const { error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      console.error('❌ Error deleting review:', error);
      return NextResponse.json(
        { success: false, error: 'Değerlendirme silinirken hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Değerlendirme silindi',
    });

  } catch (error) {
    console.error('❌ Error in DELETE /api/reviews/[reviewId]:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
