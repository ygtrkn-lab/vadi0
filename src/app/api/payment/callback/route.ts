import { NextRequest, NextResponse } from 'next/server';
import { validate3DSStatus } from '@/lib/payment/helpers';
import { completePaymentServerSide } from '@/lib/payment/paymentCompletion';

/**
 * POST /api/payment/callback
 *
 * Handles callbacks from:
 * - Checkout Form: token-based callback
 * - 3DS: bank callback with paymentId/conversationId/mdStatus
 * 
 * IMPORTANT: We now complete payment SERVER-SIDE before redirecting to frontend.
 * This prevents payments from being lost if user closes browser.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Checkout Form callback
    const token = formData.get('token') as string | null;
    const checkoutConversationId = formData.get('conversationId') as string | null;
    if (token) {
      // CRITICAL: Complete payment SERVER-SIDE before redirecting
      // This ensures payment is captured even if user closes browser
      const completionResult = await completePaymentServerSide(token, checkoutConversationId || undefined);
      
      const completeUrl = new URL('/payment/complete', appUrl);
      completeUrl.searchParams.set('token', token);
      if (checkoutConversationId) {
        completeUrl.searchParams.set('conversationId', checkoutConversationId);
      }
      // Add server-side completion status to URL for frontend awareness
      if (completionResult.success) {
        completeUrl.searchParams.set('serverCompleted', 'true');
      }
      return NextResponse.redirect(completeUrl);
    }

    // 3DS callback
    const paymentId = formData.get('paymentId') as string | null;
    const conversationId = formData.get('conversationId') as string | null;
    const mdStatus = formData.get('mdStatus') as string | null;
    const status = formData.get('status') as string | null;

    console.log('🔷 3DS Callback received:', {
      paymentId,
      conversationId,
      mdStatus,
      status,
    });

    if (!paymentId || !conversationId || !mdStatus) {
      const failureUrl = new URL('/payment/failure', appUrl);
      failureUrl.searchParams.set('error', 'Missing callback parameters');
      return NextResponse.redirect(failureUrl);
    }

    const validation = validate3DSStatus(mdStatus);
    if (!validation.isValid) {
      const failureUrl = new URL('/payment/failure', appUrl);
      failureUrl.searchParams.set('error', validation.message);
      failureUrl.searchParams.set('conversationId', conversationId);
      return NextResponse.redirect(failureUrl);
    }

    const completeUrl = new URL('/payment/complete', appUrl);
    completeUrl.searchParams.set('paymentId', paymentId);
    completeUrl.searchParams.set('conversationId', conversationId);
    completeUrl.searchParams.set('mdStatus', mdStatus);
    return NextResponse.redirect(completeUrl);
  } catch (error: any) {
    console.error('❌ Callback processing error:', error);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const failureUrl = new URL('/payment/failure', appUrl);
    failureUrl.searchParams.set('error', 'Callback processing failed');
    return NextResponse.redirect(failureUrl);
  }
}

/**
 * GET /api/payment/callback
 * Some providers may use GET instead of POST.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  // Checkout Form callback
  const token = searchParams.get('token');
  const checkoutConversationId = searchParams.get('conversationId');
  if (token) {
    // CRITICAL: Complete payment SERVER-SIDE before redirecting
    // This ensures payment is captured even if user closes browser
    const completionResult = await completePaymentServerSide(token, checkoutConversationId || undefined);
    
    const completeUrl = new URL('/payment/complete', appUrl);
    completeUrl.searchParams.set('token', token);
    if (checkoutConversationId) {
      completeUrl.searchParams.set('conversationId', checkoutConversationId);
    }
    // Add server-side completion status to URL for frontend awareness
    if (completionResult.success) {
      completeUrl.searchParams.set('serverCompleted', 'true');
    }
    return NextResponse.redirect(completeUrl);
  }

  // 3DS callback
  const paymentId = searchParams.get('paymentId');
  const conversationId = searchParams.get('conversationId');
  const mdStatus = searchParams.get('mdStatus');
  const status = searchParams.get('status');

  console.log('🔷 3DS Callback received (GET):', {
    paymentId,
    conversationId,
    mdStatus,
    status,
  });

  if (!paymentId || !conversationId || !mdStatus) {
    const failureUrl = new URL('/payment/failure', appUrl);
    failureUrl.searchParams.set('error', 'Missing callback parameters');
    return NextResponse.redirect(failureUrl);
  }

  const validation = validate3DSStatus(mdStatus);
  if (!validation.isValid) {
    const failureUrl = new URL('/payment/failure', appUrl);
    failureUrl.searchParams.set('error', validation.message);
    failureUrl.searchParams.set('conversationId', conversationId);
    return NextResponse.redirect(failureUrl);
  }

  const completeUrl = new URL('/payment/complete', appUrl);
  completeUrl.searchParams.set('paymentId', paymentId);
  completeUrl.searchParams.set('conversationId', conversationId);
  completeUrl.searchParams.set('mdStatus', mdStatus);
  return NextResponse.redirect(completeUrl);
}
