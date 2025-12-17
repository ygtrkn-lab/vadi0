
'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Header, Footer, MobileNavBar } from '@/components';
import {
  HiOutlineSearch,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineHashtag,
  HiOutlineRefresh,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineExclamation,
  HiOutlineLocationMarker,
  HiOutlineShoppingBag,
} from 'react-icons/hi';

type VerificationType = 'email' | 'phone';
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'on_the_way' | 'delivered' | 'cancelled';

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

interface TrackedOrder {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  createdAt: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  district: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cardMessage?: string;
  senderName?: string;
}

function sanitizeOrderNumber(value: string) {
  return (value || '').replace(/\D/g, '').slice(0, 6);
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
  }).format(price);
}

function statusMeta(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return { label: 'Onay Bekliyor', Icon: HiOutlineClock, badge: 'bg-amber-100 text-amber-800' };
    case 'confirmed':
      return { label: 'Onaylandı', Icon: HiOutlineCheckCircle, badge: 'bg-emerald-100 text-emerald-800' };
    case 'preparing':
      return { label: 'Hazırlanıyor', Icon: HiOutlineCheckCircle, badge: 'bg-blue-100 text-blue-800' };
    case 'shipped':
    case 'on_the_way':
      return { label: 'Yolda', Icon: HiOutlineTruck, badge: 'bg-indigo-100 text-indigo-800' };
    case 'delivered':
      return { label: 'Teslim Edildi', Icon: HiOutlineCheck, badge: 'bg-emerald-100 text-emerald-800' };
    case 'cancelled':
      return { label: 'İptal Edildi', Icon: HiOutlineX, badge: 'bg-gray-100 text-gray-700' };
    default:
      return { label: 'Onay Bekliyor', Icon: HiOutlineClock, badge: 'bg-amber-100 text-amber-800' };
  }
}

const timeline: Array<{ key: OrderStatus; label: string }> = [
  { key: 'pending', label: 'Sipariş Alındı' },
  { key: 'confirmed', label: 'Onaylandı' },
  { key: 'preparing', label: 'Hazırlanıyor' },
  { key: 'shipped', label: 'Yolda' },
  { key: 'delivered', label: 'Teslim Edildi' },
];

function stepIndex(status: OrderStatus) {
  if (status === 'cancelled') return -1;
  const idx = timeline.findIndex((t) => t.key === status);
  if (idx >= 0) return idx;
  if (status === 'on_the_way') return timeline.findIndex((t) => t.key === 'shipped');
  return 0;
}

function SiparisTakipLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Yükleniyor...</p>
      </div>
    </div>
  );
}

function SiparisTakipContent() {
  const searchParams = useSearchParams();
  const autoSearchKeyRef = useRef<string>('');

  const [orderNumber, setOrderNumber] = useState('');
  const [verificationType, setVerificationType] = useState<VerificationType>('email');
  const [verificationValue, setVerificationValue] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const currentStatus: OrderStatus = useMemo(() => {
    if (!order) return 'pending';
    return order.status;
  }, [order]);

  const doTrack = useCallback(async (params: { orderNumber: string; verificationType: VerificationType; verificationValue: string }) => {
    const sanitizedOrder = sanitizeOrderNumber(params.orderNumber);
    const parsedOrderNumber = Number(sanitizedOrder);
    const trimmedVerification = (params.verificationValue || '').trim();

    setSearched(true);
    setError('');
    setIsLoading(true);

    try {
      if (!Number.isFinite(parsedOrderNumber) || sanitizedOrder.length !== 6) {
        setOrder(null);
        setError('Sipariş numarası 6 haneli olmalıdır (örn: 100001).');
        return;
      }

      if (!trimmedVerification) {
        setOrder(null);
        setError(params.verificationType === 'email' ? 'E-posta adresi gereklidir.' : 'Telefon numarası gereklidir.');
        return;
      }

      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: parsedOrderNumber,
          verificationType: params.verificationType,
          verificationValue: trimmedVerification,
        }),
      });

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.ok) {
        const payload = (data as any)?.order ?? data;
        setOrder(payload as TrackedOrder);
        setError('');
        return;
      }

      setOrder(null);

      if (response.status === 404) {
        setError('Sipariş bulunamadı. Lütfen sipariş numaranızı ve doğrulama bilgilerinizi kontrol edin.');
        return;
      }

      const message = (data as any)?.error;
      setError(message || `Sipariş sorgulanamadı (HTTP ${response.status}).`);
    } catch {
      setOrder(null);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Email deep-link params: /siparis-takip?order=100001&vtype=email&v=a@b.com
  useEffect(() => {
    const orderParam = (searchParams.get('order') || '').trim();
    const vtypeParam = (searchParams.get('vtype') || '').trim();
    const vParam = (searchParams.get('v') || '').trim();

    const o = sanitizeOrderNumber(orderParam);
    const vt: VerificationType = vtypeParam === 'phone' ? 'phone' : 'email';

    if (o) setOrderNumber(o);
    setVerificationType(vt);
    if (vParam) setVerificationValue(vParam);

    if (!o || !vParam) return;
    const key = `${o}|${vt}|${vParam}`;
    if (autoSearchKeyRef.current === key) return;
    autoSearchKeyRef.current = key;

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    doTrack({ orderNumber: o, verificationType: vt, verificationValue: vParam });
  }, [searchParams, doTrack]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedOrder = sanitizeOrderNumber(orderNumber);
    setOrderNumber(sanitizedOrder);
    await doTrack({ orderNumber: sanitizedOrder, verificationType, verificationValue });
  };

  const onRefresh = async () => {
    if (!orderNumber || !verificationValue) return;
    await doTrack({ orderNumber, verificationType, verificationValue });
  };

  const meta = statusMeta(currentStatus);
  const currentStep = stepIndex(currentStatus);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50 pt-[160px] lg:pt-[200px] pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-900 shadow-sm mb-3">
              <HiOutlineSearch className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Sipariş Takibi</h1>
            <p className="text-gray-500 text-sm mt-1">Sipariş numarası ve e-posta/telefon ile sorgulayın.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 mb-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Sipariş Numarası</label>
                <div className="relative">
                  <HiOutlineHashtag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(sanitizeOrderNumber(e.target.value))}
                    inputMode="numeric"
                    placeholder="100001"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 font-medium text-sm focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Doğrulama</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setVerificationType('email')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${verificationType === 'email' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <HiOutlineMail className="w-4 h-4 inline mr-1" />
                    E-Posta
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerificationType('phone')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${verificationType === 'phone' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <HiOutlinePhone className="w-4 h-4 inline mr-1" />
                    Telefon
                  </button>
                </div>

                <div className="relative">
                  {verificationType === 'email' ? (
                    <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  ) : (
                    <HiOutlinePhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  )}
                  <input
                    type={verificationType === 'email' ? 'email' : 'tel'}
                    value={verificationValue}
                    onChange={(e) => setVerificationValue(e.target.value)}
                    placeholder={verificationType === 'email' ? 'ornek@email.com' : '05XX XXX XX XX'}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 font-medium text-sm focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <HiOutlineRefresh className="w-5 h-5 animate-spin" />
                    Sorgulanıyor
                  </span>
                ) : (
                  'Sorgula'
                )}
              </button>
            </form>
          </div>

          {error && searched && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <HiOutlineExclamation className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {order && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <meta.Icon className="w-5 h-5 text-gray-700" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Sipariş</p>
                        <p className="text-gray-900 font-bold text-base">#{order.orderNumber}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${meta.badge}`}>{meta.label}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                      <p className="text-xs text-gray-500">Teslimat Günü</p>
                      <p className="font-semibold text-gray-900">{order.deliveryDate}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                      <p className="text-xs text-gray-500">Teslimat Saati</p>
                      <p className="font-semibold text-gray-900">{order.deliveryTimeSlot}</p>
                    </div>
                  </div>

                  {order.status !== 'cancelled' && (
                    <div className="mt-5">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Durum Akışı</p>
                      <div className="space-y-2">
                        {timeline.map((t, idx) => {
                          const done = idx <= currentStep;
                          const isCurrent = idx === currentStep;
                          return (
                            <div key={t.key} className="flex items-center gap-3">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'} ${isCurrent ? 'ring-4 ring-gray-200' : ''}`}>
                                {done ? '✓' : idx + 1}
                              </div>
                              <p className={`text-sm font-semibold ${isCurrent ? 'text-gray-900' : done ? 'text-gray-700' : 'text-gray-400'}`}>{t.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <HiOutlineLocationMarker className="w-5 h-5 text-gray-700" />
                  Teslimat Bilgileri
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Alıcı</p>
                    <p className="text-gray-900 font-medium">{order.recipientName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Telefon</p>
                    <p className="text-gray-900 font-medium">{order.recipientPhone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500 text-xs mb-1">Adres</p>
                    <p className="text-gray-900 font-medium">{order.deliveryAddress}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">İlçe</p>
                    <p className="text-gray-900 font-medium">{order.district}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <HiOutlineShoppingBag className="w-5 h-5 text-gray-700" />
                  Ürünler ({order.items.length})
                </h3>

                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <Image src={item.image} alt={item.productName} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                        <p className="text-xs text-gray-500">x{item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-900 flex-shrink-0">{formatPrice(item.price)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Ara Toplam</span><span className="font-semibold text-gray-900">{formatPrice(order.subtotal)}</span></div>
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between"><span className="text-gray-600">Teslimat Ücreti</span><span className="font-semibold text-gray-900">{formatPrice(order.deliveryFee)}</span></div>
                  )}
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-700"><span>İndirim</span><span className="font-semibold">-{formatPrice(order.discount)}</span></div>
                  )}
                  <div className="pt-2 border-t border-gray-200 flex justify-between">
                    <span className="font-bold text-gray-900">Toplam</span>
                    <span className="font-bold text-lg text-gray-900">{formatPrice(order.total)}</span>
                  </div>
                </div>

                {(order.cardMessage || order.senderName) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
                    {order.senderName && (
                      <p className="text-gray-700"><span className="font-semibold">Gönderen:</span> {order.senderName}</p>
                    )}
                    {order.cardMessage && (
                      <p className="text-gray-700 mt-1"><span className="font-semibold">Kart Mesajı:</span> {order.cardMessage}</p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-gray-800 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <HiOutlineRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Durumu Güncelle
              </button>
            </div>
          )}
        </div>
      </main>

      <MobileNavBar />
      <Footer />
    </>
  );
}

export default function SiparisTakipPage() {
  return (
    <Suspense fallback={<SiparisTakipLoading />}>
      <SiparisTakipContent />
    </Suspense>
  );
}
