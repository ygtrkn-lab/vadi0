'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import MediaImage from '@/components/MediaImage';
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
  Flower2,
  CreditCard,
  Check,
  Copy,
  RefreshCw,
  Filter,
  Sparkles,
  Heart,
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
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// Teslimat tarihini formatla
function formatDeliveryDate(dateStr: string, timeSlot?: string): string {
  if (!dateStr) return timeSlot || '';
  
  try {
    let date: Date;
    
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
    if (timeSlot) result += ` • ${timeSlot}`;
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

// Fiyat formatla
function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
  }).format(price);
}

// Status configuration - Apple style colors
interface StatusConfig {
  label: string;
  sublabel: string;
  color: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  icon: React.ElementType;
  gradient: string;
  bg: string;
  text: string;
  border: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    label: 'Beklemede',
    sublabel: 'Siparişiniz işleniyor',
    color: 'warning',
    icon: Clock,
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  pending_payment: {
    label: 'Ödeme Bekleniyor',
    sublabel: 'Ödemenizi bekliyoruz',
    color: 'warning',
    icon: CreditCard,
    gradient: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  payment_failed: {
    label: 'Ödeme Başarısız',
    sublabel: 'Tekrar deneyebilirsiniz',
    color: 'error',
    icon: AlertCircle,
    gradient: 'from-red-500 to-rose-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  confirmed: {
    label: 'Onaylandı',
    sublabel: 'Hazırlık başlıyor',
    color: 'success',
    icon: CheckCircle2,
    gradient: 'from-emerald-500 to-green-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  processing: {
    label: 'Hazırlanıyor',
    sublabel: 'Çiçekleriniz hazırlanıyor',
    color: 'info',
    icon: Flower2,
    gradient: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
  },
  shipped: {
    label: 'Yolda',
    sublabel: 'Kuryemiz yolda',
    color: 'info',
    icon: Truck,
    gradient: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  delivered: {
    label: 'Teslim Edildi',
    sublabel: 'Sevdiklerinize ulaştı',
    color: 'success',
    icon: Check,
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  cancelled: {
    label: 'İptal Edildi',
    sublabel: 'Sipariş iptal edildi',
    color: 'neutral',
    icon: XCircle,
    gradient: 'from-gray-400 to-gray-500',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
  },
  refunded: {
    label: 'İade Edildi',
    sublabel: 'Ödemeniz iade edildi',
    color: 'info',
    icon: CreditCard,
    gradient: 'from-cyan-500 to-blue-500',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
  },
  failed: {
    label: 'Başarısız',
    sublabel: 'Bir sorun oluştu',
    color: 'error',
    icon: AlertCircle,
    gradient: 'from-red-500 to-rose-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
};

// Progress steps
const PROGRESS_STEPS = [
  { key: 'pending', label: 'Alındı', icon: Package },
  { key: 'confirmed', label: 'Onaylandı', icon: CheckCircle2 },
  { key: 'processing', label: 'Hazırlanıyor', icon: Flower2 },
  { key: 'shipped', label: 'Yolda', icon: Truck },
  { key: 'delivered', label: 'Teslim', icon: Check },
];

function getStepIndex(status: string): number {
  if (['cancelled', 'refunded', 'failed', 'payment_failed'].includes(status)) return -1;
  const idx = PROGRESS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

// Filter tabs
type FilterType = 'all' | 'active' | 'completed' | 'cancelled';

// Compact Order Card - Amazon/Shopify style
function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  const firstProduct = order.products[0];
  const productCount = order.products.length;
  const totalQuantity = order.products.reduce((sum, p) => sum + p.quantity, 0);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ backgroundColor: 'rgba(249, 250, 251, 1)' }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="group flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-gray-200 transition-all"
    >
      {/* Product Image - Compact */}
      <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
        {firstProduct?.image ? (
          <MediaImage
            src={firstProduct.image}
            alt={firstProduct.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Flower2 className="w-5 h-5 text-rose-300" />
          </div>
        )}
        {productCount > 1 && (
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-gray-900/90 rounded-tl-md flex items-center justify-center text-[9px] font-bold text-white">
            +{productCount - 1}
          </div>
        )}
      </div>
      
      {/* Order Info - Middle */}
      <div className="flex-1 min-w-0">
        {/* Product Name & Count */}
        <p className="font-medium text-gray-900 text-sm md:text-base truncate">
          {firstProduct?.name || 'Ürün'}
        </p>
        
        {/* Meta Row */}
        <div className="flex items-center gap-2 mt-0.5 text-xs md:text-sm text-gray-500">
          <span>{totalQuantity} ürün</span>
          <span className="text-gray-300">•</span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
        
        {/* Delivery Date - Mobile inline */}
        {order.delivery?.deliveryDate && (
          <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600">
            <Calendar className="w-3 h-3" />
            <span>{formatDeliveryDate(order.delivery.deliveryDate, order.delivery.deliveryTimeSlot)}</span>
          </div>
        )}
      </div>
      
      {/* Right Side - Price & Status */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {/* Price */}
        <span className="font-semibold text-gray-900 text-sm md:text-base">
          {formatPrice(order.total)}
        </span>
        
        {/* Status Badge - Compact */}
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bg}`}>
          <Icon className={`w-3 h-3 ${config.text}`} />
          <span className={`text-[10px] md:text-xs font-medium ${config.text}`}>{config.label}</span>
        </div>
      </div>
      
      {/* Arrow - Desktop only */}
      <ChevronRight className="hidden md:block w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
    </motion.div>
  );
}

// Compact Order Detail Modal - Apple Sheet style
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  const currentStep = getStepIndex(order.status);
  const showProgress = !['cancelled', 'refunded', 'failed', 'payment_failed'].includes(order.status);
  const [copied, setCopied] = useState<string | null>(null);
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 32, stiffness: 400 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full md:w-[480px] md:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-hidden shadow-2xl"
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${config.gradient} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">#{(order as any).orderNumber || order.id?.slice(-6)}</span>
                <button
                  onClick={() => copyToClipboard((order as any).orderNumber?.toString() || order.id?.slice(-6), 'order')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {copied === 'order' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                </button>
              </div>
              <div className={`text-xs font-medium ${config.text}`}>{config.label}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          {/* Compact Progress */}
          {showProgress && (
            <div className="flex items-center gap-1 p-3 bg-gray-50 rounded-xl">
              {PROGRESS_STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const isActive = idx <= currentStep;
                const isCurrent = idx === currentStep;
                const isLast = idx === PROGRESS_STEPS.length - 1;
                
                return (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                        isCurrent 
                          ? `bg-gradient-to-r ${config.gradient} text-white` 
                          : isActive 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-white border border-gray-200 text-gray-400'
                      }`}>
                        <StepIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className={`text-[9px] mt-1 font-medium ${
                        isCurrent ? config.text : isActive ? 'text-emerald-600' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {!isLast && (
                      <div className={`flex-1 h-px mx-0.5 ${idx < currentStep ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
          
          {/* Compact Delivery Info */}
          {order.delivery && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-[10px] text-emerald-600 uppercase">Alıcı</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{order.delivery.recipientName}</p>
                  </div>
                </div>
                
                {order.delivery.recipientPhone && (
                  <a href={`tel:${order.delivery.recipientPhone}`} className="flex items-center gap-2 hover:bg-emerald-100 rounded-lg p-1 -m-1 transition-colors">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="text-[10px] text-emerald-600 uppercase">Telefon</p>
                      <p className="text-sm font-medium text-gray-900">{formatPhone(order.delivery.recipientPhone)}</p>
                    </div>
                  </a>
                )}
              </div>
              
              <div className="flex items-start gap-2 mt-3 pt-3 border-t border-emerald-100">
                <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  {order.delivery.fullAddress && `${order.delivery.fullAddress}, `}
                  {order.delivery.neighborhood && `${order.delivery.neighborhood}, `}
                  {order.delivery.district}, {order.delivery.province}
                </p>
              </div>
              
              {order.delivery.deliveryDate && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-emerald-100">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-700">
                    {formatDeliveryDate(order.delivery.deliveryDate, order.delivery.deliveryTimeSlot)}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Message - Compact */}
          {order.message?.content && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium text-amber-700">Mesaj Kartı</span>
              </div>
              <p className="text-sm text-gray-700 italic">&ldquo;{order.message.content}&rdquo;</p>
            </div>
          )}
          
          {/* Products - Compact List */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-600 uppercase">Ürünler</span>
              <span className="text-xs text-gray-500">{order.products.length} ürün</span>
            </div>
            
            <div className="divide-y divide-gray-50">
              {order.products.map((product, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                    {product.image ? (
                      <MediaImage src={product.image} alt={product.name} width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Flower2 className="w-5 h-5 text-rose-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.quantity} × {formatPrice(product.price)}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatPrice(product.price * product.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Total - Compact */}
          <div className="flex items-center justify-between p-3 bg-gray-900 rounded-xl text-white">
            <span className="text-sm">Toplam</span>
            <span className="text-lg font-bold">{formatPrice(order.total)}</span>
          </div>
          
          {/* Actions - Compact */}
          <div className="flex gap-2">
            <Link
              href={`/siparis-takip?order=${(order as any).orderNumber || order.id?.slice(-6)}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#e05a4c] text-white text-sm font-medium rounded-xl hover:bg-[#d14a3c] transition-colors"
            >
              <Truck className="w-4 h-4" />
              Takip Et
            </Link>
            <a
              href="tel:08503074876"
              className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <Phone className="w-4 h-4 text-gray-600" />
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Compact Empty State
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-100 p-8 text-center"
    >
      <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <ShoppingBag className="w-8 h-8 text-rose-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Henüz siparişiniz yok
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Sevdiklerinize çiçek göndermek için alışverişe başlayın
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#e05a4c] text-white text-sm font-medium rounded-full hover:bg-[#d14a3c] transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Alışverişe Başla
      </Link>
    </motion.div>
  );
}

// Main Page Component - Compact Layout
export default function SiparislerimPage() {
  const { state: customerState } = useCustomer();
  const { state: orderState, refreshOrders } = useOrder();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const customer = customerState.currentCustomer;
  
  // Get customer orders
  const customerOrders = useMemo(() => {
    return orderState.orders
      .filter((order: Order) => customer?.orders?.includes(order.id))
      .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orderState.orders, customer?.orders]);
  
  // Filter orders
  const filteredOrders = useMemo(() => {
    switch (activeFilter) {
      case 'active':
        return customerOrders.filter((o: Order) => 
          ['pending', 'pending_payment', 'confirmed', 'processing', 'shipped'].includes(o.status)
        );
      case 'completed':
        return customerOrders.filter((o: Order) => o.status === 'delivered');
      case 'cancelled':
        return customerOrders.filter((o: Order) => 
          ['cancelled', 'refunded', 'failed', 'payment_failed'].includes(o.status)
        );
      default:
        return customerOrders;
    }
  }, [customerOrders, activeFilter]);
  
  // Stats
  const stats = useMemo(() => ({
    total: customerOrders.length,
    active: customerOrders.filter((o: Order) => ['pending', 'pending_payment', 'confirmed', 'processing', 'shipped'].includes(o.status)).length,
    completed: customerOrders.filter((o: Order) => o.status === 'delivered').length,
    cancelled: customerOrders.filter((o: Order) => ['cancelled', 'refunded', 'failed', 'payment_failed'].includes(o.status)).length,
  }), [customerOrders]);
  
  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshOrders?.();
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };
  
  if (!customer) return null;
  
  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'Tümü', count: stats.total },
    { key: 'active', label: 'Aktif', count: stats.active },
    { key: 'completed', label: 'Tamamlanan', count: stats.completed },
    { key: 'cancelled', label: 'İptal', count: stats.cancelled },
  ];
  
  return (
    <>
      <div className="space-y-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Siparişlerim</h1>
            <p className="text-sm text-gray-500">
              {stats.total} sipariş{stats.active > 0 && ` • ${stats.active} aktif`}
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Compact Filter Tabs */}
        {stats.total > 0 && (
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg overflow-x-auto">
            {filters.map(filter => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  activeFilter === filter.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter.label}
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                  activeFilter === filter.key
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-gray-200/60 text-gray-500'
                }`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        )}
        
        {/* Orders List - Compact */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order: Order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => setSelectedOrder(order)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : customerOrders.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-50 rounded-xl p-6 text-center"
          >
            <Filter className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Bu kategoride sipariş yok</p>
          </motion.div>
        ) : (
          <EmptyState />
        )}
      </div>
      
      {/* Order Detail Modal */}
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
