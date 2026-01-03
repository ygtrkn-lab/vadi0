'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Header, Footer, MobileNavBar } from '@/components';
import {
  HiOutlineSearch,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineHashtag,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineCheck,
  HiOutlineTruck,
  HiOutlineGift,
  HiOutlineExclamation,
  HiOutlineX,
  HiOutlineRefresh,
  HiOutlineShoppingBag,
} from 'react-icons/hi';

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
  status: 'pending' | 'confirmed' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';
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

const statusConfig = {
  pending: { 
    label: 'Onay Bekliyor', 
    color: 'bg-amber-500', 
    textColor: 'text-amber-500',
    bgLight: 'bg-amber-50',
    icon: HiOutlineClock,
    step: 1
  },
  confirmed: { 
    label: 'Onaylandı', 
    color: 'bg-blue-500', 
    textColor: 'text-blue-500',
    bgLight: 'bg-blue-50',
    icon: HiOutlineCheck,
    step: 2
  },
  preparing: { 
    label: 'Hazırlanıyor', 
    color: 'bg-purple-500', 
    textColor: 'text-purple-500',
    bgLight: 'bg-purple-50',
    icon: HiOutlineGift,
    step: 3
  },
  on_the_way: { 
    label: 'Yolda', 
    color: 'bg-indigo-500', 
    textColor: 'text-indigo-500',
    bgLight: 'bg-indigo-50',
    icon: HiOutlineTruck,
    step: 4
  },
  delivered: { 
    label: 'Teslim Edildi', 
    color: 'bg-emerald-500', 
    textColor: 'text-emerald-500',
    bgLight: 'bg-emerald-50',
    icon: HiOutlineCheck,
    step: 5
  },
  cancelled: { 
    label: 'İptal Edildi', 
    color: 'bg-red-500', 
    textColor: 'text-red-500',
    bgLight: 'bg-red-50',
    icon: HiOutlineX,
    step: 0
  },
};

const trackingSteps = [
  { status: 'pending', label: 'Sipariş Alındı' },
  { status: 'confirmed', label: 'Onaylandı' },
  { status: 'preparing', label: 'Hazırlanıyor' },
  { status: 'on_the_way', label: 'Yolda' },
  { status: 'delivered', label: 'Teslim Edildi' },
];

export default function SiparisTakipPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [verificationValue, setVerificationValue] = useState('');
  const [verificationType, setVerificationType] = useState<'email' | 'phone'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setSearched(true);

    try {
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: parseInt(orderNumber),
          verificationType,
          verificationValue,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOrder(data);
      } else {
        setError(data.error || 'Sipariş bulunamadı');
        setOrder(null);
      }
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDeliveryDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const currentStep = order ? statusConfig[order.status].step : 0;

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-32 lg:pt-44 pb-20">
        <div className="container-custom max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl 
              bg-gradient-to-br from-primary-500 to-primary-600 shadow-xl shadow-primary-500/30 mb-6">
              <HiOutlineSearch className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Sipariş Takibi
            </h1>
            <p className="text-gray-500 max-w-md mx-auto">
              Sipariş numaranız ve e-posta veya telefon numaranız ile siparişinizi takip edebilirsiniz.
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 md:p-8 mb-8"
          >
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Order Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sipariş Numarası
                </label>
                <div className="relative">
                  <HiOutlineHashtag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Örn: 100001"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl
                      text-gray-900 placeholder:text-gray-400
                      focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white
                      transition-all text-lg font-medium"
                    required
                  />
                </div>
              </div>

              {/* Verification Type Tabs */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Doğrulama Yöntemi
                </label>
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setVerificationType('email')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium
                      transition-all ${
                      verificationType === 'email'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <HiOutlineMail className="w-5 h-5" />
                    E-posta
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerificationType('phone')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium
                      transition-all ${
                      verificationType === 'phone'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <HiOutlinePhone className="w-5 h-5" />
                    Telefon
                  </button>
                </div>
              </div>

              {/* Verification Value */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {verificationType === 'email' ? 'E-posta Adresi' : 'Telefon Numarası'}
                </label>
                <div className="relative">
                  {verificationType === 'email' ? (
                    <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  ) : (
                    <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  )}
                  <input
                    type={verificationType === 'email' ? 'email' : 'tel'}
                    value={verificationValue}
                    onChange={(e) => setVerificationValue(e.target.value)}
                    placeholder={verificationType === 'email' ? 'ornek@email.com' : '05XX XXX XX XX'}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl
                      text-gray-900 placeholder:text-gray-400
                      focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white
                      transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Sipariş verirken kullandığınız {verificationType === 'email' ? 'e-posta adresini' : 'telefon numarasını'} girin.
                </p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 text-red-600 bg-red-50 
                      border border-red-100 px-4 py-3 rounded-xl"
                  >
                    <HiOutlineExclamation className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white 
                  font-semibold rounded-xl shadow-lg shadow-primary-500/30
                  hover:shadow-xl hover:shadow-primary-500/40 transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Aranıyor...
                  </>
                ) : (
                  <>
                    <HiOutlineSearch className="w-5 h-5" />
                    Siparişi Sorgula
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Order Result */}
          <AnimatePresence mode="wait">
            {searched && !order && !isLoading && !error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <HiOutlineShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sipariş Bulunamadı</h3>
                <p className="text-gray-500 mb-6">
                  Girdiğiniz bilgilerle eşleşen bir sipariş bulamadık.
                </p>
                <button
                  onClick={() => { setSearched(false); setOrderNumber(''); setVerificationValue(''); }}
                  className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700"
                >
                  <HiOutlineRefresh className="w-5 h-5" />
                  Tekrar Dene
                </button>
              </motion.div>
            )}

            {order && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Order Status Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden">
                  {/* Status Header */}
                  <div className={`${statusConfig[order.status].bgLight} px-6 py-5 border-b border-gray-100`}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${statusConfig[order.status].color} 
                          flex items-center justify-center`}>
                          {(() => {
                            const Icon = statusConfig[order.status].icon;
                            return <Icon className="w-6 h-6 text-white" />;
                          })()}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Sipariş #{order.orderNumber}</p>
                          <p className={`text-lg font-bold ${statusConfig[order.status].textColor}`}>
                            {statusConfig[order.status].label}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Sipariş Tarihi</p>
                        <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Tracker */}
                  {order.status !== 'cancelled' && (
                    <div className="px-6 py-8">
                      <div className="relative">
                        {/* Progress Line */}
                        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" />
                        <div 
                          className="absolute top-5 left-0 h-1 bg-primary-500 rounded-full transition-all duration-500"
                          style={{ width: `${((currentStep - 1) / (trackingSteps.length - 1)) * 100}%` }}
                        />

                        {/* Steps */}
                        <div className="relative flex justify-between">
                          {trackingSteps.map((step, index) => {
                            const isCompleted = currentStep > index + 1;
                            const isCurrent = currentStep === index + 1;
                            
                            return (
                              <div key={step.status} className="flex flex-col items-center">
                                <div 
                                  className={`w-10 h-10 rounded-full flex items-center justify-center
                                    transition-all duration-300 ${
                                    isCompleted 
                                      ? 'bg-primary-500 text-white' 
                                      : isCurrent
                                      ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                                      : 'bg-gray-200 text-gray-400'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <HiOutlineCheck className="w-5 h-5" />
                                  ) : (
                                    <span className="text-sm font-medium">{index + 1}</span>
                                  )}
                                </div>
                                <p className={`text-xs mt-2 text-center max-w-[80px] ${
                                  isCompleted || isCurrent ? 'text-gray-900 font-medium' : 'text-gray-400'
                                }`}>
                                  {step.label}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery Info */}
                  <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <HiOutlineClock className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Teslimat Zamanı</p>
                          <p className="font-semibold text-gray-900">
                            {formatDeliveryDate(order.deliveryDate)}
                          </p>
                          <p className="text-sm text-gray-600">{order.deliveryTimeSlot}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <HiOutlineLocationMarker className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Teslimat Adresi</p>
                          <p className="font-semibold text-gray-900">{order.recipientName}</p>
                          <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                          <p className="text-sm text-gray-600">{order.district}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Sipariş Detayları</h3>
                  
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={item.image || '/placeholder.jpg'}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                          <p className="text-sm text-gray-500">Adet: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Card Message */}
                  {order.cardMessage && (
                    <div className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-100">
                      <div className="flex items-center gap-2 mb-2">
                        <HiOutlineGift className="w-5 h-5 text-primary-600" />
                        <p className="font-medium text-primary-900">Kart Mesajı</p>
                      </div>
                      <p className="text-gray-700 italic">"{order.cardMessage}"</p>
                      {order.senderName && (
                        <p className="text-sm text-gray-500 mt-1">- {order.senderName}</p>
                      )}
                    </div>
                  )}

                  {/* Price Summary */}
                  <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Ara Toplam</span>
                      <span className="text-gray-900">{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Teslimat</span>
                      <span className="text-gray-900">
                        {order.deliveryFee === 0 ? 'Ücretsiz' : formatPrice(order.deliveryFee)}
                      </span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">İndirim</span>
                        <span className="text-emerald-600">-{formatPrice(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                      <span className="text-gray-900">Toplam</span>
                      <span className="text-primary-600">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Search Again */}
                <div className="text-center">
                  <button
                    onClick={() => { setOrder(null); setSearched(false); setOrderNumber(''); setVerificationValue(''); }}
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 font-medium"
                  >
                    <HiOutlineRefresh className="w-5 h-5" />
                    Başka Sipariş Sorgula
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Help Section */}
          {!order && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-12 text-center"
            >
              <p className="text-gray-500 mb-4">Sipariş numaranızı bulamıyor musunuz?</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/giris"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-xl
                    text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                >
                  Üye Girişi Yapın
                </Link>
                <a
                  href="tel:+902121234567"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-50 rounded-xl
                    text-primary-700 font-medium hover:bg-primary-100 transition-colors"
                >
                  <HiOutlinePhone className="w-5 h-5" />
                  Bizi Arayın
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNavBar />
    </>
  );
}
