import { NextRequest, NextResponse } from 'next/server';
import { getIyzicoClient } from '@/lib/payment/iyzico';
import { getClientIp, validatePaymentResponse } from '@/lib/payment/helpers';
import { createClient } from '@supabase/supabase-js';
import type { IyzicoCheckoutFormInitializeRequest } from '@/lib/payment/types';

export const runtime = 'nodejs';

// Use a local service-role Supabase client here to avoid strict generated-type mismatches
// in route handlers (these routes are server-only).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);


/**
 * POST /api/payment/initialize
 * Initialize 3DS payment with iyzico
 * 
 * Request Body:
 * - orderId: string
 * - cartItems: CartItem[]
 * - customer: { id, name, email, phone, createdAt? }
 * - deliveryInfo: DeliveryInfo
 * - totalAmount: number
 * 
 * Alternatif: Sadece orderId gönderilirse, siparişteki müşteri bilgileri kullanılır (sipariş takip sayfasından ödeme için)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { orderId, cartItems, customer, deliveryInfo, totalAmount } = body;

    // orderId zorunlu
    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }

    // Load order to use server-trusted totals/products
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, products, delivery, subtotal, discount, delivery_fee, total, payment, customer_name, customer_email, customer_phone, customer_id, created_at')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Eğer customer bilgisi gönderilmemişse, mevcut siparişten al (sipariş takip sayfasından ödeme senaryosu)
    if (!customer || !customer.name || !customer.email || !customer.phone) {
      // Delivery bilgilerinden alıcı bilgilerini de kontrol et (fallback)
      const delivery = order.delivery as any;
      const recipientName = delivery?.recipientName || delivery?.recipient_name || '';
      const recipientPhone = delivery?.recipientPhone || delivery?.recipient_phone || '';
      
      customer = {
        id: order.customer_id || `guest_${orderId.slice(0, 8)}`,
        name: order.customer_name || recipientName || 'Müşteri',
        email: order.customer_email || '',
        phone: order.customer_phone || recipientPhone || '',
        createdAt: order.created_at,
      };
      
      // Hala gerekli bilgiler yoksa hata ver - email zorunlu, phone fallback olabilir
      if (!customer.email) {
        return NextResponse.json(
          { error: 'Siparişte e-posta bilgisi eksik. Lütfen bizimle iletişime geçin.' },
          { status: 400 }
        );
      }
      
      // Telefon yoksa varsayılan değer ata (iyzico için gerekli)
      if (!customer.phone) {
        customer.phone = '5000000000'; // Placeholder - iyzico için gerekli
      }
    }

    // Basic guard: do not initialize payment for already-paid orders
    const existingPaymentStatus = (order.payment as any)?.status;
    if (String(existingPaymentStatus).toLowerCase() === 'paid') {
      return NextResponse.json(
        { error: 'Order already paid' },
        { status: 409 }
      );
    }

    // Get client IP
    const ipAddress = getClientIp(request);

    // Build callback URL - MUST be HTTPS for payment security
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    // Force HTTPS for production (iyzico requires secure callback)
    if (appUrl.startsWith('http://') && !appUrl.includes('localhost')) {
      appUrl = appUrl.replace('http://', 'https://');
    }
    const callbackUrl = new URL('/api/payment/callback', appUrl).toString();

    // Build iyzico basket items directly from order.products (server-verified, latest prices)
    const basketItems = Array.isArray(order.products)
      ? (order.products as any[]).map((p) => {
          // Ensure we're using the latest price from Supabase (not client-provided)
          const unitPrice = Number(p.price) || 0;
          const quantity = Number(p.quantity) || 1;
          const totalPrice = unitPrice * quantity;

          return {
            id: `PROD_${p.id}`,
            name: (p.name || 'Ürün').substring(0, 256),
            category1: p.categoryName || p.category || 'Çiçekler',
            category2: p.tags?.[0] || undefined,
            itemType: 'PHYSICAL' as const,
            price: totalPrice.toFixed(2),
          };
        })
      : [];

    if (basketItems.length === 0) {
      return NextResponse.json(
        { error: 'Order has no products' },
        { status: 400 }
      );
    }

    // Prefer server total (order.total). Log mismatch if client sent a different value.
    const trustedTotalAmount = Number(order.total) || 0;
    if (typeof totalAmount !== 'undefined' && Number(totalAmount) !== trustedTotalAmount) {
      console.warn('⚠️ Client totalAmount mismatch; using order.total instead', {
        orderId,
        clientTotalAmount: totalAmount,
        trustedTotalAmount,
      });
    }

    // Derive buyerId (guest-safe). iyzico requires a buyer.id even for guests.
    const buyerId = customer.id || `GUEST_${orderId}`;

    // Parse buyer name safely - iyzico requires non-empty name and surname
    const fullName = (customer.name || '').trim();
    const nameParts = fullName.split(' ').filter(Boolean);
    const buyerFirstName = nameParts[0] || 'Müşteri';
    const buyerSurname = nameParts.slice(1).join(' ') || buyerFirstName; // Use first name as surname if only one word

    // Normalize phone: remove all non-digits, handle +90/90/0 prefixes, ensure 10 digits
    const normalizePhone = (phone: string): string => {
      let digits = phone.replace(/\D/g, '');
      if (digits.startsWith('90') && digits.length >= 12) {
        digits = digits.slice(2);
      }
      if (digits.startsWith('0') && digits.length >= 11) {
        digits = digits.slice(1);
      }
      if (digits.length > 10) {
        digits = digits.slice(0, 10);
      }
      return digits;
    };

    const normalizedPhone = normalizePhone(customer.phone);
    const gsmNumber = normalizedPhone.length === 10 ? `+90${normalizedPhone}` : `+90${customer.phone.replace(/\D/g, '')}`;

    // Build iyzico checkout form request (hosted payment) using trusted order data and verified basket items
    const paymentRequest = {
      locale: 'tr',
      conversationId: orderId,
      price: trustedTotalAmount.toFixed(2),
      paidPrice: trustedTotalAmount.toFixed(2),
      currency: 'TRY',
      basketId: `BASKET_${orderId}`,
      paymentGroup: 'PRODUCT',
      callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: buyerId,
        name: buyerFirstName,
        surname: buyerSurname,
        gsmNumber: gsmNumber,
        email: customer.email,
        identityNumber: '11111111111',
        registrationAddress: (order.delivery as any)?.fullAddress || 'Istanbul, Turkey',
        registrationDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        ip: ipAddress,
        city: (order.delivery as any)?.province || 'Istanbul',
        country: 'Turkey',
        zipCode: '34000',
      },
      shippingAddress: {
        contactName: (order.delivery as any)?.recipientName || customer.name,
        city: (order.delivery as any)?.province || 'Istanbul',
        country: 'Turkey',
        address: (order.delivery as any)?.fullAddress || 'Address not provided',
        zipCode: '34000',
      },
      billingAddress: {
        contactName: customer.name,
        city: (order.delivery as any)?.province || 'Istanbul',
        country: 'Turkey',
        address: (order.delivery as any)?.fullAddress || 'Address not provided',
        zipCode: '34000',
      },
      basketItems,
    } as IyzicoCheckoutFormInitializeRequest;

    const iyzicoClient = getIyzicoClient();

    console.log('🔷 Initializing payment (Checkout Form):', {
      orderId,
      conversationId: paymentRequest.conversationId,
      amount: paymentRequest.paidPrice,
      environment: iyzicoClient.getEnvironment(),
      buyer: {
        name: paymentRequest.buyer.name,
        surname: paymentRequest.buyer.surname,
        email: paymentRequest.buyer.email,
      },
      basketItemsCount: basketItems.length,
    });

    // Initialize Checkout Form with our REST client
    const result = await iyzicoClient.initializeCheckoutForm(paymentRequest);

    // Validate response
    const validation = validatePaymentResponse(result);
    if (!validation.isValid) {
      console.error('❌ Invalid payment response:', validation.error);
      console.error('📋 Full response:', JSON.stringify(result, null, 2));
      return NextResponse.json(
        { error: validation.error, result },
        { status: 400 }
      );
    }

    console.log('✅ Payment initialized successfully:', {
      token: result.token,
      conversationId: result.conversationId,
      status: result.status,
    });

    // Persist token on the order so we can resolve orderId later when iyzico callback omits conversationId.
    // Also store tokenCreatedAt for expiration tracking (tokens expire in ~30 mins).
    // This is critical for payment completion - retry up to 3 times if it fails.
    if (result.token) {
      let tokenPersisted = false;
      let lastError: any = null;
      const tokenCreatedAt = new Date().toISOString();
      
      // Get existing payment to preserve clientInfo and other fields
      const existingPayment = (order.payment && typeof order.payment === 'object') 
        ? order.payment as Record<string, unknown> 
        : {};
      
      for (let attempt = 1; attempt <= 3 && !tokenPersisted; attempt++) {
        try {
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              payment: {
                ...existingPayment, // Preserve existing fields like clientInfo
                method: 'credit_card',
                status: 'pending',
                token: result.token,
                tokenCreatedAt, // Track token creation time for expiration checks
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          if (updateError) {
            lastError = updateError;
            console.error(`⚠️ Token persistence attempt ${attempt}/3 failed:`, updateError);
            if (attempt < 3) await new Promise(r => setTimeout(r, 100 * attempt)); // exponential backoff
          } else {
            tokenPersisted = true;
            console.log('✅ Payment token persisted on order:', orderId);
          }
        } catch (e) {
          lastError = e;
          console.error(`⚠️ Token persistence attempt ${attempt}/3 exception:`, e);
          if (attempt < 3) await new Promise(r => setTimeout(r, 100 * attempt));
        }
      }

      if (!tokenPersisted) {
        console.error('❌ Critical: Failed to persist payment token after 3 attempts:', lastError);
        // Return error to prevent user from seeing payment page that will fail on completion
        return NextResponse.json(
          { error: 'Ödeme başlatılamadı. Lütfen tekrar deneyin.', details: 'Token persistence failed' },
          { status: 500 }
        );
      }
    }

    const threeDSHtmlContent = result.checkoutFormContent
      ? Buffer.from(result.checkoutFormContent, 'utf8').toString('base64')
      : result.threeDSHtmlContent;

    // Return HTML content (base64 encoded)
    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      token: result.token,
      conversationId: result.conversationId,
      threeDSHtmlContent,
      environment: iyzicoClient.getEnvironment(),
    });
  } catch (error: any) {
    console.error('❌ Payment initialization exception:', error);
    console.error('📋 Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
