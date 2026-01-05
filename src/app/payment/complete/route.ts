import { NextRequest, NextResponse } from 'next/server';
import { completePaymentServerSide } from '@/lib/payment/paymentCompletion';

/**
 * POST /payment/complete
 * 
 * Handles POST redirects from banks/payment providers after 3DS verification.
 * Banks may POST directly to this URL instead of going through /api/payment/callback.
 * 
 * IMPORTANT: We now complete payment SERVER-SIDE before redirecting to frontend.
 * This prevents payments from being lost if user closes browser.
 */
export async function POST(request: NextRequest) {
  try {
    // Try to extract token from form body
    let token: string | null = null;
    let conversationId: string | null = null;
    
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      token = formData.get('token') as string || null;
      conversationId = formData.get('conversationId') as string || null;
      
      // iyzico might also send paymentId
      if (!token) {
        const paymentId = formData.get('paymentId') as string || null;
        if (paymentId) {
          token = paymentId;
        }
      }
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      token = body.token || body.paymentId || null;
      conversationId = body.conversationId || null;
    }
    
    // Also check URL params (some banks put token in query string even for POST)
    if (!token) {
      token = request.nextUrl.searchParams.get('token');
    }
    if (!conversationId) {
      conversationId = request.nextUrl.searchParams.get('conversationId');
    }
    
    if (!token) {
      // Redirect to view page with error
      const errorUrl = new URL('/payment/complete-view', request.nextUrl.origin);
      errorUrl.searchParams.set('error', 'Ödeme bilgileri eksik');
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // CRITICAL: Complete payment SERVER-SIDE before redirecting
    const completionResult = await completePaymentServerSide(token, conversationId || undefined);
    
    // Redirect to view page with token
    // The view page will call /api/payment/complete to get result data
    const viewUrl = new URL('/payment/complete-view', request.nextUrl.origin);
    viewUrl.searchParams.set('token', token);
    if (conversationId) {
      viewUrl.searchParams.set('conversationId', conversationId);
    }
    if (completionResult.success) {
      viewUrl.searchParams.set('serverCompleted', 'true');
    }
    
    return NextResponse.redirect(viewUrl, { status: 303 });
  } catch (error) {
    console.error('[payment/complete POST] Error:', error);
    
    const errorUrl = new URL('/payment/complete-view', request.nextUrl.origin);
    errorUrl.searchParams.set('error', 'Bir hata oluştu');
    return NextResponse.redirect(errorUrl, { status: 303 });
  }
}

/**
 * GET /payment/complete
 * 
 * Handles GET requests (manual refresh, direct navigation).
 * If token is present, attempts server-side completion before redirecting.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const conversationId = request.nextUrl.searchParams.get('conversationId');
  
  // If we have a token, try to complete payment server-side
  let serverCompleted = false;
  if (token) {
    const completionResult = await completePaymentServerSide(token, conversationId || undefined);
    serverCompleted = completionResult.success;
  }

  // Preserve all query params and redirect to view page
  const viewUrl = new URL('/payment/complete-view', request.nextUrl.origin);
  
  // Copy all search params
  request.nextUrl.searchParams.forEach((value, key) => {
    viewUrl.searchParams.set(key, value);
  });
  
  // Add server completion status
  if (serverCompleted) {
    viewUrl.searchParams.set('serverCompleted', 'true');
  }
  
  return NextResponse.redirect(viewUrl, { status: 303 });
}
