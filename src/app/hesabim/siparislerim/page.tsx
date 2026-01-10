'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useCustomer } from '@/context/CustomerContext';
import { useOrder, Order } from '@/context/OrderContext';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  Calendar,
  ChevronRight,
  X,
  Phone,
  Gift,
  ShoppingBag,
  AlertCircle,
  XCircle,
} from 'lucide-react';

// Türkçe ay isimleri
const TURKISH_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const TURKISH_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

// Tarihi formatla
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const day = date.getDate();
  const month = TURKISH_MONTHS[date.getMonth()];
  return `${day} ${month}`;
}

// Teslimat tarihini formatla
function formatDeliveryDate(dateStr: string, timeSlot?: string): string {
  if (!dateStr) return timeSlot || '';
  
  try {
    let date: Date;
    
    // "2026-01-03" formatı
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-').map(Number);
      if (parts.length === 3 && parts.every(p => !isNaN(p))) {
        date = new Date(parts[0], parts[1] - 1, parts[2]);
      } else {
        date = new Date(dateStr);
      }
    } else {
      date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) {
      return timeSlot || '';
    }
    
    const dayOfMonth = date.getDate();
    const dayName = TURKISH_DAYS[date.getDay()];
    const monthName = TURKISH_MONTHS[date.getMonth()];
    
    let result = `${dayOfMonth} ${monthName} ${dayName}`;
    if (timeSlot) result += `, ${timeSlot}`;
    return result;
  } catch {
    return timeSlot || '';
  }
}

// Telefon formatla
function formatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) return phone;
  return `0${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
}

// Durum bilgileri
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { label: 'Beklemede', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Clock },
  pending_payment: { label: 'Ödeme Bekleniyor', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: Clock },
  payment_failed: { label: 'Ödeme Başarısız', color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertCircle },
  confirmed: { label: 'Onaylandı', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: CheckCircle2 },
  processing: { label: 'Hazırlanıyor', color: 'text-purple-600', bgColor: 'bg-purple-50', icon: Gift },
  shipped: { label: 'Yolda', color: 'text-indigo-600', bgColor: 'bg-indigo-50', icon: Truck },
  delivered: { label: 'Teslim Edildi', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle2 },
  cancelled: { label: 'İptal Edildi', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: XCircle },
};

// Sipariş durumu badge
function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
      <Icon className="w-4 h-4" />
      {config.label}
    </span>
  );
}

// Basit ilerleme çubuğu
function ProgressBar({ status }: { status: string }) {
  const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentIndex = steps.indexOf(status);
  
  if (status === 'cancelled' || status === 'payment_failed') {
    return null;
  }
  
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;
  
  return (
    <div className="mt-4">
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>Sipariş Alındı</span>
        <span>Teslim Edildi</span>
      </div>
    </div>
  );
}

// Sipariş kartı
function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const firstProduct = order.products[0];
  const productCount = order.products.length;
  const totalQuantity = order.products.reduce((sum, p) => sum + p.quantity, 0);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
    >
      {/* Üst kısım - Sipariş bilgisi */}
      <div className="p-4 border-b border-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-lg font-bold text-gray-900">
              ₺{order.total.toLocaleString('tr-TR')}
            </p>
            <p className="text-sm text-gray-500">
              {formatDate(order.createdAt)} • {totalQuantity} ürün
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        
        <ProgressBar status={order.status} />
      </div>
      
      {/* Ürün önizleme */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Ürün görseli */}
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
            {firstProduct?.image ? (
              <Image
                src={firstProduct.image}
                alt={firstProduct.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-300" />
              </div>
            )}
          </div>
          
          {/* Ürün bilgisi */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {firstProduct?.name || 'Ürün'}
            </p>
            {productCount > 1 && (
              <p className="text-sm text-gray-500">
                +{productCount - 1} ürün daha
              </p>
            )}
          </div>
          
          {/* Ok ikonu */}
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
        
        {/* Teslimat bilgisi */}
        {order.delivery?.deliveryDate && (
          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-primary-500" />
            <span>{formatDeliveryDate(order.delivery.deliveryDate, order.delivery.deliveryTimeSlot)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Sipariş detay modalı
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full md:w-[480px] md:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Sipariş Detayı</h2>
            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {/* Durum */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Sipariş Durumu</span>
              <StatusBadge status={order.status} />
            </div>
            <ProgressBar status={order.status} />
          </div>
          
          {/* Teslimat bilgisi */}
          {order.delivery && (
            <div className="bg-emerald-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-gray-900">Teslimat Bilgileri</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 w-20 flex-shrink-0">Alıcı:</span>
                  <span className="text-gray-900 font-medium">{order.delivery.recipientName}</span>
                </div>
                
                {order.delivery.recipientPhone && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 w-20 flex-shrink-0">Telefon:</span>
                    <a href={`tel:${order.delivery.recipientPhone}`} className="text-emerald-600 font-medium flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {formatPhone(order.delivery.recipientPhone)}
                    </a>
                  </div>
                )}
                
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 w-20 flex-shrink-0">Adres:</span>
                  <span className="text-gray-900">
                    {order.delivery.fullAddress && `${order.delivery.fullAddress}, `}
                    {order.delivery.neighborhood && `${order.delivery.neighborhood}, `}
                    {order.delivery.district}, {order.delivery.province}
                  </span>
                </div>
                
                {order.delivery.deliveryDate && (
                  <div className="flex items-start gap-2 pt-2 border-t border-emerald-100">
                    <Calendar className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <span className="text-emerald-700 font-medium">
                      {formatDeliveryDate(order.delivery.deliveryDate, order.delivery.deliveryTimeSlot)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Mesaj kartı */}
          {order.message?.content && (
            <div className="bg-amber-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-gray-900">Mesaj Kartı</span>
              </div>
              <p className="text-gray-700 italic">&ldquo;{order.message.content}&rdquo;</p>
            </div>
          )}
          
          {/* Ürünler */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <span className="font-semibold text-gray-900">Ürünler ({order.products.length})</span>
            </div>
            
            <div className="divide-y divide-gray-50">
              {order.products.map((product, idx) => (
                <div key={idx} className="p-4 flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.quantity} adet</p>
                  </div>
                  
                  <p className="font-semibold text-gray-900">
                    ₺{(product.price * product.quantity).toLocaleString('tr-TR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Toplam */}
          <div className="bg-gray-900 text-white rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Toplam</span>
              <span className="text-2xl font-bold">₺{order.total.toLocaleString('tr-TR')}</span>
            </div>
          </div>
          
          {/* Yardım */}
          <div className="text-center py-2">
            <a href="tel:08503074876" className="text-sm text-gray-500 hover:text-primary-600 transition-colors">
              Yardım mı lazım? <span className="font-medium">0850 307 4876</span>
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Ana sayfa
export default function SiparislerimPage() {
  const { state: customerState } = useCustomer();
  const { state: orderState } = useOrder();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const customer = customerState.currentCustomer;
  
  // Müşterinin siparişleri (en yeniden en eskiye)
  const customerOrders = orderState.orders
    .filter((order: Order) => customer?.orders?.includes(order.id))
    .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  if (!customer) return null;
  
  return (
    <>
      <div className="space-y-4">
        {/* Başlık */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Siparişlerim</h1>
            <p className="text-gray-500">{customerOrders.length} sipariş</p>
          </div>
        </div>
        
        {/* Sipariş listesi */}
        {customerOrders.length > 0 ? (
          <div className="space-y-3">
            {customerOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => setSelectedOrder(order)}
              />
            ))}
          </div>
        ) : (
          // Boş durum
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-gray-100 p-8 text-center"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Henüz siparişiniz yok
            </h3>
            <p className="text-gray-500 mb-6">
              Hemen alışverişe başlayın!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              Alışverişe Başla
            </Link>
          </motion.div>
        )}
      </div>
      
      {/* Sipariş detay modalı */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
