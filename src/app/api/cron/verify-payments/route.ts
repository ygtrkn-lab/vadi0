import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { completePaymentServerSide, isTokenExpired } from '@/lib/payment/paymentCompletion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Supabase client (service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * GET /api/cron/verify-payments
 * 
 * Scheduled job that runs every 5 minutes to verify stuck payments.
 * This handles cases where:
 * - User closes browser before callback completes
 * - Network issues during payment completion
 * - Webhook delivery failures
 * 
 * Protected by CRON_SECRET to prevent unauthorized access.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error('❌ CRON_SECRET not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('⚠️ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting payment verification cron job...');

    // Find orders that:
    // 1. Have status 'pending' or 'pending_payment'
    // 2. Have a payment token
    // 3. Were created between 10 minutes and 24 hours ago
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: stuckOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, payment, created_at')
      .in('status', ['pending', 'pending_payment'])
      .lt('created_at', tenMinutesAgo)
      .gt('created_at', oneDayAgo)
      .limit(20); // Process max 20 orders per run to avoid timeout

    if (fetchError) {
      console.error('❌ Failed to fetch stuck orders:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!stuckOrders || stuckOrders.length === 0) {
      console.log('✅ No stuck orders found');
      return NextResponse.json({ 
        success: true, 
        message: 'No stuck orders found',
        processed: 0 
      });
    }

    console.log(`📋 Found ${stuckOrders.length} potentially stuck orders`);

    const results = {
      processed: 0,
      recovered: 0,
      expired: 0,
      failed: 0,
      noToken: 0,
    };

    for (const order of stuckOrders) {
      const payment = order.payment as Record<string, unknown> | null;
      const token = payment?.token as string | undefined;
      const tokenCreatedAt = payment?.tokenCreatedAt as string | undefined;

      // Skip orders without payment token
      if (!token) {
        results.noToken++;
        continue;
      }

      // Check if token has expired
      if (isTokenExpired(tokenCreatedAt)) {
        console.log(`⏰ Token expired for order ${order.id}, marking as failed`);
        
        await supabase
          .from('orders')
          .update({
            status: 'payment_failed',
            payment: {
              ...payment,
              status: 'failed',
              errorMessage: 'Ödeme süresi doldu',
              errorCode: 'TOKEN_EXPIRED',
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        results.expired++;
        results.processed++;
        continue;
      }

      // Try to complete payment
      console.log(`🔍 Verifying payment for order ${order.id}`);
      const result = await completePaymentServerSide(token, order.id);

      results.processed++;

      if (result.success) {
        console.log(`✅ Recovered payment for order ${order.id}`);
        results.recovered++;
      } else {
        console.log(`⚠️ Payment verification failed for order ${order.id}: ${result.error}`);
        results.failed++;
      }

      // Small delay between orders to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('✅ Payment verification cron completed:', results);

    return NextResponse.json({
      success: true,
      message: 'Payment verification completed',
      ...results,
    });
  } catch (error) {
    console.error('❌ Payment verification cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
