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

// In-memory store for vote tracking (IP-based throttling)
const voteThrottle = new Map<string, number>();
const VOTE_COOLDOWN = 60000; // 1 minute

// POST - Vote on review (helpful/unhelpful)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const body = await request.json();
    const { voteType } = body; // 'helpful' or 'unhelpful'

    if (!voteType || (voteType !== 'helpful' && voteType !== 'unhelpful')) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz oy türü' },
        { status: 400 }
      );
    }

    // Get IP for throttling
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    const throttleKey = `${ip}-${reviewId}`;
    const lastVoteTime = voteThrottle.get(throttleKey);
    
    if (lastVoteTime && Date.now() - lastVoteTime < VOTE_COOLDOWN) {
      return NextResponse.json(
        { success: false, error: 'Çok sık oy veriyorsunuz. Lütfen bekleyin.' },
        { status: 429 }
      );
    }

    // Get current review
    const { data: review, error: fetchError } = await supabaseAdmin
      .from('reviews')
      .select('helpful_count, unhelpful_count')
      .eq('id', reviewId)
      .single();

    if (fetchError || !review) {
      return NextResponse.json(
        { success: false, error: 'Değerlendirme bulunamadı' },
        { status: 404 }
      );
    }

    // Update vote count
    const updateData = voteType === 'helpful'
      ? { helpful_count: (review.helpful_count || 0) + 1 }
      : { unhelpful_count: (review.unhelpful_count || 0) + 1 };

    const { data, error: updateError } = await supabaseAdmin
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating vote:', updateError);
      return NextResponse.json(
        { success: false, error: 'Oy kaydedilemedi' },
        { status: 500 }
      );
    }

    // Update throttle
    voteThrottle.set(throttleKey, Date.now());

    // Clean up old entries periodically
    if (voteThrottle.size > 10000) {
      const now = Date.now();
      for (const [key, time] of voteThrottle.entries()) {
        if (now - time > VOTE_COOLDOWN * 2) {
          voteThrottle.delete(key);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        helpfulCount: data.helpful_count,
        unhelpfulCount: data.unhelpful_count,
      },
      message: 'Oyunuz kaydedildi',
    });

  } catch (error) {
    console.error('❌ Error in POST /api/reviews/[reviewId]/helpful:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
