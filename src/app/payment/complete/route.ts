import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /payment/complete
 * 
 * Handles POST redirects from banks/payment providers after 3DS verification.
 * Banks may POST directly to this URL instead of going through /api/payment/callback.
 * 
 * Extracts the token from form body and redirects to the view page.
 * Uses 303 See Other to convert POST to GET.
 */
export async function POST(request: NextRequest) {
  try {
    // Try to extract token from form body
    let token: string | null = null;
    
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      token = formData.get('token') as string || null;
      
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
    }
    
    // Also check URL params (some banks put token in query string even for POST)
    if (!token) {
      token = request.nextUrl.searchParams.get('token');
    }
    
    if (!token) {
      // Redirect to view page with error
      const errorUrl = new URL('/payment/complete-view', request.nextUrl.origin);
      errorUrl.searchParams.set('error', 'Ödeme bilgileri eksik');
      return NextResponse.redirect(errorUrl, { status: 303 });
    }
    
    // Redirect to view page with token
    // The view page will call /api/payment/complete to process
    const viewUrl = new URL('/payment/complete-view', request.nextUrl.origin);
    viewUrl.searchParams.set('token', token);
    
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
 * Redirects to the view page preserving all query parameters.
 */
export async function GET(request: NextRequest) {
  // Preserve all query params and redirect to view page
  const viewUrl = new URL('/payment/complete-view', request.nextUrl.origin);
  
  // Copy all search params
  request.nextUrl.searchParams.forEach((value, key) => {
    viewUrl.searchParams.set(key, value);
  });
  
  return NextResponse.redirect(viewUrl, { status: 303 });
}
