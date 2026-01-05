'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Package, CreditCard, Truck } from 'lucide-react';
import { BorderBeam, GlassCard, SpotlightCard } from '@/components/ui-kit/premium';
import { useCart } from '@/context/CartContext';
import GoogleCustomerReviewsOptIn from '@/components/checkout/GoogleCustomerReviewsOptIn';
import { trackMetaPurchase } from '@/lib/meta-pixel';

function extractEstimatedDeliveryDate(delivery: any): string | null {
  if (!delivery) return null;

  const raw =
    typeof delivery?.deliveryDate === 'string'
      ? delivery.deliveryDate
      : typeof delivery?.date === 'string'
        ? delivery.date
        : null;

  if (!raw) return null;

  const m = /^\d{4}-\d{2}-\d{2}/.exec(raw);
  return m ? m[0] : null;
}

function PaymentCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState('Ödemeniz doğrulanıyor...');
  const [hasSession, setHasSession] = useState(false);
  const [gcr, setGcr] = useState<null | {
    orderId: string;
    email: string;
    estimatedDeliveryDate: string;
  }>(null);
  // Track if Meta Pixel Purchase event was already fired to prevent duplicates
  const purchaseTrackedRef = useRef(false);

  const gcrMerchantId = Number(process.env.NEXT_PUBLIC_GOOGLE_CUSTOMER_REVIEWS_MERCHANT_ID || '');
  const canRenderGcr = Number.isFinite(gcrMerchantId) && gcrMerchantId > 0;

  useEffect(() => {
    // Check for active session
    const checkSession = () => {
      if (typeof window !== 'undefined') {
        const session = localStorage.getItem('vadiler-customer');
        setHasSession(!!session);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    // Progressive loading messages
    const timer1 = setTimeout(() => setProcessingMessage('Sipariş oluşturuluyor...'), 3000);
    const timer2 = setTimeout(() => setProcessingMessage('Neredeyse hazır...'), 6000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  useEffect(() => {
    const completePayment = async () => {
      // Check if payment was already processed via GET redirect
      const successParam = searchParams.get('success');
      const errorParam = searchParams.get('error');
      const orderId = searchParams.get('orderId');
      const paymentIdParam = searchParams.get('paymentId');
      const paidAmountParam = searchParams.get('paidAmount');
      const cardLast4Param = searchParams.get('cardLast4');

      // Handle GET redirect results
      if (successParam === 'true' && orderId) {
        setPaymentResult({
          success: true,
          orderId,
          paymentId: paymentIdParam || '',
          paidAmount: paidAmountParam || '',
          cardLast4: cardLast4Param || '',
          message: 'Ödeme başarıyla tamamlandı',
        });
        setLoading(false);
        
        // Clear cart and delivery info immediately after successful payment
        clearCart();
        console.log('✅ Sepet ve teslimat bilgileri temizlendi (GET redirect)');
        
        // No automatic redirect - user will use button to navigate
        return;
      }

      if (errorParam) {
        setError(decodeURIComponent(errorParam));
        setLoading(false);
        return;
      }

      // If we have token but no success param, call API GET endpoint
      const token = searchParams.get('token');
      const serverCompleted = searchParams.get('serverCompleted');
      
      if (token) {
        // If serverCompleted is true, payment was already processed server-side
        // We still call the API to get the result data, but with retry for resilience
        const maxRetries = 3;
        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            // Call API via GET to process/verify payment
            const apiUrl = new URL('/api/payment/complete', window.location.origin);
            apiUrl.searchParams.set('token', token);
            
            const response = await fetch(apiUrl.toString(), {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
              redirect: 'follow',
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
              // Extract actual error message from response body
              const errorMessage = data?.error || data?.message || `Sunucu hatası (${response.status})`;
              throw new Error(errorMessage);
            }

            if (data?.success) {
              setPaymentResult(data);
              // Clear cart and delivery info immediately after successful payment
              clearCart();
              console.log('✅ Sepet ve teslimat bilgileri temizlendi (API token)');
              lastError = null;
              break; // Success, exit retry loop
            } else {
              setError(data?.error || 'Ödeme tamamlanamadı');
              lastError = null;
              break; // Got a response, exit retry loop
            }
          } catch (err: any) {
            lastError = err;
            console.warn(`⚠️ Payment completion attempt ${attempt}/${maxRetries} failed:`, err.message);
            
            // If this was the last attempt, give up
            if (attempt === maxRetries) {
              // If server already completed the payment, show success anyway
              if (serverCompleted === 'true') {
                console.log('✅ Payment was completed server-side, showing success despite API error');
                setPaymentResult({
                  success: true,
                  message: 'Ödemeniz başarıyla alındı',
                });
                clearCart();
                lastError = null;
              } else {
                setError('Bir hata oluştu: ' + err.message);
              }
            } else {
              // Wait before retry (exponential backoff: 1s, 2s, 4s)
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
            }
          }
        }
        
        setLoading(false);
        return;
      }

      // No valid params
      setError('Ödeme bilgileri eksik');
      setLoading(false);
    };

    completePayment();
  }, [searchParams]);

  // Meta Pixel: Track Purchase event when payment is successful
  useEffect(() => {
    const orderId = paymentResult?.orderId;
    const paidAmount = paymentResult?.paidAmount;
    
    // Only track if payment was successful and we haven't tracked yet
    if (!paymentResult?.success || !orderId || purchaseTrackedRef.current) return;
    
    // Mark as tracked immediately to prevent duplicates
    purchaseTrackedRef.current = true;
    
    // Fetch order details for proper tracking with product info
    const trackPurchaseEvent = async () => {
      try {
        const orderRes = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        
        const order = await orderRes.json().catch(() => null);
        
        if (order && order.items) {
          // Track with full item details
          trackMetaPurchase({
            orderId: String(orderId),
            total: paidAmount || order.totalAmount || 0,
            items: order.items.map((item: any) => ({
              id: item.productId || item.id,
              name: item.productName || item.name || 'Ürün',
              price: item.price || 0,
              quantity: item.quantity || 1,
            })),
          });
          console.log('[Meta Pixel] Purchase event tracked for order:', orderId);
        } else {
          // Fallback: track with minimal info
          trackMetaPurchase({
            orderId: String(orderId),
            total: paidAmount || 0,
            items: [],
          });
          console.log('[Meta Pixel] Purchase event tracked (minimal) for order:', orderId);
        }
      } catch (e) {
        // Fallback on error
        trackMetaPurchase({
          orderId: String(orderId),
          total: paidAmount || 0,
          items: [],
        });
        console.warn('[Meta Pixel] Purchase tracked with fallback due to error:', e);
      }
    };
    
    trackPurchaseEvent();
  }, [paymentResult?.success, paymentResult?.orderId, paymentResult?.paidAmount]);

  useEffect(() => {
    const orderId = paymentResult?.orderId;
    if (!paymentResult?.success || !orderId) return;

    let cancelled = false;

    const loadOrderForGcr = async () => {
      try {
        const orderRes = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        const order = await orderRes.json().catch(() => null);
        if (!orderRes.ok || !order) return;

        const estimatedDeliveryDate = extractEstimatedDeliveryDate(order.delivery);
        const customerId = order.customerId as string | undefined;
        if (!estimatedDeliveryDate || !customerId) return;

        const customerRes = await fetch(`/api/customers/${encodeURIComponent(customerId)}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        const customer = await customerRes.json().catch(() => null);
        if (!customerRes.ok || !customer?.email) return;

        if (!cancelled) {
          setGcr({
            orderId,
            email: String(customer.email),
            estimatedDeliveryDate,
          });
        }
      } catch (e) {
        console.warn('[GCR] failed to load order/customer for opt-in', e);
      }
    };

    loadOrderForGcr();
    return () => {
      cancelled = true;
    };
  }, [paymentResult?.success, paymentResult?.orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-lg">
          <SpotlightCard className="p-8 text-center">
            <BorderBeam size={240} duration={10} />
            <Loader2 className="w-14 h-14 text-[#e05a4c] animate-spin mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-800 mb-2">{processingMessage}</p>
            <p className="text-sm text-gray-500">Lütfen sayfayı kapatmayın</p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-[#e05a4c] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-[#e05a4c] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-[#e05a4c] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </SpotlightCard>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-lg">
          <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <SpotlightCard className="p-8 text-center">
              <BorderBeam size={240} duration={10} color="#ef4444" />
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                <CheckCircle className="w-9 h-9 text-red-500 rotate-45" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Ödeme Başarısız</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => router.push('/sepet')}
                className="w-full py-3.5 bg-gradient-to-r from-[#e05a4c] to-[#d54a3c] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#e05a4c]/25 transition-all"
              >
                Sepete Dön
              </button>
            </SpotlightCard>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg">
        {gcr && canRenderGcr && (
          <GoogleCustomerReviewsOptIn
            merchantId={gcrMerchantId}
            orderId={gcr.orderId}
            email={gcr.email}
            deliveryCountry="TR"
            estimatedDeliveryDate={gcr.estimatedDeliveryDate}
          />
        )}
        <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <SpotlightCard className="p-8">
            <BorderBeam size={260} duration={12} />
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring' }}>
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-9 h-9 text-emerald-600" />
                </div>
              </motion.div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">Ödeme Başarılı</h1>
              <p className="text-gray-600 mb-6">Siparişiniz başarıyla oluşturuldu</p>

              <GlassCard className="p-4 mb-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Sipariş No
                    </span>
                    <span className="font-semibold text-gray-900">
                      {paymentResult?.orderId?.substring(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Ödeme ID
                    </span>
                    <span className="font-mono text-xs text-gray-800">
                      {paymentResult?.paymentId?.substring(0, 16)}...
                    </span>
                  </div>

                  {paymentResult?.cardLast4 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Kart</span>
                      <span className="font-semibold text-gray-900">**** {paymentResult.cardLast4}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="text-gray-600">Ödenen Tutar</span>
                    <span className="font-bold text-lg text-[#e05a4c]">{paymentResult?.paidAmount?.toFixed(2)} ₺</span>
                  </div>
                </div>
              </GlassCard>

              <p className="text-sm text-gray-500 mb-4">
                {hasSession 
                  ? 'Sipariş detaylarınızı hesabınızdan görüntüleyebilirsiniz.' 
                  : 'Siparişiniz başarıyla kaydedildi. E-posta adresinize sipariş detayları gönderilecektir.'}
              </p>

              {/* Sipariş Takibi Butonu - Dinamik */}
              <button
                onClick={() => {
                  const orderId = paymentResult?.orderId;
                  if (orderId) {
                    router.push(`/siparis-takip?siparis=${encodeURIComponent(orderId)}`);
                  } else {
                    router.push('/siparis-takip');
                  }
                }}
                className="w-full py-3.5 mb-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Truck className="w-5 h-5" />
                Sipariş Takibi
              </button>

              <button
                onClick={() => {
                  if (hasSession) {
                    router.push('/hesabim/siparislerim');
                  } else {
                    router.push('/');
                  }
                }}
                className="w-full py-3.5 bg-gradient-to-r from-[#e05a4c] to-[#d54a3c] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#e05a4c]/25 transition-all"
              >
                {hasSession ? 'Siparişlerimi Görüntüle' : 'Anasayfaya Dön'}
              </button>
            </div>
          </SpotlightCard>
        </motion.div>
      </div>
    </div>
  );
}

export default function PaymentCompleteViewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-lg">
            <SpotlightCard className="p-8 text-center">
              <BorderBeam size={240} duration={10} />
              <Loader2 className="w-14 h-14 text-[#e05a4c] animate-spin mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-800">Yükleniyor...</p>
              <p className="text-sm text-gray-500 mt-2">Lütfen bekleyin</p>
            </SpotlightCard>
          </div>
        </div>
      }
    >
      <PaymentCompleteContent />
    </Suspense>
  );
}
