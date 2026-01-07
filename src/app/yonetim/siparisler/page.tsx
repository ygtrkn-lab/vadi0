'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { SpotlightCard, FadeContent, StatusBadge } from '@/components/admin';
import { useTheme } from '../ThemeContext';
import { useOrder, Order, OrderStatus } from '@/context/OrderContext';
import { useCustomer } from '@/context/CustomerContext';
import OrderPrintTemplate from '@/components/OrderPrintTemplate';
import { openPrintableWindow, downloadPdfClientSide } from '@/lib/print';

import { 
  HiOutlineSearch, 
  HiOutlineCurrencyDollar,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineClipboardList,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker,
  HiOutlineRefresh,
  HiOutlinePrinter,
  HiOutlineDownload,
  HiOutlineCalendar
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  
  const { isDark } = useTheme();
  const { state: orderState, updateOrderStatus } = useOrder();
  const { getCustomerById } = useCustomer();

  const itemsPerPage = 10;

  // Filtreleme mantığı - Takvimsel gün seçimi ile
  const filteredOrders = useMemo(() => {
    return orderState.orders
      .filter(order => {
        // Durum filtresi
        let matchesStatus = selectedStatus === 'all';
        if (selectedStatus === 'processing') {
          matchesStatus = order.status === 'processing' || order.status === 'confirmed';
        } else if (selectedStatus !== 'all') {
          matchesStatus = order.status === selectedStatus;
        }
        
        // Arama filtresi
        const customerName = order.customerName || '';
        const customerEmail = order.customerEmail || '';
        const matchesSearch = 
          customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.orderNumber.toString().includes(searchTerm) ||
          customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Takvimsel tarih filtresi - Seçilen güne ait siparişleri göster
        let matchesDate = true;
        if (selectedDate) {
          const orderDate = new Date(order.createdAt);
          const selectedDateStr = selectedDate.toISOString().split('T')[0];
          const orderDateStr = orderDate.toISOString().split('T')[0];
          matchesDate = orderDateStr === selectedDateStr;
        }
        
        return matchesStatus && matchesSearch && matchesDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orderState.orders, selectedStatus, searchTerm, selectedDate]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredOrders, currentPage, itemsPerPage]);

  const stats = useMemo(() => {
    const orders = orderState.orders;
    
    // Ar-Ge için önemli metrikler
    const paidOrders = orders.filter(o => o.payment?.status === 'paid');
    const failedOrders = orders.filter(o => 
      o.status === 'payment_failed' || 
      o.status === 'cancelled' || 
      o.payment?.status === 'failed'
    );
    
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing' || o.status === 'confirmed').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      
      // Ar-Ge Metrikleri
      totalSales: paidOrders.reduce((sum, o) => sum + o.total, 0),
      totalFailed: failedOrders.length,
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Glassmorphism Header */}
      <FadeContent direction="up" delay={0}>
        <div className={`p-6 rounded-3xl backdrop-blur-xl ${
          isDark 
            ? 'bg-white/[0.03] border border-white/[0.08]' 
            : 'bg-white/60 border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-baseline gap-4">
              <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Siparişler
              </h1>
              <span className={`text-lg font-medium tabular-nums ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                {filteredOrders.length}
              </span>
            </div>
            
            {/* Ar-Ge Stats - Glassmorphism Pills */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl backdrop-blur-md ${
                isDark ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20' : 'bg-emerald-50/80 ring-1 ring-emerald-200/50'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-emerald-400/70' : 'text-emerald-600/70'}`}>Satış</span>
                <span className={`text-base font-bold tabular-nums ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  {formatPrice(stats.totalSales)}
                </span>
              </div>
              
              {stats.totalFailed > 0 && (
                <div className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl backdrop-blur-md ${
                  isDark ? 'bg-red-500/10 ring-1 ring-red-500/20' : 'bg-red-50/80 ring-1 ring-red-200/50'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-red-400/70' : 'text-red-600/70'}`}>Başarısız</span>
                  <span className={`text-base font-bold tabular-nums ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                    {stats.totalFailed}
                  </span>
                </div>
              )}

              <button
                onClick={() => window.location.reload()}
                className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${
                  isDark 
                    ? 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 ring-1 ring-white/10' 
                    : 'bg-black/5 text-gray-400 hover:text-gray-900 hover:bg-black/10 ring-1 ring-black/5'
                }`}
                title="Yenile"
              >
                <HiOutlineRefresh className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </FadeContent>

      {/* Glassmorphism Filter Bar */}
      <FadeContent direction="up" delay={0.1}>
        <div className={`p-4 rounded-2xl backdrop-blur-xl ${
          isDark 
            ? 'bg-white/[0.02] border border-white/[0.06]' 
            : 'bg-white/50 border border-white/40 shadow-[0_4px_24px_rgba(0,0,0,0.04)]'
        }`}>
          <div className="flex flex-col lg:flex-row gap-3">
          {/* Takvimsel Gün Seçici */}
          <div className="relative">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all backdrop-blur-md ${
                selectedDate
                  ? (isDark ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30' : 'bg-purple-100/80 text-purple-700 ring-1 ring-purple-200')
                  : (isDark ? 'bg-white/5 text-neutral-300 hover:bg-white/10 ring-1 ring-white/10' : 'bg-black/5 text-gray-700 hover:bg-black/10 ring-1 ring-black/5')
              }`}
            >
              <HiOutlineCalendar className="w-4 h-4" />
              <span className="font-medium">
                {selectedDate 
                  ? `${selectedDate.getDate()} ${TURKISH_MONTHS[selectedDate.getMonth()]}` 
                  : 'Tüm Günler'
                }
              </span>
              {selectedDate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(null);
                    setCurrentPage(1);
                  }}
                  className={`ml-1 rounded-lg p-1 ${isDark ? 'hover:bg-purple-500/30' : 'hover:bg-purple-200'}`}
                >
                  <HiOutlineX className="w-3.5 h-3.5" />
                </button>
              )}
            </button>

            {/* Mini Calendar Dropdown - Glassmorphism */}
            <AnimatePresence>
              {showCalendar && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowCalendar(false)}
                    className="fixed inset-0 z-40"
                    style={{ background: 'transparent' }}
                  />
                  
                  {/* Calendar - Glassmorphism */}
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                    className={`absolute top-full left-0 mt-2 rounded-2xl border backdrop-blur-xl shadow-2xl z-50 w-72 ${
                      isDark ? 'bg-neutral-900/90 border-white/10' : 'bg-white/90 border-white/50 shadow-[0_16px_48px_rgba(0,0,0,0.15)]'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Calendar Header */}
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            const prev = new Date(calendarMonth);
                            prev.setMonth(prev.getMonth() - 1);
                            setCalendarMonth(prev);
                          }}
                          className={`p-1.5 rounded-md transition-colors ${
                            isDark ? 'hover:bg-neutral-800 text-neutral-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'
                          }`}
                        >
                          <HiOutlineChevronLeft className="w-4 h-4" />
                        </button>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {TURKISH_MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                        </span>
                        <button
                          onClick={() => {
                            const next = new Date(calendarMonth);
                            next.setMonth(next.getMonth() + 1);
                            setCalendarMonth(next);
                          }}
                          className={`p-1.5 rounded-md transition-colors ${
                            isDark ? 'hover:bg-neutral-800 text-neutral-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'
                          }`}
                        >
                          <HiOutlineChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Calendar Grid - Compact */}
                    <div className="p-3">
                      {/* Day Headers */}
                      <div className="grid grid-cols-7 gap-0 mb-1">
                        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cts', 'Paz'].map(day => (
                          <div key={day} className={`text-center text-[10px] font-medium py-1.5 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`}>
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Days Grid */}
                      <div className="grid grid-cols-7 gap-0">
                        {(() => {
                          const year = calendarMonth.getFullYear();
                          const month = calendarMonth.getMonth();
                          const firstDay = new Date(year, month, 1).getDay();
                          const daysInMonth = new Date(year, month + 1, 0).getDate();
                          const days = [];
                          const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
                          
                          // Empty cells for days before month starts
                          for (let i = 0; i < adjustedFirstDay; i++) {
                            days.push(<div key={`empty-${i}`} />);
                          }
                          
                          // Days of month
                          const today = new Date();
                          for (let day = 1; day <= daysInMonth; day++) {
                            const date = new Date(year, month, day);
                            const isSelected = selectedDate && 
                              date.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];
                            const isToday = date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
                            
                            days.push(
                              <button
                                key={day}
                                onClick={() => {
                                  setSelectedDate(date);
                                  setShowCalendar(false);
                                  setCurrentPage(1);
                                }}
                                className={`aspect-square rounded-lg text-xs font-medium transition-colors ${
                                  isSelected
                                    ? (isDark ? 'bg-white text-black' : 'bg-gray-900 text-white')
                                    : isToday
                                    ? (isDark ? 'bg-neutral-800 text-white ring-1 ring-neutral-700' : 'bg-gray-100 text-gray-900 ring-1 ring-gray-300')
                                    : (isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
                                }`}
                              >
                                {day}
                              </button>
                            );
                          }
                          
                          return days;
                        })()}
                      </div>
                      
                      {/* Quick Actions - Minimal */}
                      <div className={`flex items-center gap-1.5 mt-2 pt-2 border-t ${isDark ? 'border-neutral-800' : 'border-gray-100'}`}>
                        <button
                          onClick={() => {
                            const today = new Date();
                            setSelectedDate(today);
                            setCalendarMonth(today);
                            setShowCalendar(false);
                            setCurrentPage(1);
                          }}
                          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            isDark ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
                          }`}
                        >
                          Bugün
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDate(null);
                            setShowCalendar(false);
                            setCurrentPage(1);
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isDark ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
                          }`}
                        >
                          Temizle
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Ayırıcı */}
          <div className={`hidden lg:block w-px h-8 self-center ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

          {/* Durum Filtreleri - Glassmorphism Pills */}
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            {[
              { status: 'all', label: 'Tümü', count: stats.total },
              { status: 'pending', label: 'Beklemede', count: stats.pending },
              { status: 'processing', label: 'Hazırlanıyor', count: stats.processing },
              { status: 'delivered', label: 'Teslim', count: stats.delivered },
              { status: 'cancelled', label: 'İptal', count: stats.cancelled },
            ].map((item) => (
              <button
                key={item.status}
                onClick={() => { setSelectedStatus(item.status); setCurrentPage(1); }}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all backdrop-blur-md ${
                  selectedStatus === item.status
                    ? (isDark ? 'bg-white/15 text-white ring-1 ring-white/20' : 'bg-black/10 text-gray-900 ring-1 ring-black/10')
                    : (isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-black/5')
                }`}
              >
                {item.label}
                {item.count > 0 && (
                  <span className={`ml-1.5 text-xs tabular-nums ${
                    selectedStatus === item.status 
                      ? (isDark ? 'text-white/60' : 'text-gray-500') 
                      : (isDark ? 'text-neutral-600' : 'text-gray-400')
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Arama - Glassmorphism */}
          <div className="relative w-72">
            <HiOutlineSearch className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Sipariş ara..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl transition-all focus:outline-none backdrop-blur-md ${
                isDark 
                  ? 'bg-white/5 text-white placeholder-neutral-500 focus:bg-white/10 ring-1 ring-white/10 focus:ring-white/20' 
                  : 'bg-black/5 text-gray-900 placeholder-gray-400 focus:bg-black/10 ring-1 ring-black/5 focus:ring-black/10'
              }`}
            />
            {searchTerm && (
              <button 
                onClick={() => { setSearchTerm(''); setCurrentPage(1); }} 
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-neutral-500 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        </div>
      </FadeContent>

      {/* Modern Orders Grid */}
      {orderState.isLoading ? (
        <FadeContent direction="up" delay={0.2}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`p-5 rounded-2xl border animate-pulse ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
                <div className={`h-4 w-32 rounded mb-3 ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`} />
                <div className={`h-3 w-2/3 rounded ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`} />
              </div>
            ))}
          </div>
        </FadeContent>
      ) : paginatedOrders.length > 0 ? (
        <FadeContent direction="up" delay={0.2}>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {paginatedOrders.map((order, index) => {
              const customer = order.customerId ? getCustomerById(order.customerId) : undefined;
              const displayCustomerName = (order.customerName || '').trim() || customer?.name || 'Misafir';
              const paymentStatus = order.payment?.status?.toLowerCase();

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.03, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  onClick={() => setSelectedOrder(order)}
                  className="cursor-pointer group"
                >
                  {/* Glassmorphism Card - Apple/Dribbble Style */}
                  <div className={`relative overflow-hidden rounded-3xl transition-all duration-500 backdrop-blur-xl ${
                    isDark 
                      ? 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] shadow-[0_8px_32px_rgba(0,0,0,0.3)]' 
                      : 'bg-white/70 hover:bg-white/90 border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)]'
                  }`}>
                    
                    {/* Glow Effect on Hover */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
                      order.status === 'delivered' ? 'bg-linear-to-br from-emerald-500/10 to-transparent' :
                      order.status === 'shipped' ? 'bg-linear-to-br from-blue-500/10 to-transparent' :
                      order.status === 'processing' || order.status === 'confirmed' ? 'bg-linear-to-br from-purple-500/10 to-transparent' :
                      order.status === 'pending' ? 'bg-linear-to-br from-amber-500/10 to-transparent' :
                      order.status === 'cancelled' ? 'bg-linear-to-br from-red-500/10 to-transparent' :
                      'bg-linear-to-br from-gray-500/10 to-transparent'
                    }`} />

                    <div className="relative p-5">
                      {/* Header: Status Badge + Price */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex flex-col gap-2">
                          <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            #{order.orderNumber}
                          </span>
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md ${
                            order.status === 'delivered' ? (isDark ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30' : 'bg-emerald-100/80 text-emerald-700 ring-1 ring-emerald-200') :
                            order.status === 'shipped' ? (isDark ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30' : 'bg-blue-100/80 text-blue-700 ring-1 ring-blue-200') :
                            order.status === 'processing' || order.status === 'confirmed' ? (isDark ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30' : 'bg-purple-100/80 text-purple-700 ring-1 ring-purple-200') :
                            order.status === 'pending' ? (isDark ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30' : 'bg-amber-100/80 text-amber-700 ring-1 ring-amber-200') :
                            order.status === 'cancelled' ? (isDark ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30' : 'bg-red-100/80 text-red-700 ring-1 ring-red-200') :
                            (isDark ? 'bg-neutral-500/20 text-neutral-300 ring-1 ring-neutral-500/30' : 'bg-gray-100/80 text-gray-700 ring-1 ring-gray-200')
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              order.status === 'delivered' ? 'bg-emerald-400' :
                              order.status === 'shipped' ? 'bg-blue-400' :
                              order.status === 'processing' || order.status === 'confirmed' ? 'bg-purple-400' :
                              order.status === 'pending' ? 'bg-amber-400' :
                              order.status === 'cancelled' ? 'bg-red-400' :
                              'bg-gray-400'
                            }`} />
                            {statusConfig[order.status]?.label || 'Bilinmiyor'}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-2xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatPrice(order.total)}
                          </span>
                          {paymentStatus === 'paid' && (
                            <p className={`text-[10px] font-medium uppercase tracking-wider mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              ✓ Ödendi
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className={`flex items-center gap-3 p-3 rounded-2xl mb-4 ${
                        isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'
                      }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold bg-linear-to-br ${
                          isDark ? 'from-purple-500/30 to-pink-500/30 text-white' : 'from-purple-100 to-pink-100 text-purple-700'
                        }`}>
                          {displayCustomerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {displayCustomerName}
                          </p>
                          {order.delivery?.deliveryDate && (
                            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                              📅 {formatDeliveryDateFriendly(order.delivery.deliveryDate, order.delivery.deliveryTimeSlot)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Products Preview */}
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                          {order.products.slice(0, 3).map((p, idx) => (
                            <div
                              key={idx}
                              className={`relative w-12 h-12 rounded-2xl overflow-hidden ring-2 shadow-lg transition-transform group-hover:scale-105 ${
                                isDark ? 'ring-white/10' : 'ring-white'
                              }`}
                              style={{ zIndex: 3 - idx }}
                            >
                              {p.image ? (
                                <Image src={p.image} alt={p.name} fill className="object-cover" unoptimized />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center text-lg ${
                                  isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-gray-100 text-gray-400'
                                }`}>
                                  🌸
                                </div>
                              )}
                            </div>
                          ))}
                          {order.products.length > 3 && (
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-bold ring-2 backdrop-blur-md ${
                              isDark ? 'bg-white/10 text-white ring-white/10' : 'bg-black/5 text-gray-700 ring-white'
                            }`}>
                              +{order.products.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isDark ? 'text-neutral-200' : 'text-gray-700'}`}>
                            {order.products[0]?.name}
                          </p>
                          {order.products.length > 1 && (
                            <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                              +{order.products.length - 1} ürün daha
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quick Action Button - Hover'da görünür */}
                      {getNextStatus(order.status) && (
                        <motion.button
                          initial={{ opacity: 0, y: 8 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(order.id, getNextStatus(order.status)!.status);
                          }}
                          className={`w-full mt-4 py-2.5 rounded-xl text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-md ${
                            isDark 
                              ? 'bg-white/10 hover:bg-white/20 text-white ring-1 ring-white/20' 
                              : 'bg-black/5 hover:bg-black/10 text-gray-900 ring-1 ring-black/10'
                          }`}
                        >
                          {getNextStatus(order.status)!.label} →
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </FadeContent>
      ) : null}

      {/* Empty State */}
      {!orderState.isLoading && filteredOrders.length === 0 && (
        <FadeContent direction="up" delay={0.2}>
          <div className="text-center py-16">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4
              ${isDark ? 'bg-neutral-800/50' : 'bg-gray-100'}`}>
              <HiOutlineClipboardList className={`w-10 h-10 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Sipariş bulunamadı
            </h3>
            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Arama veya filtre kriterlerinize uygun sipariş yok
            </p>
            {(searchTerm || selectedDate || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDate(null);
                  setSelectedStatus('all');
                  setCurrentPage(1);
                }}
                className={`mt-4 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isDark ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        </FadeContent>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <FadeContent direction="up" delay={0.3}>
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl ${
            isDark ? 'bg-neutral-900/50 border border-neutral-800' : 'bg-white border border-gray-200 shadow-sm'
          }`}>
            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
              Sayfa <span className="font-semibold">{currentPage}</span> / <span className="font-semibold">{totalPages}</span>
              <span className={`ml-2 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                ({filteredOrders.length} sipariş)
              </span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`p-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105
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
                    className={`min-w-11 h-11 px-3 rounded-xl font-semibold transition-all hover:scale-105
                      ${currentPage === page 
                        ? (isDark ? 'bg-purple-500 text-white' : 'bg-purple-600 text-white shadow-lg shadow-purple-500/30')
                        : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`p-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105
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
            className="fixed inset-0 z-100 flex items-center justify-center p-4"
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { if (printRef.current) openPrintableWindow(printRef.current) }}
                    className={`p-2 rounded-xl transition-colors
                      ${isDark 
                        ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' 
                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    title="Yazdır"
                  >
                    <HiOutlinePrinter className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => { if (printRef.current) downloadPdfClientSide(printRef.current, `siparis-${selectedOrder?.orderNumber || 'order'}.pdf`) }}
                    className={`p-2 rounded-xl transition-colors
                      ${isDark 
                        ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' 
                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    title="PDF indir"
                  >
                    <HiOutlineDownload className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setSelectedOrder(null)}
                    className={`p-2 rounded-xl transition-colors
                      ${isDark 
                        ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' 
                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    title="Kapat"
                  >
                    <HiOutlineX className="w-5 h-5" />
                  </button>
                </div>
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
                      <HiOutlineLocationMarker className="w-4 h-4 mt-0.5 shrink-0" />
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
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-linear-to-br from-gray-100 to-gray-200">
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
                      <p className={`text-sm mt-1 wrap-break-word ${isDark ? 'text-neutral-200' : 'text-red-700'}`}>
                        {selectedOrder.payment.errorMessage}
                      </p>
                    )}
                    {(selectedOrder.payment.errorCode || selectedOrder.payment.errorGroup) && (
                      <p className={`text-xs mt-1 wrap-break-word ${isDark ? 'text-neutral-400' : 'text-red-600'}`}>
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

              {/* Hidden printable template (off-screen) */}
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: 800 }} aria-hidden>
                <OrderPrintTemplate ref={printRef} order={selectedOrder} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
