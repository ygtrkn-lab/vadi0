'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { SpotlightCard, FadeContent, StatusBadge, AnimatedCounter } from '@/components/admin';
import { useTheme } from '../ThemeContext';
import { useOrder, Order, OrderStatus } from '@/context/OrderContext';
import { useCustomer } from '@/context/CustomerContext';
import { 
  HiOutlineSearch, 
  HiOutlineCurrencyDollar,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineClipboardList,
  HiOutlineFilter,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker,
  HiOutlineRefresh
} from 'react-icons/hi';

const statusConfig: Record<OrderStatus, { label: string; variant: 'warning' | 'info' | 'pending' | 'success' | 'error'; icon: React.ReactNode }> = {
  pending: { label: 'Beklemede', variant: 'warning', icon: <HiOutlineClock className="w-4 h-4" /> },
  pending_payment: { label: 'Ödeme Bekleniyor', variant: 'pending', icon: <HiOutlineClock className="w-4 h-4" /> },
  awaiting_payment: { label: 'Havale Bekleniyor', variant: 'warning', icon: <HiOutlineCurrencyDollar className="w-4 h-4" /> },
  payment_failed: { label: 'Ödeme Başarısız', variant: 'error', icon: <HiOutlineXCircle className="w-4 h-4" /> },
  confirmed: { label: 'Onaylandı', variant: 'info', icon: <HiOutlineCheckCircle className="w-4 h-4" /> },
  processing: { label: 'Hazırlanıyor', variant: 'info', icon: <HiOutlineClipboardList className="w-4 h-4" /> },
  shipped: { label: 'Kargoda', variant: 'pending', icon: <HiOutlineTruck className="w-4 h-4" /> },
  delivered: { label: 'Teslim Edildi', variant: 'success', icon: <HiOutlineCheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'İptal', variant: 'error', icon: <HiOutlineXCircle className="w-4 h-4" /> },
};

// Türkçe ay ve gün isimleri
const TURKISH_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const TURKISH_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

// Tarihi okunabilir formata çevir: "3 Ocak Perşembe"
function formatDeliveryDateFriendly(dateStr: string, timeSlot?: string): string {
  if (!dateStr) return '';
  
  try {
    // dateStr: "2026-01-03" veya "2026-01-03T00:00:00.000Z" formatında olabilir
    const cleanDate = dateStr.split('T')[0];
    const [year, month, day] = cleanDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    if (isNaN(date.getTime())) return dateStr;
    
    const dayName = TURKISH_DAYS[date.getDay()];
    const monthName = TURKISH_MONTHS[date.getMonth()];
    const dayOfMonth = date.getDate();
    
    let result = `${dayOfMonth} ${monthName} ${dayName}`;
    
    // Saat dilimini ekle
    if (timeSlot) {
      result += `, ${timeSlot}`;
    }
    
    return result;
  } catch {
    return dateStr;
  }
}

export default function SiparislerPage() {
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [onlyPaid, setOnlyPaid] = useState(false);
  const [todayToPrepare, setTodayToPrepare] = useState(false);
  
  const { isDark } = useTheme();
  const { state: orderState, updateOrderStatus } = useOrder();
  const { getCustomerById } = useCustomer();

  const itemsPerPage = 10;

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    return orderState.orders
      .filter(order => {
        // Optional: only show paid orders when toggled
        if (onlyPaid) {
          const paymentStatus = order.payment?.status?.toLowerCase();
          if (paymentStatus !== 'paid') return false;
        }

        // Optional: show only orders that should be prepared/delivered today
        if (todayToPrepare) {
          const d = order.delivery?.deliveryDate || '';
          const isTodayDelivery = d === todayStr;
          const isActive = order.status !== 'delivered' && order.status !== 'cancelled';
          if (!(isTodayDelivery && isActive)) return false;
        }

        // Status filter - processing includes both processing and confirmed
        let matchesStatus = selectedStatus === 'all';
        if (selectedStatus === 'processing') {
          matchesStatus = order.status === 'processing' || order.status === 'confirmed';
        } else if (selectedStatus !== 'all') {
          matchesStatus = order.status === selectedStatus;
        }
        
        const customerName = order.customerName || '';
        const customerEmail = order.customerEmail || '';
        const matchesSearch = 
          customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.orderNumber.toString().includes(searchTerm) ||
          customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
        
        const orderDate = new Date(order.createdAt);
        let matchesDate = true;
        if (dateFilter === 'today') {
          matchesDate = orderDate >= today;
        } else if (dateFilter === 'week') {
          matchesDate = orderDate >= weekAgo;
        } else if (dateFilter === 'month') {
          matchesDate = orderDate >= monthAgo;
        }
        
        return matchesStatus && matchesSearch && matchesDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orderState.orders, selectedStatus, searchTerm, dateFilter, onlyPaid, todayToPrepare]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredOrders, currentPage, itemsPerPage]);

  const stats = useMemo(() => {
    const orders = orderState.orders;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
    
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing' || o.status === 'confirmed').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      revenue: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
    };
  }, [orderState.orders]);

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus, note?: string) => {
    updateOrderStatus(orderId, newStatus, note);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? {
        ...prev,
        status: newStatus,
        timeline: [
          ...prev.timeline,
          { status: newStatus, timestamp: new Date().toISOString(), note }
        ]
      } : null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getNextStatus = (currentStatus: OrderStatus): { status: OrderStatus; label: string } | null => {
    switch (currentStatus) {
      case 'pending': return { status: 'confirmed', label: 'Onayla' };
      case 'confirmed': return { status: 'processing', label: 'Hazırlanıyor' };
      case 'processing': return { status: 'shipped', label: 'Kargoya Ver' };
      case 'shipped': return { status: 'delivered', label: 'Teslim Edildi' };
      default: return null;
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Compact Header with Stats */}
      <FadeContent direction="up" delay={0}>
        <div className={`rounded-2xl border p-4 ${isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          {/* Top Row: Title + Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Siparişler</h1>
              <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'}`}>
                {filteredOrders.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className={`p-2 rounded-lg transition-all hover:scale-105 ${
                  isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Yenile"
              >
                <HiOutlineRefresh className="w-4 h-4" />
              </button>
              <div className={`text-xs px-3 py-1.5 rounded-lg ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                Bugün: {stats.todayOrders} sipariş • {formatPrice(stats.todayRevenue)}
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
            {[
              { label: 'Toplam', value: stats.total, status: 'all', color: isDark ? 'text-white' : 'text-gray-900', bg: isDark ? 'bg-neutral-800' : 'bg-gray-100' },
              { label: 'Beklemede', value: stats.pending, status: 'pending', color: 'text-amber-500', bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50' },
              { label: 'Hazırlanıyor', value: stats.processing, status: 'processing', color: 'text-blue-500', bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50' },
              { label: 'Kargoda', value: stats.shipped, status: 'shipped', color: 'text-purple-500', bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50' },
              { label: 'Teslim', value: stats.delivered, status: 'delivered', color: 'text-emerald-500', bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50' },
              { label: 'İptal', value: stats.cancelled, status: 'cancelled', color: 'text-red-500', bg: isDark ? 'bg-red-500/10' : 'bg-red-50' },
            ].map((stat) => (
              <button
                key={stat.status}
                onClick={() => { setSelectedStatus(stat.status); setCurrentPage(1); }}
                className={`p-2 rounded-xl text-center transition-all hover:scale-[1.02] ${stat.bg} ${
                  selectedStatus === stat.status ? 'ring-2 ' + (isDark ? 'ring-white/20' : 'ring-gray-400/30') : ''
                }`}
              >
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{stat.label}</p>
              </button>
            ))}
          </div>

          {/* Total Revenue */}
          <div className={`flex items-center justify-between p-3 rounded-xl mb-4 ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                <HiOutlineCurrencyDollar className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Toplam Gelir</p>
                <p className="text-lg font-bold text-emerald-500">{formatPrice(stats.revenue)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {['all', 'today', 'week', 'month'].map(filter => (
                <button
                  key={filter}
                  onClick={() => { setDateFilter(filter as typeof dateFilter); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    dateFilter === filter
                      ? (isDark ? 'bg-white text-black' : 'bg-gray-900 text-white')
                      : (isDark ? 'text-neutral-500 hover:text-white' : 'text-gray-500 hover:text-gray-900')
                  }`}
                >
                  {filter === 'all' ? 'Tümü' : filter === 'today' ? 'Bugün' : filter === 'week' ? 'Hafta' : 'Ay'}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <HiOutlineSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Sipariş no, müşteri ara..."
                value={searchTerm}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className={`w-full pl-9 pr-8 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  isDark 
                    ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500 focus:ring-white/10' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-gray-200'
                }`}
              />
              {searchTerm && (
                <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <HiOutlineX className={`w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`sm:hidden flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm ${
                isDark ? 'border-neutral-700 text-neutral-400' : 'border-gray-200 text-gray-600'
              }`}
            >
              <HiOutlineFilter className="w-4 h-4" />
              Filtrele
            </button>

            {/* Quick Filter Pills - Desktop */}
            <div className="hidden sm:flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => { setTodayToPrepare(!todayToPrepare); setCurrentPage(1); }}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  todayToPrepare
                    ? (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700')
                    : (isDark ? 'text-neutral-500 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')
                }`}
              >
                📦 Bugün Haz.
              </button>
              <button
                onClick={() => { setOnlyPaid(!onlyPaid); setCurrentPage(1); }}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  onlyPaid
                    ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                    : (isDark ? 'text-neutral-500 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')
                }`}
              >
                💳 Ödenenler
              </button>
              <div className={`w-px h-5 mx-1 ${isDark ? 'bg-neutral-700' : 'bg-gray-200'}`} />
              {['pending_payment', 'payment_failed', 'confirmed'].map((status) => (
                <button
                  key={status}
                  onClick={() => { setSelectedStatus(status); setCurrentPage(1); }}
                  className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedStatus === status
                      ? (isDark ? 'bg-white text-black' : 'bg-gray-900 text-white')
                      : (isDark ? 'text-neutral-500 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')
                  }`}
                >
                  {statusConfig[status as OrderStatus].label}
                </button>
              ))}
              {(selectedStatus !== 'all' || onlyPaid || todayToPrepare || dateFilter !== 'all' || searchTerm) && (
                <button
                  onClick={() => { setSelectedStatus('all'); setOnlyPaid(false); setTodayToPrepare(false); setDateFilter('all'); setSearchTerm(''); setCurrentPage(1); }}
                  className={`px-2 py-2 rounded-lg text-xs ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}
                >
                  <HiOutlineX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Filters Expanded */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="sm:hidden overflow-hidden"
              >
                <div className={`pt-3 mt-3 border-t flex flex-wrap gap-2 ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                  <button
                    onClick={() => { setTodayToPrepare(!todayToPrepare); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      todayToPrepare ? (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700') : (isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-600')
                    }`}
                  >
                    📦 Bugün Haz.
                  </button>
                  <button
                    onClick={() => { setOnlyPaid(!onlyPaid); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      onlyPaid ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-600')
                    }`}
                  >
                    💳 Ödenenler
                  </button>
                  {['pending', 'pending_payment', 'payment_failed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => { setSelectedStatus(status); setCurrentPage(1); setShowFilters(false); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        selectedStatus === status
                          ? (isDark ? 'bg-white text-black' : 'bg-gray-900 text-white')
                          : (isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-600')
                      }`}
                    >
                      {statusConfig[status as OrderStatus].label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Filters Tags */}
          {(() => {
            const chips: { key: string; label: string; onClear: () => void }[] = [];
            if (searchTerm) chips.push({ key: 'q', label: `"${searchTerm}"`, onClear: () => { setSearchTerm(''); setCurrentPage(1); } });
            if (selectedStatus !== 'all') chips.push({ key: 'st', label: statusConfig[selectedStatus as OrderStatus]?.label || selectedStatus, onClear: () => { setSelectedStatus('all'); setCurrentPage(1); } });
            if (dateFilter !== 'all') chips.push({ key: 'df', label: dateFilter === 'today' ? 'Bugün' : dateFilter === 'week' ? 'Bu Hafta' : 'Bu Ay', onClear: () => { setDateFilter('all'); setCurrentPage(1); } });
            if (onlyPaid) chips.push({ key: 'paid', label: 'Ödenenler', onClear: () => { setOnlyPaid(false); setCurrentPage(1); } });
            if (todayToPrepare) chips.push({ key: 'today', label: 'Bugün Haz.', onClear: () => { setTodayToPrepare(false); setCurrentPage(1); } });
            if (chips.length === 0) return null;
            return (
              <div className="mt-3 pt-3 border-t border-dashed flex flex-wrap items-center gap-1.5" style={{ borderColor: isDark ? '#333' : '#e5e7eb' }}>
                <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>Filtreler:</span>
                {chips.map((c) => (
                  <span key={c.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-100 text-gray-700'}`}>
                    {c.label}
                    <button onClick={c.onClear} className="hover:text-red-500">
                      <HiOutlineX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            );
          })()}
        </div>
      </FadeContent>

      {/* Orders List */}
      {orderState.isLoading ? (
        <FadeContent direction="up" delay={0.35}>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`p-5 rounded-2xl border animate-pulse ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
                <div className={`h-5 w-40 rounded mb-3 ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`}></div>
                <div className={`h-4 w-2/3 rounded ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`}></div>
              </div>
            ))}
          </div>
        </FadeContent>
      ) : (
        paginatedOrders.length > 0 && (
          <FadeContent direction="up" delay={0.35}>
            <div className="space-y-3">
              {paginatedOrders.map((order, index) => {
            const customer = order.customerId ? getCustomerById(order.customerId) : undefined;
            const displayCustomerName = (order.customerName || '').trim() || customer?.name || 'Misafir';
            const displayCustomerPhone = (order.customerPhone || '').trim() || customer?.phone || '-';

            const paymentStatus = order.payment?.status?.toLowerCase();
            const paymentBadge = (
              <StatusBadge
                status={paymentStatus === 'paid' ? 'success' : paymentStatus === 'failed' ? 'error' : paymentStatus === 'refunded' ? 'warning' : 'pending'}
                text={paymentStatus === 'paid' ? 'Ödendi' : paymentStatus === 'failed' ? 'Başarısız' : paymentStatus === 'refunded' ? 'İade' : 'Bekliyor'}
              />
            );

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <SpotlightCard className="p-3 sm:p-4">
                  <div className="flex flex-col gap-3">
                    {/* Top Row: Order + Status + Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>#{order.orderNumber}</span>
                        <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{formatDate(order.createdAt)}</span>
                        {paymentBadge}
                        <StatusBadge
                          status={statusConfig[order.status]?.variant || 'info'}
                          text={statusConfig[order.status]?.label || order.status || 'Bilinmiyor'}
                          pulse={order.status === 'pending'}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {getNextStatus(order.status) && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, getNextStatus(order.status)!.status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              order.status === 'pending' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' :
                              order.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' :
                              order.status === 'processing' ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' :
                              'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            }`}
                          >
                            {getNextStatus(order.status)!.label}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                          title="Detayı görüntüle"
                        >
                          <HiOutlineEye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Compact Info Row */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-neutral-900' : 'bg-white'} border ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                        <p className={`text-[11px] uppercase tracking-wide ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Müşteri</p>
                        <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{displayCustomerName}</p>
                        <p className={`text-xs truncate ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{displayCustomerPhone}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-neutral-900' : 'bg-white'} border ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                        <p className={`text-[11px] uppercase tracking-wide ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Teslimat</p>
                        <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {order.delivery?.district || '-'}{order.delivery?.district && order.delivery?.province ? '/' : ''}{order.delivery?.province || ''}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                          {order.delivery?.deliveryDate ? `📅 ${formatDeliveryDateFriendly(order.delivery.deliveryDate, order.delivery.deliveryTimeSlot)}` : ''}
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-neutral-900' : 'bg-white'} border ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                        <p className={`text-[11px] uppercase tracking-wide ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Ürün</p>
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-3">
                            {order.products.slice(0, 4).map((p, idx) => (
                              <div key={idx} className={`relative w-14 h-14 rounded-md overflow-hidden border ${isDark ? 'border-neutral-700' : 'border-gray-200'}`}>
                                {p.image ? (
                                  <Image src={p.image} alt={p.name} fill className="object-cover" unoptimized />
                                ) : (
                                  <div className={`w-full h-full flex items-center justify-center text-xs ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'}`}>🌸</div>
                                )}
                                {p.quantity > 1 && (
                                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-[#e05a4c] text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                                    {p.quantity}
                                  </span>
                                )}
                              </div>
                            ))}
                            {order.products.length > 4 && (
                              <div className={`w-14 h-14 rounded-md flex items-center justify-center text-xs font-medium ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'}`}>
                                +{order.products.length - 4}
                              </div>
                            )}
                          </div>
                          <span className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{order.products.length} adet</span>
                        </div>
                      </div>
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-neutral-900' : 'bg-white'} border ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                        <p className={`text-[11px] uppercase tracking-wide ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Tutar</p>
                        <p className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatPrice(order.total)}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-neutral-900' : 'bg-white'} border ${isDark ? 'border-neutral-800' : 'border-gray-200'} md:text-right`}> 
                        <p className={`text-[11px] uppercase tracking-wide ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>No / Teslimat</p>
                        <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>#{order.orderNumber}</p>
                        <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                          {order.delivery?.deliveryDate ? formatDeliveryDateFriendly(order.delivery.deliveryDate, order.delivery.deliveryTimeSlot) : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </div>
      </FadeContent>
        )
      )}

      {/* Empty State */}
      {!orderState.isLoading && filteredOrders.length === 0 && (
        <FadeContent direction="up" delay={0.35}>
          <div className="text-center py-12">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4
              ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
              <HiOutlineClipboardList className={`w-8 h-8 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Sipariş bulunamadı</h3>
            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Arama/filtre kriterlerinize uygun sipariş yok
              {onlyPaid ? ' (Sadece ödenenler açık)' : ''}
            </p>
          </div>
        </FadeContent>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <FadeContent direction="up" delay={0.4}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              Sayfa {currentPage} / {totalPages} ({filteredOrders.length} sipariş)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  ${isDark 
                    ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' 
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <HiOutlineChevronLeft className="w-5 h-5" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl font-medium transition-colors
                      ${currentPage === page 
                        ? (isDark ? 'bg-white text-black' : 'bg-purple-600 text-white')
                        : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  ${isDark 
                    ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' 
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <HiOutlineChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </FadeContent>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/80' : 'bg-black/50'}`} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className={`relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border p-6
                ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Sipariş #{selectedOrder.orderNumber}
                    </h3>
                    <StatusBadge 
                      status={statusConfig[selectedOrder.status]?.variant || 'info'}
                      text={statusConfig[selectedOrder.status]?.label || selectedOrder.status || 'Bilinmiyor'}
                      pulse={selectedOrder.status === 'pending'}
                    />
                  </div>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className={`p-2 rounded-xl transition-colors
                    ${isDark 
                      ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' 
                      : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Info */}
              <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Müşteri Bilgileri</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedOrder.isGuest === true
                      ? (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700')
                      : selectedOrder.customerId 
                      ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                      : (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700')
                  }`}>
                    {selectedOrder.isGuest === true ? '👁 Misafir' : (selectedOrder.customerId ? '👤 Üye' : '👁 Misafir')}
                  </span>
                </div>
                <div className="space-y-2">
                  {(() => {
                    const customer = selectedOrder.customerId ? getCustomerById(selectedOrder.customerId) : undefined;
                    const displayCustomerName = (selectedOrder.customerName || '').trim() || customer?.name || 'Misafir Müşteri';
                    return (
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{displayCustomerName}</p>
                    );
                  })()}
                  {selectedOrder.customerEmail && (
                    <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      <HiOutlineMail className="w-4 h-4" />
                      <a href={`mailto:${selectedOrder.customerEmail}`} className="hover:underline">{selectedOrder.customerEmail}</a>
                    </div>
                  )}
                  {selectedOrder.customerPhone && (
                    <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      <HiOutlinePhone className="w-4 h-4" />
                      <a href={`tel:${selectedOrder.customerPhone}`} className="hover:underline">{selectedOrder.customerPhone}</a>
                    </div>
                  )}
                  {selectedOrder.customerId && (
                    <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                      Müşteri ID: {selectedOrder.customerId}
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery Info */}
              {selectedOrder.delivery && (
              <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Teslimat Bilgileri</p>
                <div className="space-y-3">
                  {/* Recipient Info */}
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-neutral-900/50' : 'bg-white'}`}>
                    <p className={`text-xs font-medium mb-1 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>Alıcı</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedOrder.delivery.recipientName || '-'}
                    </p>
                    {selectedOrder.delivery.recipientPhone && (
                      <a href={`tel:${selectedOrder.delivery.recipientPhone}`} className={`flex items-center gap-2 text-sm mt-1 hover:underline ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        <HiOutlinePhone className="w-4 h-4" />
                        {selectedOrder.delivery.recipientPhone}
                      </a>
                    )}
                  </div>

                  {/* Full Address */}
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-neutral-900/50' : 'bg-white'}`}>
                    <p className={`text-xs font-medium mb-1 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>Teslimat Adresi</p>
                    <div className={`flex items-start gap-2 text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      <HiOutlineLocationMarker className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{selectedOrder.delivery.fullAddress || '-'}</p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                          {[
                            selectedOrder.delivery.neighborhood,
                            selectedOrder.delivery.district,
                            selectedOrder.delivery.province
                          ].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Date & Time */}
                  {selectedOrder.delivery.deliveryDate && (
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
                      <p className={`text-xs font-medium mb-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>📅 Teslimat Zamanı</p>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatDeliveryDateFriendly(selectedOrder.delivery.deliveryDate, selectedOrder.delivery.deliveryTimeSlot)}
                      </p>
                    </div>
                  )}

                  {/* Delivery Notes */}
                  {selectedOrder.delivery.deliveryNotes && (
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
                      <p className={`text-xs font-medium mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>📝 Teslimat Notu</p>
                      <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                        {selectedOrder.delivery.deliveryNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Message Card */}
              {selectedOrder.message && selectedOrder.message.content && (
                <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-pink-500/10 border border-pink-500/20' : 'bg-pink-50 border border-pink-100'}`}>
                  <p className={`text-sm font-medium mb-2 ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>
                    💌 Mesaj Kartı {selectedOrder.message.isGift && '(Hediye Olarak Gönderilsin)'}
                  </p>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-pink-500/5' : 'bg-white'}`}>
                    <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      {selectedOrder.message.content}
                    </p>
                  </div>
                  {selectedOrder.message.senderName && (
                    <p className={`text-sm mt-2 text-right ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>
                      — {selectedOrder.message.senderName}
                    </p>
                  )}
                </div>
              )}

              {/* Products */}
              <div className="mb-4">
                <p className={`text-sm font-medium mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  Ürünler ({selectedOrder.products.length} adet)
                </p>
                <div className="space-y-3">
                  {selectedOrder.products.map((product, index) => (
                    <div key={index} className={`flex items-center gap-4 p-4 rounded-xl border transition-all
                      ${isDark 
                        ? 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600' 
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Product Image */}
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200">
                        {product.image ? (
                          <Image 
                            src={product.image} 
                            alt={product.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            🌸
                          </div>
                        )}
                        {product.quantity > 1 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#e05a4c] text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {product.quantity}
                          </span>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                            {product.quantity} adet × {formatPrice(product.price)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Price & Action */}
                      <div className="text-right">
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatPrice(product.price * product.quantity)}
                        </p>
                        {(product.slug || product.productId) && (
                          <Link 
                            href={`/${product.category || 'cicek'}/${product.slug || product.productId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#e05a4c] hover:text-[#cd3f31] mt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Ürüne Git →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-neutral-400' : 'text-gray-500'}>Ara Toplam</span>
                    <span className={isDark ? 'text-neutral-300' : 'text-gray-700'}>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-neutral-400' : 'text-gray-500'}>Teslimat</span>
                    <span className="text-emerald-400">Ücretsiz</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className={isDark ? 'text-neutral-400' : 'text-gray-500'}>İndirim</span>
                      <span className="text-red-400">-{formatPrice(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-neutral-700 flex justify-between">
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Toplam</span>
                    <span className="text-xl font-bold text-emerald-400">{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              {selectedOrder.payment && (
              <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Ödeme Bilgileri</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      {selectedOrder.payment.method === 'credit_card' ? '💳 Kredi Kartı' :
                       selectedOrder.payment.method === 'bank_transfer' ? '🏦 Havale/EFT' : '💵 Kapıda Ödeme'}
                      {selectedOrder.payment.cardLast4 && ` (**** ${selectedOrder.payment.cardLast4})`}
                    </p>
                    {selectedOrder.payment.transactionId && (
                      <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                        İşlem: {selectedOrder.payment.transactionId}
                      </p>
                    )}
                  </div>
                  <StatusBadge 
                    status={
                      selectedOrder.payment.status === 'paid' ? 'success' :
                      selectedOrder.payment.status === 'refunded' ? 'warning' :
                      selectedOrder.payment.status === 'failed' ? 'error' : 'pending'
                    }
                    text={
                      selectedOrder.payment.status === 'paid' ? 'Ödendi' :
                      selectedOrder.payment.status === 'refunded' ? 'İade Edildi' :
                      selectedOrder.payment.status === 'failed' ? 'Başarısız' : 'Bekliyor'
                    }
                  />
                </div>

                {(selectedOrder.payment.status === 'failed' || selectedOrder.status === 'payment_failed') && (selectedOrder.payment.errorMessage || selectedOrder.payment.errorCode || selectedOrder.payment.errorGroup) && (
                  <div className={`mt-3 p-3 rounded-lg border ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100'}`}>
                    <p className={`text-xs font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>Ödeme Hatası</p>
                    {selectedOrder.payment.errorMessage && (
                      <p className={`text-sm mt-1 break-words ${isDark ? 'text-neutral-200' : 'text-red-700'}`}>
                        {selectedOrder.payment.errorMessage}
                      </p>
                    )}
                    {(selectedOrder.payment.errorCode || selectedOrder.payment.errorGroup) && (
                      <p className={`text-xs mt-1 break-words ${isDark ? 'text-neutral-400' : 'text-red-600'}`}>
                        {selectedOrder.payment.errorCode ? `Kod: ${String(selectedOrder.payment.errorCode)}` : ''}
                        {selectedOrder.payment.errorCode && selectedOrder.payment.errorGroup ? ' • ' : ''}
                        {selectedOrder.payment.errorGroup ? `Grup: ${String(selectedOrder.payment.errorGroup)}` : ''}
                      </p>
                    )}
                  </div>
                )}

                {/* Manual Payment Verification for Credit Card */}
                {selectedOrder.payment?.method === 'credit_card' && selectedOrder.payment?.status !== 'paid' && selectedOrder.payment?.token && (
                  <div className={`mt-3 p-3 rounded-lg border ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                    <p className={`text-xs font-medium mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>🔍 Manuel Ödeme Doğrulama</p>
                    <p className={`text-xs mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                      Ödeme durumu belirsizse iyzico&apos;dan manuel olarak doğrulayabilirsiniz.
                    </p>
                    <button
                      onClick={async () => {
                        if (!confirm('iyzico\'dan ödeme durumunu sorgulamak istediğinize emin misiniz?')) return;
                        try {
                          const res = await fetch('/api/orders/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: selectedOrder.id }),
                          });
                          const data = await res.json();
                          if (data.success && data.verified) {
                            alert(`✅ Ödeme doğrulandı!\n\nÖdeme ID: ${data.iyzicoResult?.paymentId || '-'}\nTutar: ${data.iyzicoResult?.paidPrice || '-'} TL\nKart: **** ${data.iyzicoResult?.cardLast4 || '-'}`);
                            window.location.reload();
                          } else if (data.alreadyPaid) {
                            alert('ℹ️ Bu ödeme zaten onaylanmış.');
                            window.location.reload();
                          } else if (data.paymentFailed) {
                            alert(`❌ iyzico'da ödeme başarısız:\n\n${data.iyzicoResult?.errorMessage || 'Bilinmeyen hata'}`);
                          } else if (data.pending) {
                            alert(`⏳ Ödeme henüz tamamlanmamış:\n\nDurum: ${data.iyzicoResult?.paymentStatus || 'Belirsiz'}`);
                          } else {
                            alert(data.error || 'Bir hata oluştu');
                          }
                        } catch (err) {
                          console.error(err);
                          alert('Bir hata oluştu');
                        }
                      }}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <HiOutlineCurrencyDollar className="w-4 h-4" />
                      iyzico&apos;dan Ödeme Durumunu Sorgula
                    </button>
                  </div>
                )}

                {/* Manual Payment Confirmation (Without iyzico check) */}
                {selectedOrder.payment?.status !== 'paid' && (
                  <div className={`mt-3 p-3 rounded-lg border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                    <p className={`text-xs font-medium mb-2 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>✅ Manuel Ödeme Onayı</p>
                    <p className={`text-xs mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                      Ödemenin alındığından eminseniz, iyzico&apos;ya sormadan doğrudan onaylayabilirsiniz.
                    </p>
                    <button
                      onClick={async () => {
                        const confirmText = prompt('Ödemeyi manuel olarak onaylamak istediğinize emin misiniz?\n\nOnaylamak için "ONAYLA" yazın:');
                        if (confirmText !== 'ONAYLA') {
                          if (confirmText !== null) alert('İşlem iptal edildi. "ONAYLA" yazmanız gerekiyor.');
                          return;
                        }
                        try {
                          const res = await fetch('/api/orders/manual-confirm-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              orderId: selectedOrder.id,
                              note: 'Admin panelden manuel onay'
                            }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            alert(`✅ Ödeme manuel olarak onaylandı!\n\nSipariş #${data.order?.orderNumber || selectedOrder.orderNumber}`);
                            window.location.reload();
                          } else if (data.alreadyPaid) {
                            alert('ℹ️ Bu ödeme zaten onaylanmış.');
                            window.location.reload();
                          } else {
                            alert(data.error || 'Bir hata oluştu');
                          }
                        } catch (err) {
                          console.error(err);
                          alert('Bir hata oluştu');
                        }
                      }}
                      className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <HiOutlineCheckCircle className="w-4 h-4" />
                      Ödemeyi Manuel Onayla
                    </button>
                  </div>
                )}
              </div>
              )}

              {/* Bank Transfer Payment Confirmation */}
              {selectedOrder.payment?.method === 'bank_transfer' && selectedOrder.payment?.status !== 'paid' && (
                <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                  <p className={`text-sm font-medium mb-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>🏦 Havale Ödeme Onayı</p>
                  <p className={`text-xs mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                    Müşteriden havale ödemesi alındıysa aşağıdaki butona tıklayarak onaylayın. Onay sonrası müşteriye sipariş onay e-postası gönderilecektir.
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/orders/confirm-bank-payment', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ orderId: selectedOrder.id }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          setSelectedOrder(prev => prev ? {
                            ...prev,
                            status: 'confirmed',
                            payment: { ...prev.payment!, status: 'paid', paidAt: new Date().toISOString() },
                            timeline: [
                              ...prev.timeline,
                              { status: 'confirmed', timestamp: new Date().toISOString(), note: 'Havale ödemesi onaylandı' }
                            ]
                          } : null);
                          alert('Ödeme onaylandı ve müşteriye bildirim gönderildi!');
                          window.location.reload();
                        } else {
                          alert(data.error || 'Bir hata oluştu');
                        }
                      } catch (err) {
                        console.error(err);
                        alert('Bir hata oluştu');
                      }
                    }}
                    className="w-full px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <HiOutlineCheckCircle className="w-5 h-5" />
                    Havale Ödemesini Onayla
                  </button>
                </div>
              )}

              {/* Timeline */}
              {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
              <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Sipariş Geçmişi</p>
                <div className="space-y-3">
                  {selectedOrder.timeline.map((entry, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${
                        entry.status === 'delivered' ? 'bg-emerald-400' :
                        entry.status === 'cancelled' ? 'bg-red-400' :
                        entry.status === 'shipped' ? 'bg-purple-400' :
                        entry.status === 'awaiting_payment' ? 'bg-amber-400' :
                        entry.status === 'confirmed' ? 'bg-emerald-400' :
                        'bg-blue-400'
                      }`} />
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                          {statusConfig[entry.status]?.label || entry.status || 'Bilinmiyor'}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                          {formatDate(entry.timestamp)}
                        </p>
                        {entry.note && (
                          <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                            {entry.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Status Update Buttons */}
              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                <div>
                  <p className={`text-sm font-medium mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Durum Güncelle</p>
                  <div className="grid grid-cols-2 gap-2">
                    {getNextStatus(selectedOrder.status) && (
                      <button
                        onClick={() => {
                          const next = getNextStatus(selectedOrder.status);
                          if (next) {
                            handleUpdateStatus(selectedOrder.id, next.status, next.label);
                          }
                        }}
                        className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                          selectedOrder.status === 'pending' ? 'bg-emerald-500 text-white hover:bg-emerald-600' :
                          selectedOrder.status === 'confirmed' ? 'bg-blue-500 text-white hover:bg-blue-600' :
                          selectedOrder.status === 'processing' ? 'bg-purple-500 text-white hover:bg-purple-600' :
                          'bg-emerald-500 text-white hover:bg-emerald-600'
                        }`}
                      >
                        {getNextStatus(selectedOrder.status)?.label}
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled', 'Admin tarafından iptal edildi')}
                      className="px-4 py-2.5 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-colors"
                    >
                      İptal Et
                    </button>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div className={`mt-4 pt-4 border-t ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                  <p className={`text-sm font-medium mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Notlar</p>
                  <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{selectedOrder.notes}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
