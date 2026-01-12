
'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header, Footer, MobileNavBar } from '@/components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Mail, 
  Phone, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Check, 
  X, 
  AlertCircle, 
  MapPin, 
  CreditCard,
  Package,
  ChevronRight,
  Copy,
  Building2,
  Loader2,
  User,
  ArrowRight,
  Heart,
  Flower2,
  Shield,
  Headphones
} from 'lucide-react';

type VerificationType = 'email' | 'phone';
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'on_the_way' | 'delivered' | 'cancelled' | 'refunded' | 'failed' | 'payment_failed' | 'pending_payment';

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
  refund?: {
    status: string;
    amount: number;
    reason: string;
    notes?: string;
    processedAt: string;
    processedBy?: string;
  };
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
    case 'pending_payment':
      return { label: 'Ödeme Bekleniyor', sublabel: 'Ödemenizi bekliyoruz', Icon: Clock, color: 'warning' };
    case 'confirmed':
      return { label: 'Sipariş Onaylandı', sublabel: 'Hazırlık başlıyor', Icon: CheckCircle2, color: 'success' };
    case 'preparing':
      return { label: 'Hazırlanıyor', sublabel: 'Çiçekleriniz hazırlanıyor', Icon: Flower2, color: 'info' };
    case 'shipped':
    case 'on_the_way':
      return { label: 'Yolda', sublabel: 'Kuryemiz yolda', Icon: Truck, color: 'info' };
    case 'delivered':
      return { label: 'Teslim Edildi', sublabel: 'Sevdiklerinize ulaştı', Icon: Check, color: 'success' };
    case 'cancelled':
      return { label: 'İptal Edildi', sublabel: 'Sipariş iptal edildi', Icon: X, color: 'neutral' };
    case 'refunded':
      return { label: 'İade Edildi', sublabel: 'Ödemeniz iade edildi', Icon: CreditCard, color: 'info' };
    case 'failed':
    case 'payment_failed':
      return { label: 'Ödeme Başarısız', sublabel: 'Lütfen tekrar deneyin', Icon: AlertCircle, color: 'error' };
    default:
      return { label: 'Beklemede', sublabel: 'İşleniyor', Icon: Clock, color: 'warning' };
  }
}

const steps = [
  { key: 'pending', label: 'Alındı', icon: Package },
  { key: 'confirmed', label: 'Onaylandı', icon: CheckCircle2 },
  { key: 'preparing', label: 'Hazırlanıyor', icon: Flower2 },
  { key: 'shipped', label: 'Yolda', icon: Truck },
  { key: 'delivered', label: 'Teslim', icon: Check },
];

function stepIndex(status: OrderStatus) {
  if (status === 'cancelled' || status === 'refunded' || status === 'failed' || status === 'payment_failed') return -1;
  const idx = steps.findIndex((t) => t.key === status);
  if (idx >= 0) return idx;
  if (status === 'on_the_way') return steps.findIndex((t) => t.key === 'shipped');
  return 0;
}

// Apple-style loading
function SiparisTakipLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 mx-auto mb-6 relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-[3px] border-gray-100 border-t-[#e05a4c]"
          />
        </div>
        <p className="text-gray-400 text-sm font-medium tracking-wide">Yükleniyor</p>
      </motion.div>
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
        setError('Sipariş bulunamadı. Lütfen bilgilerinizi kontrol edin.');
        return;
      }

      const message = (data as any)?.error;
      setError(message || `Bir hata oluştu (${response.status}).`);
    } catch {
      setOrder(null);
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#f5f5f7] pt-28 lg:pt-44 pb-32">
        {/* Hero Section - Apple Style */}
        <div className="bg-white">
          <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight mb-4">
                Sipariş Takibi
              </h1>
              <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto">
                Siparişinizin anlık durumunu görüntüleyin
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 -mt-2">
          {/* Search Card - Dribbble/Apple Style */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden"
          >
            <form onSubmit={onSubmit} className="p-6 md:p-8">
              {/* Order Number Input */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Sipariş Numarası
                </label>
                <input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(sanitizeOrderNumber(e.target.value))}
                  inputMode="numeric"
                  placeholder="100001"
                  className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-200 text-2xl font-light text-gray-900 placeholder:text-gray-300 focus:border-[#e05a4c] focus:ring-0 focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* Verification Toggle - Apple Style */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Doğrulama Yöntemi
                </label>
                <div className="inline-flex bg-gray-100 rounded-full p-1">
                  <button
                    type="button"
                    onClick={() => setVerificationType('email')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                      verificationType === 'email' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    E-posta
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerificationType('phone')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                      verificationType === 'phone' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    Telefon
                  </button>
                </div>
              </div>

              {/* Verification Input */}
              <div className="mb-8">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {verificationType === 'email' ? 'E-posta Adresi' : 'Telefon Numarası'}
                </label>
                <input
                  type={verificationType === 'email' ? 'email' : 'tel'}
                  value={verificationValue}
                  onChange={(e) => setVerificationValue(e.target.value)}
                  placeholder={verificationType === 'email' ? 'ornek@email.com' : '05XX XXX XX XX'}
                  className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-200 text-lg text-gray-900 placeholder:text-gray-300 focus:border-[#e05a4c] focus:ring-0 focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* Submit Button - Apple CTA Style */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-full font-medium text-white bg-[#e05a4c] hover:bg-[#d14a3c] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Aranıyor...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Siparişi Bul</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Error State - Clean */}
          <AnimatePresence>
            {error && searched && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className="mt-4 bg-white rounded-2xl border border-red-100 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Sipariş Bulunamadı</p>
                    <p className="text-sm text-gray-500 mt-1">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Order Found - Premium Design */}
          <AnimatePresence>
            {order && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-6 space-y-4"
              >
                {/* Status Hero Card - Amazon/Apple Style */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                  {/* Status Header with Gradient */}
                  <div className={`px-6 py-8 text-center ${
                    meta.color === 'success' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                    meta.color === 'error' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                    meta.color === 'warning' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                    meta.color === 'neutral' ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                    'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                    >
                      <meta.Icon className="w-10 h-10 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-semibold text-white mb-1">{meta.label}</h2>
                    <p className="text-white/80">{meta.sublabel}</p>
                  </div>

                  {/* Order Meta */}
                  <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Sipariş No</p>
                        <p className="text-xl font-semibold text-gray-900">#{order.orderNumber}</p>
                      </div>
                      <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="p-3 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
                        title="Durumu Yenile"
                      >
                        <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Progress Timeline - Apple Style */}
                  {currentStep >= 0 && (
                    <div className="px-6 py-6">
                      <div className="flex items-center justify-between relative">
                        {/* Progress Bar Background */}
                        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 mx-10" />
                        {/* Progress Bar Fill */}
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="absolute top-4 left-0 h-0.5 bg-emerald-500 mx-10"
                          style={{ maxWidth: 'calc(100% - 80px)' }}
                        />
                        
                        {steps.map((step, idx) => {
                          const done = idx <= currentStep;
                          const isCurrent = idx === currentStep;
                          const StepIcon = step.icon;
                          
                          return (
                            <div key={step.key} className="flex flex-col items-center relative z-10">
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                  done 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-gray-100 text-gray-400'
                                } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}
                              >
                                {done ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                              </motion.div>
                              <span className={`text-xs font-medium mt-2 ${
                                isCurrent ? 'text-gray-900' : done ? 'text-gray-600' : 'text-gray-400'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Delivery Info Grid */}
                  <div className="px-6 py-5 bg-gray-50/50 border-t border-gray-100 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Teslimat Tarihi</p>
                      <p className="font-medium text-gray-900">{order.deliveryDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Teslimat Saati</p>
                      <p className="font-medium text-gray-900">{order.deliveryTimeSlot}</p>
                    </div>
                  </div>
                </div>

                {/* Refund Card */}
                {order.status === 'refunded' && order.refund && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">İade Bilgileri</p>
                          <p className="text-sm text-gray-500">Ödemeniz iade edildi</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-500">İade Tutarı</span>
                        <span className="text-2xl font-semibold text-gray-900">{formatPrice(order.refund.amount)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Tarih</p>
                          <p className="text-gray-900">{formatDate(order.refund.processedAt)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Neden</p>
                          <p className="text-gray-900">{order.refund.reason}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
                        💡 Ödemeniz 3-10 iş günü içinde hesabınıza yansıyacaktır.
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Action Card */}
                {(order.status === 'pending_payment' || order.status === 'payment_failed') && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                    <div className="p-6">
                      {/* Amount */}
                      <div className="text-center mb-6">
                        <p className="text-sm text-gray-500 mb-1">Ödenecek Tutar</p>
                        <p className="text-4xl font-light text-gray-900">{formatPrice(order.total)}</p>
                      </div>

                      {order.status === 'payment_failed' && (
                        <div className="bg-red-50 rounded-xl p-4 mb-6 flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                          <p className="text-sm text-red-700">Ödemeniz başarısız oldu. Lütfen tekrar deneyin.</p>
                        </div>
                      )}

                      {/* Credit Card CTA */}
                      <button
                        onClick={() => {
                          const resumeData = {
                            orderId: order.id,
                            orderNumber: order.orderNumber,
                            items: order.items.map((item: OrderItem) => ({
                              productId: item.productId,
                              productName: item.productName,
                              quantity: item.quantity,
                              price: item.price,
                              image: item.image,
                            })),
                            delivery: {
                              recipientName: order.recipientName,
                              recipientPhone: order.recipientPhone,
                              address: order.deliveryAddress,
                              district: order.district,
                              date: order.deliveryDate,
                              timeSlot: order.deliveryTimeSlot,
                            },
                            cardMessage: order.cardMessage,
                            senderName: order.senderName,
                            total: order.total,
                            subtotal: order.subtotal,
                            deliveryFee: order.deliveryFee,
                            discount: order.discount,
                          };
                          localStorage.setItem('vadiler-resume-order', JSON.stringify(resumeData));
                          window.location.href = '/sepet?resumeOrder=' + order.id;
                        }}
                        className="w-full bg-[#e05a4c] hover:bg-[#d14a3c] text-white font-medium py-4 px-6 rounded-full transition-all duration-200 flex items-center justify-center gap-3 text-lg shadow-lg shadow-[#e05a4c]/20"
                      >
                        <CreditCard className="w-5 h-5" />
                        <span>Kartla Öde</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>

                      <div className="flex items-center justify-center gap-2 mt-3">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500">256-bit SSL ile güvenli ödeme</span>
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-xs text-gray-400 font-medium">VEYA</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                      </div>

                      {/* Bank Transfer */}
                      <div className="bg-gray-50 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Havale / EFT</span>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-gray-500">Banka</span>
                            <span className="font-medium text-gray-900">Garanti BBVA</span>
                          </div>
                          
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-gray-500">Hesap Sahibi</span>
                            <span className="font-medium text-gray-900">STR GRUP A.Ş</span>
                          </div>

                          <div className="py-2 border-b border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-500">IBAN</span>
                              <button 
                                onClick={() => copyToClipboard('TR120006200075200006294276', 'iban')}
                                className={`text-xs font-medium flex items-center gap-1 transition-colors ${
                                  copied === 'iban' ? 'text-emerald-600' : 'text-[#e05a4c] hover:text-[#d14a3c]'
                                }`}
                              >
                                {copied === 'iban' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied === 'iban' ? 'Kopyalandı' : 'Kopyala'}
                              </button>
                            </div>
                            <code className="block bg-white px-3 py-2 rounded-lg text-xs font-mono text-gray-700 border border-gray-200">
                              TR12 0006 2000 7520 0006 2942 76
                            </code>
                          </div>

                          <div className="py-2">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-500">Açıklama</span>
                              <button 
                                onClick={() => copyToClipboard(`${order.orderNumber}`, 'aciklama')}
                                className={`text-xs font-medium flex items-center gap-1 transition-colors ${
                                  copied === 'aciklama' ? 'text-emerald-600' : 'text-[#e05a4c] hover:text-[#d14a3c]'
                                }`}
                              >
                                {copied === 'aciklama' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied === 'aciklama' ? 'Kopyalandı' : 'Kopyala'}
                              </button>
                            </div>
                            <div className="bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                              <span className="font-mono font-medium text-amber-800">#{order.orderNumber}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Card - Clean */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-900">Teslimat Adresi</span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{order.recipientName}</p>
                        <p className="text-gray-500 text-sm mb-3">{order.recipientPhone}</p>
                        <p className="text-gray-700 leading-relaxed">{order.deliveryAddress}</p>
                        <p className="text-gray-900 font-medium mt-1">{order.district}, İstanbul</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products Card - E-commerce Style */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-medium text-gray-900">Sipariş Özeti</span>
                    <span className="text-sm text-gray-500">{order.items.length} ürün</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 p-4">
                        <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                          <Image src={item.image} alt={item.productName} fill className="object-cover" />
                          {item.quantity > 1 && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-900 rounded-full text-white text-xs flex items-center justify-center font-semibold">
                              {item.quantity}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <p className="font-medium text-gray-900 line-clamp-2 leading-snug">{item.productName}</p>
                          <p className="text-sm text-gray-500 mt-1">Adet: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900 shrink-0 py-1">{formatPrice(item.price)}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Totals */}
                  <div className="px-6 py-5 bg-gray-50/80 border-t border-gray-100">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Ara Toplam</span>
                        <span className="text-gray-900">{formatPrice(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Teslimat</span>
                        <span className={order.deliveryFee > 0 ? 'text-gray-900' : 'text-emerald-600 font-medium'}>
                          {order.deliveryFee > 0 ? formatPrice(order.deliveryFee) : 'Ücretsiz'}
                        </span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-sm text-emerald-600">
                          <span>İndirim</span>
                          <span>-{formatPrice(order.discount)}</span>
                        </div>
                      )}
                      <div className="pt-3 mt-2 border-t border-gray-200 flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Toplam</span>
                        <span className="text-2xl font-semibold text-gray-900">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Message */}
                  {(order.cardMessage || order.senderName) && (
                    <div className="px-6 py-5 border-t border-gray-100">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center shrink-0">
                          <Heart className="w-5 h-5 text-pink-500" />
                        </div>
                        <div>
                          {order.senderName && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Gönderen:</span> {order.senderName}
                            </p>
                          )}
                          {order.cardMessage && (
                            <p className="text-gray-700 mt-1 italic">&ldquo;{order.cardMessage}&rdquo;</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Help Section - Amazon Style */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Headphones className="w-6 h-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Yardıma mı ihtiyacınız var?</p>
                      <p className="text-sm text-gray-500">Müşteri hizmetlerimiz size yardımcı olsun</p>
                    </div>
                    <Link 
                      href="/iletisim"
                      className="px-5 py-2.5 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      İletişim
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
