'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useCustomer } from '@/context/CustomerContext';
import { useOrder, Order } from '@/context/OrderContext';
import { FadeIn, SpotlightCard, BottomSheet, GlassCard, BorderBeam } from '@/components/ui-kit/premium';
import {
  HiOutlineShoppingBag,
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineX,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineGift,
  HiOutlineDocumentText,
  HiOutlineChevronRight,
  HiOutlineClipboardList,
  HiOutlineXCircle,
  HiOutlineCalendar,
  HiOutlineMail,
  HiOutlineShoppingCart,
  HiOutlinePhotograph,
  HiOutlineCurrencyDollar,
} from 'react-icons/hi';

function extractInlineScripts(html: string): string[] {
  const matches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  const scripts: string[] = [];
  for (const m of matches) {
    const code = (m[1] || '').trim();
    if (code) scripts.push(code);
  }
  return scripts;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Bilinmeyen hata';
  }
}

// Status icons config
const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: HiOutlineClock,
  pending_payment: HiOutlineClock,
  payment_failed: HiOutlineExclamationCircle,
  confirmed: HiOutlineCheckCircle,
  processing: HiOutlineGift,
  shipped: HiOutlineTruck,
  delivered: HiOutlineCheckCircle,
  cancelled: HiOutlineXCircle,
};

// Timeline adımları
const timelineSteps = [
  { status: 'pending_payment', label: 'Ödeme Bekleniyor', icon: HiOutlineClock },
  { status: 'pending', label: 'Sipariş Alındı', icon: HiOutlineClipboardList },
  { status: 'confirmed', label: 'Onaylandı', icon: HiOutlineCheckCircle },
  { status: 'processing', label: 'Hazırlanıyor', icon: HiOutlineGift },
  { status: 'shipped', label: 'Yolda', icon: HiOutlineTruck },
  { status: 'delivered', label: 'Teslim Edildi', icon: HiOutlineCheckCircle },
];

export default function SiparislerimPage() {
  const { state: customerState } = useCustomer();
  const { state: orderState } = useOrder();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);
  const [show3DSModal, setShow3DSModal] = useState(false);
  const [threeDSHtmlContent, setThreeDSHtmlContent] = useState<string | null>(null);
  const iyzicoContainerRef = useRef<HTMLDivElement>(null);

  const customer = customerState.currentCustomer;

  // Mount iyzico CheckoutForm directly into the modal (no iframe)
  useEffect(() => {
    if (!show3DSModal || !threeDSHtmlContent) return;
    const container = iyzicoContainerRef.current;
    if (!container) return;

    try {
      const decoded = atob(threeDSHtmlContent);

      // Clear previous content
      container.innerHTML = '';

      // Ensure required container exists for iyzico script
      const checkoutDiv = document.createElement('div');
      checkoutDiv.id = 'iyzipay-checkout-form';
      checkoutDiv.className = 'responsive';
      container.appendChild(checkoutDiv);

      // Reset global iyziInit so the returned script can initialize again
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        if (w.iyziInit) {
          delete w.iyziInit;
          w.iyziInit = undefined;
        }
      } catch {
        // ignore
      }

      // Remove previously injected checkout bundle scripts to avoid stale init
      for (const s of Array.from(document.querySelectorAll('script[data-iyzico-checkout="1"]'))) {
        s.parentElement?.removeChild(s);
      }

      const scripts = extractInlineScripts(decoded);
      for (const code of scripts) {
        const scriptEl = document.createElement('script');
        scriptEl.type = 'text/javascript';
        scriptEl.setAttribute('data-iyzico-checkout', '1');
        scriptEl.text = code;
        document.body.appendChild(scriptEl);
      }

      if (scripts.length === 0) {
        container.insertAdjacentHTML('beforeend', decoded);
      }
    } catch (e) {
      console.error('❌ Failed to mount iyzico checkout form:', e);
    }
  }, [show3DSModal, threeDSHtmlContent]);

  const handleRetryPayment = async (order: Order) => {
    if (!customer) {
      alert('Ödeme başlatmak için giriş yapmalısınız.');
      return;
    }

    setRetryingOrderId(order.id);
    try {
      const res = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          cartItems: [],
          customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            createdAt: customer.createdAt,
          },
          deliveryInfo: {
            province: { name: order.delivery?.province || 'Istanbul' },
            district: { name: order.delivery?.district || '' },
            recipientName: order.delivery?.recipientName || customer.name,
            recipientPhone: order.delivery?.recipientPhone || customer.phone,
            recipientAddress: order.delivery?.fullAddress || '',
          },
          totalAmount: order.total,
        }),
      });

      const data = await res.json();
      if (!data?.success || !data?.threeDSHtmlContent) {
        throw new Error(data?.error || 'Ödeme başlatılamadı');
      }

      setThreeDSHtmlContent(data.threeDSHtmlContent);
      setShow3DSModal(true);
    } catch (e: unknown) {
      console.error('❌ Retry payment error:', e);
      alert(getErrorMessage(e) || 'Ödeme başlatılırken bir hata oluştu.');
    } finally {
      setRetryingOrderId(null);
    }
  };

  // Müşterinin siparişlerini getir
  const customerOrders: Order[] = orderState.orders
    .filter((order: Order) => (customer ? customer.orders.includes(order.id) : false))
    .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredOrders: Order[] = filter === 'all' 
    ? customerOrders 
    : customerOrders.filter((order: Order) => order.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'pending_payment': return 'bg-amber-100 text-amber-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'processing': return 'bg-indigo-100 text-indigo-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'payment_failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'pending_payment': return 'Ödeme Bekleniyor';
      case 'confirmed': return 'Onaylandı';
      case 'processing': return 'Hazırlanıyor';
      case 'shipped': return 'Kargoda';
      case 'delivered': return 'Teslim Edildi';
      case 'cancelled': return 'İptal Edildi';
      case 'payment_failed': return 'Ödeme Başarısız';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return HiOutlineClock;
      case 'pending_payment': return HiOutlineClock;
      case 'payment_failed': return HiOutlineExclamationCircle;
      case 'confirmed': return HiOutlineCheckCircle;
      case 'processing': return HiOutlineGift;
      case 'shipped': return HiOutlineTruck;
      case 'delivered': return HiOutlineCheckCircle;
      case 'cancelled': return HiOutlineExclamationCircle;
      default: return HiOutlineClock;
    }
  };

  const getTimelineProgress = (status: string) => {
    const statusIndex = timelineSteps.findIndex(s => s.status === status);
    if (status === 'cancelled' || status === 'payment_failed') return -1;
    return statusIndex;
  };

  const filterOptions = [
    { value: 'all', label: 'Tümü', icon: HiOutlineClipboardList },
    { value: 'pending', label: 'Beklemede', icon: HiOutlineClock },
    { value: 'pending_payment', label: 'Ödeme Bekleniyor', icon: HiOutlineClock },
    { value: 'payment_failed', label: 'Ödeme Başarısız', icon: HiOutlineExclamationCircle },
    { value: 'confirmed', label: 'Onaylandı', icon: HiOutlineCheckCircle },
    { value: 'processing', label: 'Hazırlanıyor', icon: HiOutlineGift },
    { value: 'shipped', label: 'Kargoda', icon: HiOutlineTruck },
    { value: 'delivered', label: 'Teslim', icon: HiOutlineCheckCircle },
    { value: 'cancelled', label: 'İptal', icon: HiOutlineXCircle },
  ];

  // Sipariş sayıları
  const orderCounts = {
    all: customerOrders.length,
    pending: customerOrders.filter(o => o.status === 'pending').length,
    processing: customerOrders.filter(o => o.status === 'processing' || o.status === 'confirmed').length,
    shipped: customerOrders.filter(o => o.status === 'shipped').length,
    delivered: customerOrders.filter(o => o.status === 'delivered').length,
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsBottomSheetOpen(true);
  };

  if (!customer) return null;

  return (
    <>
      <div className="space-y-6 pb-6">
        {/* Stats Cards - Mobilde yatay scroll */}
        <FadeIn direction="down">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 scrollbar-hide">
            {[
              { label: 'Toplam', value: orderCounts.all, icon: HiOutlineShoppingBag, color: 'from-slate-500 to-slate-600' },
              { label: 'Hazırlanan', value: orderCounts.processing, icon: HiOutlineGift, color: 'from-indigo-500 to-indigo-600' },
              { label: 'Kargoda', value: orderCounts.shipped, icon: HiOutlineTruck, color: 'from-purple-500 to-purple-600' },
              { label: 'Tamamlanan', value: orderCounts.delivered, icon: HiOutlineCheckCircle, color: 'from-emerald-500 to-emerald-600' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex-shrink-0 w-[140px] md:w-auto"
              >
                <div className={`bg-gradient-to-br ${stat.color} rounded-2xl p-4 text-white relative overflow-hidden`}>
                  <div className="absolute -right-2 -top-2 opacity-20">
                    {React.createElement(stat.icon, { className: 'w-10 h-10' })}
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-white/80">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </FadeIn>

        {/* Filter Pills */}
        <FadeIn direction="up" delay={0.1}>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            {filterOptions.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => setFilter(option.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium 
                  transition-all duration-300 ${
                  filter === option.value
                    ? 'bg-[#e05a4c] text-white shadow-lg shadow-[#e05a4c]/25'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {React.createElement(option.icon, { className: 'w-4 h-4' })}
                <span>{option.label}</span>
                {option.value !== 'all' && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    filter === option.value ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {customerOrders.filter(o => o.status === option.value).length}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </FadeIn>

        {/* Order List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const StatusIcon = getStatusIcon(order.status);
              const timelineProgress = getTimelineProgress(order.status);
              
              return (
                <FadeIn key={order.id} direction="up" delay={index * 0.05}>
                  <SpotlightCard spotlightColor="rgba(224, 90, 76, 0.15)">
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="bg-white rounded-2xl overflow-hidden cursor-pointer"
                      onClick={() => openOrderDetail(order)}
                    >
                      {/* Order Header */}
                      <div className="p-4 md:p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {/* Status Icon with Animation */}
                            <motion.div 
                              className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getStatusColor(order.status)}`}
                              animate={order.status === 'shipped' ? { x: [0, 5, 0] } : {}}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              <StatusIcon className="w-6 h-6" />
                            </motion.div>
                            <div>
                              <p className="font-semibold text-gray-800">
                                #{order.id.slice(-6).toUpperCase()}
                              </p>
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <HiOutlineClock className="w-3.5 h-3.5" />
                                {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              ₺{order.total.toLocaleString('tr-TR')}
                            </p>
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
                        </div>

                        {/* Mini Timeline - sadece aktif siparişlerde göster */}
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                              {timelineSteps.slice(0, 5).map((step, i) => {
                                const isCompleted = i <= timelineProgress;
                                const isCurrent = i === timelineProgress;
                                return (
                                  <div key={step.status} className="flex flex-col items-center flex-1">
                                    <motion.div 
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                                        ${isCompleted 
                                          ? 'bg-[#e05a4c] text-white' 
                                          : 'bg-gray-100 text-gray-400'
                                        } ${isCurrent ? 'ring-2 ring-[#e05a4c]/30' : ''}`}
                                      animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                                      transition={{ repeat: Infinity, duration: 2 }}
                                    >
                                      <step.icon className="w-4 h-4" />
                                    </motion.div>
                                    {i < timelineSteps.length - 1 && (
                                      <div className={`h-0.5 w-full mt-4 ${isCompleted ? 'bg-[#e05a4c]' : 'bg-gray-200'}`} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Products Preview */}
                      <div className="px-4 pb-4">
                        {/* Ürün Listesi - Detaylı */}
                        <div className="space-y-2 mb-3">
                          {order.products.slice(0, 3).map((product, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {product.image ? (
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <HiOutlinePhotograph className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                                {product.quantity > 1 && (
                                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#e05a4c] text-white 
                                    text-[9px] rounded-full flex items-center justify-center font-bold">
                                    {product.quantity}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-800 truncate">{product.name}</p>
                                <p className="text-xs text-gray-500">{product.quantity} adet × ₺{product.price.toLocaleString('tr-TR')}</p>
                              </div>
                              <p className="font-semibold text-sm text-gray-900">₺{(product.price * product.quantity).toLocaleString('tr-TR')}</p>
                            </div>
                          ))}
                          {order.products.length > 3 && (
                            <p className="text-xs text-center text-gray-400">+{order.products.length - 3} ürün daha</p>
                          )}
                        </div>

                        {/* Teslimat Bilgisi */}
                        {order.delivery && (
                          <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-xl mb-3">
                            <HiOutlineLocationMarker className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800">{order.delivery.recipientName}</p>
                              <p className="text-xs text-gray-600 truncate">
                                {order.delivery.district}, {order.delivery.province}
                              </p>
                              {order.delivery.deliveryDate && (
                                <p className="text-xs font-medium text-amber-600 mt-1 flex items-center gap-1">
                                  <HiOutlineCalendar className="w-3.5 h-3.5" />
                                  <span>{order.delivery.deliveryDate} {order.delivery.deliveryTimeSlot || ''}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Mesaj Kartı */}
                        {order.message?.content && (
                          <div className="p-2 bg-pink-50 rounded-xl mb-3">
                            <p className="text-xs font-medium text-pink-600 flex items-center gap-1">
                              <HiOutlineMail className="w-3.5 h-3.5" />
                              <span>Mesaj Kartı</span>
                            </p>
                            <p className="text-xs text-gray-600 truncate italic">&quot;{order.message.content}&quot;</p>
                          </div>
                        )}
                          
                        {/* Detay Butonu */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-400">{order.products.length} ürün</span>
                          <motion.div 
                            className="flex items-center gap-1 text-[#e05a4c] text-sm font-medium"
                            whileHover={{ x: 5 }}
                          >
                            Detayları Gör
                            <HiOutlineChevronRight className="w-4 h-4" />
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  </SpotlightCard>
                </FadeIn>
              );
            })}
          </div>
        ) : (
          <FadeIn>
            <GlassCard className="p-8 md:p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 
                  rounded-full flex items-center justify-center mx-auto mb-4"
              >
                {React.createElement(
                  filter === 'all' ? HiOutlineShoppingBag : (filterOptions.find(f => f.value === filter)?.icon || HiOutlineShoppingBag),
                  { className: 'w-10 h-10 text-gray-400' }
                )}
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {filter === 'all' ? 'Henüz siparişiniz yok' : 'Bu durumda sipariş yok'}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all' 
                  ? 'Hemen alışverişe başlayın ve ilk siparişinizi oluşturun!' 
                  : 'Farklı bir filtre seçerek diğer siparişlerinizi görüntüleyin.'}
              </p>
              {filter === 'all' && (
                <Link 
                  href="/kategoriler"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e05a4c] to-[#d54a3c] 
                    text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#e05a4c]/25 transition-all"
                >
                  <HiOutlineShoppingCart className="w-5 h-5" />
                  <span>Alışverişe Başla</span>
                </Link>
              )}
            </GlassCard>
          </FadeIn>
        )}
      </div>

      {/* Order Detail Bottom Sheet (Mobile) / Modal (Desktop) */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            {/* Mobile: Bottom Sheet */}
            <div className="md:hidden">
              <BottomSheet
                isOpen={isBottomSheetOpen}
                onClose={() => {
                  setIsBottomSheetOpen(false);
                  setTimeout(() => setSelectedOrder(null), 300);
                }}
                title={`Sipariş #${selectedOrder.id.slice(-6).toUpperCase()}`}
              >
                <OrderDetailContent 
                  order={selectedOrder} 
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                  getStatusIcon={getStatusIcon}
                  getTimelineProgress={getTimelineProgress}
                  onRetryPayment={handleRetryPayment}
                  retryingOrderId={retryingOrderId}
                />
              </BottomSheet>
            </div>

            {/* Desktop: Modal */}
            <div className="hidden md:block">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={() => setSelectedOrder(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden relative"
                >
                  <BorderBeam size={300} duration={10} />
                  
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-[#e05a4c]/5 to-transparent">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getStatusColor(selectedOrder.status)}`}>
                        {React.createElement(getStatusIcon(selectedOrder.status), { className: 'w-7 h-7' })}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Sipariş #{selectedOrder.id.slice(-6).toUpperCase()}
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {new Date(selectedOrder.createdAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedOrder(null)}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 
                        hover:bg-gray-200 transition-colors"
                    >
                      <HiOutlineX className="w-5 h-5 text-gray-500" />
                    </motion.button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
                    <OrderDetailContent 
                      order={selectedOrder} 
                      getStatusColor={getStatusColor}
                      getStatusText={getStatusText}
                      getStatusIcon={getStatusIcon}
                      getTimelineProgress={getTimelineProgress}
                      onRetryPayment={handleRetryPayment}
                      retryingOrderId={retryingOrderId}
                    />
                  </div>

                  {/* Modal Footer */}
                  <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedOrder(null)}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl 
                          hover:bg-gray-200 transition-colors"
                      >
                        Kapat
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 py-3 bg-gradient-to-r from-[#e05a4c] to-[#d54a3c] text-white 
                          font-medium rounded-xl hover:shadow-lg hover:shadow-[#e05a4c]/25 transition-all
                          flex items-center justify-center gap-2"
                      >
                        <HiOutlineDocumentText className="w-5 h-5" />
                        Fatura İndir
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* 3DS Payment Modal (Retry) */}
      {show3DSModal && threeDSHtmlContent && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-stretch justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full h-[100dvh] min-h-[100svh] sm:h-auto sm:max-h-[95vh] sm:max-w-md overflow-hidden shadow-2xl rounded-none sm:rounded-2xl flex flex-col"
          >
            <div className="bg-gradient-to-r from-[#e05a4c] to-[#e8b4bc] p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <HiOutlineCurrencyDollar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Güvenli Ödeme</h3>
                  <p className="text-white/80 text-xs">3D Secure Doğrulama</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Image
                  src="/iyzico/iyzicoLogoWhite.svg"
                  alt="iyzico"
                  width={60}
                  height={20}
                  className="h-5 w-auto opacity-90"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShow3DSModal(false);
                    setThreeDSHtmlContent(null);
                  }}
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center"
                  aria-label="Kapat"
                >
                  <HiOutlineX className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              <div ref={iyzicoContainerRef} className="w-full h-full" />
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

// Order Detail Content Component
interface OrderDetailContentProps {
  order: Order;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  getStatusIcon: (status: string) => React.ComponentType<{className?: string}>;
  getTimelineProgress: (status: string) => number;
  onRetryPayment?: (order: Order) => void;
  retryingOrderId?: string | null;
}

function OrderDetailContent({
  order,
  getStatusColor,
  getStatusText,
  getTimelineProgress,
  onRetryPayment,
  retryingOrderId,
}: OrderDetailContentProps) {
  const timelineProgress = getTimelineProgress(order.status);
  
  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${getStatusColor(order.status)}`}>
        {React.createElement(statusIcons[order.status], { className: 'w-5 h-5' })}
        <span>{getStatusText(order.status)}</span>
      </div>

      {/* Timeline - Enhanced */}
      {order.status !== 'cancelled' && (
        <div className="bg-gray-50 rounded-2xl p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <HiOutlineLocationMarker className="w-5 h-5 text-gray-600" />
            <span>Sipariş Durumu</span>
          </h4>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded-full">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#e05a4c] to-[#d54a3c] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(timelineProgress / (timelineSteps.length - 1)) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            
            <div className="relative flex justify-between">
              {timelineSteps.map((step, i) => {
                const isCompleted = i <= timelineProgress;
                const isCurrent = i === timelineProgress;
                return (
                  <div key={step.status} className="flex flex-col items-center">
                    <motion.div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg relative z-10
                        ${isCompleted 
                          ? 'bg-gradient-to-r from-[#e05a4c] to-[#d54a3c] text-white shadow-lg shadow-[#e05a4c]/30' 
                          : 'bg-white border-2 border-gray-200 text-gray-400'
                        }`}
                      animate={isCurrent ? { scale: [1, 1.15, 1], boxShadow: ['0 0 0 0 rgba(224,90,76,0)', '0 0 0 8px rgba(224,90,76,0.2)', '0 0 0 0 rgba(224,90,76,0)'] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      {React.createElement(step.icon, { className: 'w-5 h-5' })}
                    </motion.div>
                    <span className={`text-xs mt-2 font-medium ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Products */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <HiOutlineShoppingBag className="w-5 h-5 text-gray-600" />
          <span>Ürünler ({order.products.length})</span>
        </h4>
        <div className="space-y-2">
          {order.products.map((product, idx) => (
            <motion.div 
              key={idx} 
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white flex-shrink-0">
                {product.image ? (
                  <Image src={product.image} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <HiOutlinePhotograph className="w-7 h-7 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {(product.slug || product.productId) ? (
                  <Link 
                    href={`/${product.category || 'cicek'}/${product.slug || product.productId}`}
                    className="font-medium text-gray-800 truncate block hover:text-[#e05a4c] transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {product.name}
                  </Link>
                ) : (
                  <p className="font-medium text-gray-800 truncate">{product.name}</p>
                )}
                <p className="text-sm text-gray-500">{product.quantity} adet × ₺{product.price.toLocaleString('tr-TR')}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-gray-800">₺{(product.price * product.quantity).toLocaleString('tr-TR')}</p>
                {(product.slug || product.productId) && (
                  <Link 
                    href={`/${product.category || 'cicek'}/${product.slug || product.productId}`}
                    className="text-xs text-[#e05a4c] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ürüne Git →
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Delivery Info */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <HiOutlineLocationMarker className="w-5 h-5 text-gray-600" />
          <span>Teslimat Bilgileri</span>
        </h4>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#e05a4c]/10 rounded-lg flex items-center justify-center">
              <HiOutlineLocationMarker className="w-5 h-5 text-[#e05a4c]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{order.delivery.recipientName}</p>
              <p className="text-sm text-gray-600 mt-1">{order.delivery.fullAddress}</p>
              <p className="text-sm text-gray-600">{order.delivery.district}, {order.delivery.province}</p>
              <a 
                href={`tel:${order.delivery.recipientPhone.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-2 mt-2 text-sm text-[#e05a4c] hover:underline"
              >
                <HiOutlinePhone className="w-4 h-4" />
                {order.delivery.recipientPhone}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      {order.payment && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <HiOutlineCurrencyDollar className="w-5 h-5 text-gray-600" />
            <span>Ödeme Bilgileri</span>
          </h4>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-800">
                  {order.payment.method === 'credit_card'
                    ? '💳 Kredi Kartı'
                    : order.payment.method === 'bank_transfer'
                      ? '🏦 Havale/EFT'
                      : '💵 Kapıda Ödeme'}
                  {order.payment.cardLast4 ? ` (**** ${order.payment.cardLast4})` : ''}
                </p>
                {order.payment.transactionId && (
                  <p className="text-sm text-gray-600 mt-1 break-all">
                    İşlem: {order.payment.transactionId}
                  </p>
                )}
                {order.payment.paidAt && (
                  <p className="text-sm text-gray-600 mt-1">
                    Ödeme Zamanı: {new Date(order.payment.paidAt).toLocaleString('tr-TR')}
                  </p>
                )}
              </div>

              <div className="flex-shrink-0">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    order.payment.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-700'
                      : order.payment.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : order.payment.status === 'refunded'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {order.payment.status === 'paid'
                    ? 'Ödendi'
                    : order.payment.status === 'failed'
                      ? 'Başarısız'
                      : order.payment.status === 'refunded'
                        ? 'İade'
                        : 'Bekliyor'}
                </span>
              </div>
            </div>

            {(order.payment.status === 'failed' || order.status === 'payment_failed') && (order.payment.errorMessage || order.payment.errorCode || order.payment.errorGroup) && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-xs font-semibold text-red-700">Ödeme Hatası</p>
                {order.payment.errorMessage && (
                  <p className="text-sm text-red-700 mt-1 break-words">{order.payment.errorMessage}</p>
                )}
                {(order.payment.errorCode || order.payment.errorGroup) && (
                  <p className="text-xs text-red-600 mt-1 break-words">
                    {order.payment.errorCode ? `Kod: ${String(order.payment.errorCode)}` : ''}
                    {order.payment.errorCode && order.payment.errorGroup ? ' • ' : ''}
                    {order.payment.errorGroup ? `Grup: ${String(order.payment.errorGroup)}` : ''}
                  </p>
                )}
              </div>
            )}

            {(order.status === 'pending_payment' || order.status === 'payment_failed') &&
              order.payment.method === 'credit_card' &&
              order.payment.status !== 'paid' &&
              onRetryPayment && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => onRetryPayment(order)}
                    disabled={retryingOrderId === order.id}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-[#e05a4c] to-[#d54a3c] text-white rounded-xl font-semibold
                      hover:shadow-lg hover:shadow-[#e05a4c]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {retryingOrderId === order.id ? 'Başlatılıyor...' : 'Ödemeyi Şimdi Tamamla'}
                  </button>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <HiOutlineCurrencyDollar className="w-5 h-5 text-gray-600" />
          <span>Sipariş Özeti</span>
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Ara Toplam</span>
            <span>₺{order.subtotal.toLocaleString('tr-TR')}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <div className="flex items-center gap-1">
                <HiOutlineGift className="w-4 h-4" />
                <span>İndirim</span>
              </div>
              <span>-₺{order.discount.toLocaleString('tr-TR')}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <div className="flex items-center gap-1">
              <HiOutlineTruck className="w-4 h-4" />
              <span>Teslimat</span>
            </div>
            <span>{order.deliveryFee > 0 ? `₺${order.deliveryFee.toLocaleString('tr-TR')}` : 'Ücretsiz'}</span>
          </div>
          <div className="border-t border-gray-200/80 pt-3 mt-3">
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Toplam</span>
              <span>₺{order.total.toLocaleString('tr-TR')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
