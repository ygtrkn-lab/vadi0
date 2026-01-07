'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { SpotlightCard, FadeContent, StatusBadge } from '@/components/admin';
import { useTheme } from '../ThemeContext';
import { useOrder, Order, OrderStatus } from '@/context/OrderContext';
import { useCustomer } from '@/context/CustomerContext';
import OrderPrintTemplate from '@/components/OrderPrintTemplate';
import { openPrintableWindow, downloadPdfClientSide } from '@/lib/print';
import '@/styles/admin-modern.css';

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

// Sipariş tarihini formatlama: "Bugün, 15:30" veya "3 Ocak Perşembe, 14:20"
function formatOrderDate(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    const orderDate = new Date(dateStr);
    if (isNaN(orderDate.getTime())) return dateStr;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
    const diffDays = Math.floor((today.getTime() - orderDay.getTime()) / (1000 * 60 * 60 * 24));
    
    const hours = orderDate.getHours().toString().padStart(2, '0');
    const minutes = orderDate.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    if (diffDays === 0) {
      return `Bugün, ${timeStr}`;
    } else if (diffDays === 1) {
      return `Dün, ${timeStr}`;
    } else {
      const dayName = TURKISH_DAYS[orderDate.getDay()];
      const monthName = TURKISH_MONTHS[orderDate.getMonth()];
      const dayOfMonth = orderDate.getDate();
      return `${dayOfMonth} ${monthName} ${dayName}, ${timeStr}`;
    }
  } catch {
    return dateStr;
  }
}

// Tarih grup başlığı: "Bugün (7 Ocak 2026)" veya "3 Ocak Perşembe"
function getDateGroupLabel(dateStr: string): string {
  try {
    const orderDate = new Date(dateStr);
    if (isNaN(orderDate.getTime())) return '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
    const diffDays = Math.floor((today.getTime() - orderDay.getTime()) / (1000 * 60 * 60 * 24));
    
    const dayName = TURKISH_DAYS[orderDate.getDay()];
    const monthName = TURKISH_MONTHS[orderDate.getMonth()];
    const dayOfMonth = orderDate.getDate();
    const year = orderDate.getFullYear();
    const fullDate = `${dayOfMonth} ${monthName} ${year}`;
    
    if (diffDays === 0) {
      return `Bugün (${fullDate})`;
    } else if (diffDays === 1) {
      return `Dün (${fullDate})`;
    } else if (diffDays === 2) {
      return `Önceki Gün (${fullDate})`;
    } else {
      return `${dayOfMonth} ${monthName} ${dayName}`;
    }
  } catch {
    return '';
  }
}

export default function SiparislerPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const printRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  
  const { isDark } = useTheme();
  const { state: orderState, updateOrderStatus } = useOrder();
  const { getCustomerById } = useCustomer();

  const itemsPerPage = 10;

  // Portal için mount check
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filtreleme mantığı - Takvimsel gün seçimi ile
  const filteredOrders = useMemo(() => {
    return orderState.orders
      .filter(order => {
        // Durum filtresi
        let matchesStatus = selectedStatus === 'all';
        if (selectedStatus === 'processing') {
          matchesStatus = order.status === 'processing' || order.status === 'confirmed';
        } else if (selectedStatus === 'payment_failed') {
          // Başarısız ödemeleri filtrele
          matchesStatus = order.status === 'payment_failed' || 
                          order.status === 'cancelled' || 
                          order.payment?.status === 'failed';
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

  // Siparişleri tarihe göre grupla
  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: Order[] } = {};
    
    paginatedOrders.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(order);
    });
    
    return Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }, [paginatedOrders]);

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
                <button
                  onClick={() => { setSelectedStatus('payment_failed'); setCurrentPage(1); }}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl backdrop-blur-md transition-all cursor-pointer hover:scale-105 ${
                    selectedStatus === 'payment_failed'
                      ? (isDark ? 'bg-red-500/20 ring-2 ring-red-500/40' : 'bg-red-100 ring-2 ring-red-300')
                      : (isDark ? 'bg-red-500/10 ring-1 ring-red-500/20 hover:bg-red-500/15' : 'bg-red-50/80 ring-1 ring-red-200/50 hover:bg-red-100')
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-red-400/70' : 'text-red-600/70'}`}>Başarısız</span>
                  <span className={`text-base font-bold tabular-nums ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                    {stats.totalFailed}
                  </span>
                </button>
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
          <div className={`relative ${showCalendar ? 'z-[1000000]' : 'z-50'}`}>
            <button
              ref={calendarButtonRef}
              onClick={() => {
                if (calendarButtonRef.current) {
                  const rect = calendarButtonRef.current.getBoundingClientRect();
                  setCalendarPosition({ top: rect.bottom + 8, left: rect.left });
                }
                setShowCalendar(!showCalendar);
              }}
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

            {/* Mini Calendar Dropdown - Portal ile body'ye render */}
            {isMounted && showCalendar && createPortal(
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowCalendar(false)}
                  className="fixed inset-0 z-[999998]"
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                />
                
                {/* Calendar - Fixed position at button */}
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{ top: calendarPosition.top, left: calendarPosition.left }}
                  className={`fixed rounded-2xl border backdrop-blur-xl shadow-2xl z-[999999] w-72 ${
                    isDark ? 'bg-neutral-900/95 border-white/10' : 'bg-white/95 border-white/50 shadow-[0_16px_48px_rgba(0,0,0,0.15)]'
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
              </>,
              document.body
            )}
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

      {/* Modern Orders Grid with Date Groups */}
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
          <div className="space-y-8">
            {groupedOrders.map(([dateKey, orders], groupIndex) => (
              <div key={dateKey}>
                {/* Date Group Header */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: groupIndex * 0.05, duration: 0.4 }}
                  className={`mb-5 pb-3 border-b-2 ${
                    isDark 
                      ? 'border-white/10' 
                      : 'border-black/5'
                  }`}
                >
                  <h3 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isDark ? 'bg-purple-400' : 'bg-purple-600'
                    }`} />
                    {getDateGroupLabel(dateKey)}
                    <span className={`text-sm font-medium ${
                      isDark ? 'text-neutral-500' : 'text-gray-400'
                    }`}>
                      ({orders.length} sipariş)
                    </span>
                  </h3>
                </motion.div>

                {/* Orders Grid for this date */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 grid-auto-rows-fr">
                  {orders.map((order, index) => {
                    const customer = order.customerId ? getCustomerById(order.customerId) : undefined;
              const displayCustomerName = (order.customerName || '').trim() || customer?.name || 'Misafir';
              const paymentStatus = order.payment?.status?.toLowerCase();

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.025, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setSelectedOrder(order)}
                  className="cursor-pointer group h-full"
                >
                  {/* Premium Card - Modern Design System */}
                  <div className={`relative overflow-hidden rounded-[24px] transition-all duration-700 ease-out backdrop-blur-2xl group-hover:-translate-y-1 h-full flex flex-col ${
                    isDark 
                      ? 'bg-gradient-to-br from-white/[0.07] to-white/[0.02] hover:from-white/[0.12] hover:to-white/[0.04] border border-white/[0.12] hover:border-white/[0.2] shadow-[0_4px_24px_rgba(0,0,0,0.25),0_1px_2px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_4px_12px_rgba(0,0,0,0.3)]' 
                      : 'bg-gradient-to-br from-white via-white/95 to-white/80 hover:from-white hover:to-white/95 border border-black/[0.06] hover:border-black/[0.12] shadow-[0_2px_16px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]'
                  }`}>
                    
                    {/* Subtle Gradient Overlay */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none ${
                      order.status === 'delivered' ? 'bg-gradient-to-br from-emerald-500/[0.08] via-emerald-400/[0.04] to-transparent' :
                      order.status === 'shipped' ? 'bg-gradient-to-br from-blue-500/[0.08] via-blue-400/[0.04] to-transparent' :
                      order.status === 'processing' || order.status === 'confirmed' ? 'bg-gradient-to-br from-purple-500/[0.08] via-purple-400/[0.04] to-transparent' :
                      order.status === 'pending' ? 'bg-gradient-to-br from-amber-500/[0.08] via-amber-400/[0.04] to-transparent' :
                      order.status === 'cancelled' ? 'bg-gradient-to-br from-red-500/[0.08] via-red-400/[0.04] to-transparent' :
                      'bg-gradient-to-br from-gray-500/[0.08] via-gray-400/[0.04] to-transparent'
                    }`} />
                    
                    {/* Ambient Border Glow */}
                    <div className={`absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none ${
                      order.status === 'delivered' ? 'shadow-[inset_0_0_20px_rgba(16,185,129,0.15)]' :
                      order.status === 'shipped' ? 'shadow-[inset_0_0_20px_rgba(59,130,246,0.15)]' :
                      order.status === 'processing' || order.status === 'confirmed' ? 'shadow-[inset_0_0_20px_rgba(168,85,247,0.15)]' :
                      order.status === 'pending' ? 'shadow-[inset_0_0_20px_rgba(245,158,11,0.15)]' :
                      order.status === 'cancelled' ? 'shadow-[inset_0_0_20px_rgba(239,68,68,0.15)]' :
                      'shadow-[inset_0_0_20px_rgba(156,163,175,0.15)]'
                    }`} />

                    <div className="relative p-6 flex-1 flex flex-col">
                      {/* Header: Order Number + Status + Order Date */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-[22px] font-semibold tracking-[-0.02em] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              #{order.orderNumber}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10.5px] font-semibold uppercase tracking-[0.08em] backdrop-blur-xl transition-all duration-300 ${
                              order.status === 'delivered' ? (isDark ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-300 ring-1 ring-emerald-400/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]' : 'bg-gradient-to-r from-emerald-50 to-emerald-100/80 text-emerald-700 ring-1 ring-emerald-200/50 shadow-sm') :
                              order.status === 'shipped' ? (isDark ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 ring-1 ring-blue-400/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]' : 'bg-gradient-to-r from-blue-50 to-blue-100/80 text-blue-700 ring-1 ring-blue-200/50 shadow-sm') :
                              order.status === 'processing' || order.status === 'confirmed' ? (isDark ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 ring-1 ring-purple-400/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]' : 'bg-gradient-to-r from-purple-50 to-purple-100/80 text-purple-700 ring-1 ring-purple-200/50 shadow-sm') :
                              order.status === 'pending' ? (isDark ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 ring-1 ring-amber-400/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]' : 'bg-gradient-to-r from-amber-50 to-amber-100/80 text-amber-700 ring-1 ring-amber-200/50 shadow-sm') :
                              order.status === 'cancelled' ? (isDark ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 ring-1 ring-red-400/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]' : 'bg-gradient-to-r from-red-50 to-red-100/80 text-red-700 ring-1 ring-red-200/50 shadow-sm') :
                              (isDark ? 'bg-gradient-to-r from-neutral-500/20 to-neutral-600/20 text-neutral-300 ring-1 ring-neutral-400/30' : 'bg-gradient-to-r from-gray-50 to-gray-100/80 text-gray-700 ring-1 ring-gray-200/50 shadow-sm')
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                order.status === 'delivered' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
                                order.status === 'shipped' ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]' :
                                order.status === 'processing' || order.status === 'confirmed' ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]' :
                                order.status === 'pending' ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]' :
                                order.status === 'cancelled' ? 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                                'bg-gray-400'
                              }`} />
                              {statusConfig[order.status]?.label || 'Bilinmiyor'}
                            </div>
                            <p className={`text-[11px] font-medium flex items-center gap-1.5 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatOrderDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5">
                          <span className={`text-[26px] font-bold tabular-nums tracking-[-0.02em] ${
                            isDark ? 'bg-gradient-to-br from-white to-white/80 bg-clip-text text-transparent' : 'text-gray-900'
                          }`}>
                            {formatPrice(order.total)}
                          </span>
                          {paymentStatus === 'paid' && (
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${
                              isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              <span className="text-[8px]">✓</span> Ödendi
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className={`flex items-center gap-3.5 p-4 rounded-[18px] mb-4 backdrop-blur-sm transition-all duration-300 ${
                        isDark ? 'bg-white/[0.04] hover:bg-white/[0.06] ring-1 ring-white/[0.06]' : 'bg-black/[0.02] hover:bg-black/[0.03] ring-1 ring-black/[0.04]'
                      }`}>
                        <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center text-[15px] font-bold bg-gradient-to-br shadow-lg transition-transform group-hover:scale-105 ${
                          isDark ? 'from-purple-500/40 via-purple-400/30 to-pink-500/40 text-white shadow-purple-500/20' : 'from-purple-100 via-purple-50 to-pink-100 text-purple-700 shadow-purple-200/50'
                        }`}>
                          {displayCustomerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[14px] font-semibold truncate tracking-[-0.01em] mb-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {displayCustomerName}
                          </p>
                          {order.delivery?.deliveryDate && (
                            <p className={`text-[11.5px] font-medium flex items-center gap-1.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                              <span className="text-[13px]">📅</span>
                              {formatDeliveryDateFriendly(order.delivery.deliveryDate, order.delivery.deliveryTimeSlot)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Products Preview */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex -space-x-4">
                          {order.products.slice(0, 3).map((p, idx) => (
                            <motion.div
                              key={idx}
                              whileHover={{ scale: 1.15, zIndex: 10 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                              className={`relative w-16 h-16 rounded-[16px] overflow-hidden ring-[3px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 ${
                                isDark ? 'ring-black/40 hover:ring-white/20' : 'ring-white hover:ring-black/10'
                              }`}
                              style={{ zIndex: 3 - idx }}
                            >
                              {p.image ? (
                                <Image src={p.image} alt={p.name} fill className="object-cover transition-transform duration-300 group-hover:scale-110" unoptimized />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center text-2xl backdrop-blur-sm ${
                                  isDark ? 'bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-500' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400'
                                }`}>
                                  🌸
                                </div>
                              )}
                            </motion.div>
                          ))}
                          {order.products.length > 3 && (
                            <div className={`w-16 h-16 rounded-[16px] flex items-center justify-center text-[12px] font-bold ring-[3px] backdrop-blur-xl shadow-lg transition-all duration-300 ${
                              isDark ? 'bg-gradient-to-br from-white/15 to-white/5 text-white ring-white/15 hover:ring-white/25' : 'bg-gradient-to-br from-black/8 to-black/4 text-gray-700 ring-white hover:ring-black/15'
                            }`}>
                              +{order.products.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[15px] font-semibold truncate tracking-[-0.01em] mb-1 ${isDark ? 'text-white/90' : 'text-gray-800'}`}>
                            {order.products[0]?.name}
                          </p>
                          {order.products.length > 1 && (
                            <p className={`text-[12px] font-medium ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                              +{order.products.length - 1} ürün daha
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quick Action Button - Premium Style */}
                      {getNextStatus(order.status) && (
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(order.id, getNextStatus(order.status)!.status);
                          }}
                          className={`w-full mt-5 py-3 rounded-[14px] text-[13px] font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-2xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                            isDark 
                              ? 'bg-gradient-to-r from-white/[0.15] to-white/[0.08] hover:from-white/[0.22] hover:to-white/[0.15] text-white ring-1 ring-white/[0.25] hover:ring-white/[0.35] shadow-black/20' 
                              : 'bg-gradient-to-r from-black/[0.06] to-black/[0.03] hover:from-black/[0.10] hover:to-black/[0.06] text-gray-900 ring-1 ring-black/[0.12] hover:ring-black/[0.18] shadow-black/10'
                          }`}
                        >
                          <span>{getNextStatus(order.status)!.label}</span>
                          <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
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
      
      {/* Fullscreen order detail - Portal ile body'ye render et */}
      {isMounted && selectedOrder && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999]"
          >
            <div
              className={`absolute inset-0 ${isDark ? 'bg-black/80' : 'bg-black/60'} backdrop-blur-xl`}
              onClick={() => setSelectedOrder(null)}
              style={{
                background: isDark 
                  ? 'radial-gradient(circle at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.9) 100%)'
                  : 'radial-gradient(circle at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)'
              }}
            />

            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className={`absolute inset-4 lg:inset-10 rounded-3xl overflow-hidden flex flex-col backdrop-blur-2xl ${
                isDark 
                  ? 'bg-neutral-950/95 border border-neutral-800/50 shadow-2xl shadow-purple-500/10' 
                  : 'bg-white/95 border border-gray-200/50 shadow-2xl shadow-gray-900/20'
              }`}
              style={{
                boxShadow: isDark 
                  ? '0 0 80px rgba(168, 85, 247, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  : '0 0 60px rgba(0, 0, 0, 0.1), 0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              {/* Header bar */}
              <div className={`flex items-center justify-between px-6 py-4 border-b backdrop-blur-sm relative ${
                isDark ? 'border-neutral-800/50 bg-gradient-to-r from-neutral-950/50 via-neutral-900/30 to-neutral-950/50' : 'border-gray-200/50 bg-gradient-to-r from-white/50 via-gray-50/30 to-white/50'
              }`}
              style={{
                boxShadow: isDark ? '0 1px 20px rgba(168, 85, 247, 0.1)' : '0 1px 15px rgba(0, 0, 0, 0.05)'
              }}>
                <div className="flex items-center gap-4">
                  <div className="min-w-12 h-12 px-3 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#e05a4c] to-[#f5a524] text-white font-bold text-lg whitespace-nowrap relative overflow-hidden group"
                    style={{
                      boxShadow: '0 4px 20px rgba(224, 90, 76, 0.4), 0 0 40px rgba(245, 165, 36, 0.2)'
                    }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="relative z-10">#{selectedOrder.orderNumber}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Sipariş Detayı</h3>
                      <StatusBadge
                        status={statusConfig[selectedOrder.status]?.variant || 'info'}
                        text={statusConfig[selectedOrder.status]?.label || selectedOrder.status || 'Bilinmiyor'}
                        pulse={selectedOrder.status === 'pending'}
                      />
                    </div>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Oluşturulma: {formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { if (printRef.current) openPrintableWindow(printRef.current); }}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${
                      isDark 
                        ? 'bg-neutral-900/80 text-neutral-200 hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-700/20 hover:-translate-y-0.5' 
                        : 'bg-gray-100/80 text-gray-800 hover:bg-gray-200 hover:shadow-lg hover:shadow-gray-400/20 hover:-translate-y-0.5'
                    }`}
                  >
                    <HiOutlinePrinter className="w-4 h-4" /> Yazdır
                  </button>
                  <button
                    onClick={() => { if (printRef.current) downloadPdfClientSide(printRef.current, `siparis-${selectedOrder?.orderNumber || 'order'}.pdf`); }}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${
                      isDark 
                        ? 'bg-neutral-900/80 text-neutral-200 hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-700/20 hover:-translate-y-0.5' 
                        : 'bg-gray-100/80 text-gray-800 hover:bg-gray-200 hover:shadow-lg hover:shadow-gray-400/20 hover:-translate-y-0.5'
                    }`}
                  >
                    <HiOutlineDownload className="w-4 h-4" /> PDF
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className={`p-2 rounded-xl transition-all duration-300 ${
                      isDark 
                        ? 'text-neutral-400 hover:text-white hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/20' 
                        : 'text-gray-500 hover:text-red-600 hover:bg-red-50 hover:shadow-lg hover:shadow-red-500/10'
                    }`}
                  >
                    <HiOutlineX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content grid */}
              <div className="flex-1 overflow-auto">
                <div className="grid lg:grid-cols-3 h-full divide-y lg:divide-y-0 lg:divide-x divide-neutral-800/40">
                  {/* Left column: customer + delivery + payment */}
                  <div className={`p-6 space-y-4 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
                    <div className={`p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                      isDark 
                        ? 'bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 hover:border-neutral-700 hover:shadow-xl hover:shadow-purple-500/5' 
                        : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-400/10'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm font-semibold ${isDark ? 'text-neutral-200' : 'text-gray-700'}`}>Müşteri</p>
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${selectedOrder.isGuest ? (isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700') : (isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700')}`}>
                          {selectedOrder.isGuest ? 'Misafir' : 'Üye'}
                        </span>
                      </div>
                      {(() => {
                        const customer = selectedOrder.customerId ? getCustomerById(selectedOrder.customerId) : undefined;
                        const displayCustomerName = (selectedOrder.customerName || '').trim() || customer?.name || 'Misafir Müşteri';
                        return <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{displayCustomerName}</p>;
                      })()}
                      {selectedOrder.customerEmail && (
                        <a href={`mailto:${selectedOrder.customerEmail}`} className={`mt-1 flex items-center gap-2 text-sm ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                          <HiOutlineMail className="w-4 h-4" /> {selectedOrder.customerEmail}
                        </a>
                      )}
                      {selectedOrder.customerPhone && (
                        <a href={`tel:${selectedOrder.customerPhone}`} className={`flex items-center gap-2 text-sm ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                          <HiOutlinePhone className="w-4 h-4" /> {selectedOrder.customerPhone}
                        </a>
                      )}
                      {selectedOrder.customerId && (
                        <p className={`text-xs mt-2 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>Müşteri ID: {selectedOrder.customerId}</p>
                      )}
                    </div>

                    {selectedOrder.delivery && (
                      <div className={`p-4 rounded-2xl space-y-3 transition-all duration-300 hover:scale-[1.02] ${
                        isDark 
                          ? 'bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 hover:border-neutral-700 hover:shadow-xl hover:shadow-purple-500/5' 
                          : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-400/10'
                      }`}>
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-semibold ${isDark ? 'text-neutral-200' : 'text-gray-700'}`}>Teslimat</p>
                          {selectedOrder.delivery.deliveryDate && (
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                              {formatDeliveryDateFriendly(selectedOrder.delivery.deliveryDate, selectedOrder.delivery.deliveryTimeSlot)}
                            </span>
                          )}
                        </div>

                        <div>
                          <p className={`text-xs uppercase tracking-wide mb-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Alıcı</p>
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.delivery.recipientName || '-'}</p>
                          {selectedOrder.delivery.recipientPhone && (
                            <a href={`tel:${selectedOrder.delivery.recipientPhone}`} className={`flex items-center gap-2 text-sm mt-1 ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                              <HiOutlinePhone className="w-4 h-4" /> {selectedOrder.delivery.recipientPhone}
                            </a>
                          )}
                        </div>

                        <div className={`p-3 rounded-xl ${isDark ? 'bg-neutral-950 border border-neutral-800' : 'bg-gray-50 border border-gray-200'}`}>
                          <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Adres</p>
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-neutral-200' : 'text-gray-800'}`}>{selectedOrder.delivery.fullAddress || '-'}</p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                            {[selectedOrder.delivery.neighborhood, selectedOrder.delivery.district, selectedOrder.delivery.province].filter(Boolean).join(', ')}
                          </p>
                        </div>

                        {selectedOrder.delivery.deliveryNotes && (
                          <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
                            <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Teslimat Notu</p>
                            <p className={`text-sm ${isDark ? 'text-neutral-200' : 'text-gray-700'}`}>{selectedOrder.delivery.deliveryNotes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedOrder.payment && (
                      <div className={`p-4 rounded-2xl space-y-3 transition-all duration-300 hover:scale-[1.02] ${
                        isDark 
                          ? 'bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 hover:border-neutral-700 hover:shadow-xl hover:shadow-purple-500/5' 
                          : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-400/10'
                      }`}>
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-semibold ${isDark ? 'text-neutral-200' : 'text-gray-700'}`}>Ödeme</p>
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
                        <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                          {selectedOrder.payment.method === 'credit_card' ? '💳 Kredi Kartı' : selectedOrder.payment.method === 'bank_transfer' ? '🏦 Havale/EFT' : '💵 Kapıda Ödeme'}
                          {selectedOrder.payment.cardLast4 && ` (**** ${selectedOrder.payment.cardLast4})`}
                        </p>
                        {selectedOrder.payment.transactionId && (
                          <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>İşlem: {selectedOrder.payment.transactionId}</p>
                        )}
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-neutral-950 border border-neutral-800' : 'bg-gray-50 border border-gray-200'}`}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className={isDark ? 'text-neutral-400' : 'text-gray-500'}>Ara Toplam</span>
                            <span className={isDark ? 'text-neutral-200' : 'text-gray-800'}>{formatPrice(selectedOrder.subtotal)}</span>
                          </div>
                          {selectedOrder.discount > 0 && (
                            <div className="flex justify-between text-sm mb-1">
                              <span className={isDark ? 'text-neutral-400' : 'text-gray-500'}>İndirim</span>
                              <span className="text-red-400">-{formatPrice(selectedOrder.discount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className={isDark ? 'text-neutral-400' : 'text-gray-500'}>Teslimat</span>
                            <span className="text-emerald-400">Ücretsiz</span>
                          </div>
                          <div className={`mt-3 pt-2 border-t flex justify-between items-center ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Toplam</span>
                            <span className="text-xl font-bold text-emerald-400">{formatPrice(selectedOrder.total)}</span>
                          </div>
                        </div>

                        {(selectedOrder.payment.status === 'failed' || selectedOrder.status === 'payment_failed') && (selectedOrder.payment.errorMessage || selectedOrder.payment.errorCode || selectedOrder.payment.errorGroup) && (
                          <div className={`p-3 rounded-xl border ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
                            <p className={`text-xs font-semibold ${isDark ? 'text-red-200' : 'text-red-700'}`}>Ödeme Hatası</p>
                            {selectedOrder.payment.errorMessage && (
                              <p className={`text-sm mt-1 ${isDark ? 'text-neutral-100' : 'text-red-700'}`}>{selectedOrder.payment.errorMessage}</p>
                            )}
                            {(selectedOrder.payment.errorCode || selectedOrder.payment.errorGroup) && (
                              <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-red-600'}`}>
                                {selectedOrder.payment.errorCode ? `Kod: ${String(selectedOrder.payment.errorCode)}` : ''}
                                {selectedOrder.payment.errorCode && selectedOrder.payment.errorGroup ? ' • ' : ''}
                                {selectedOrder.payment.errorGroup ? `Grup: ${String(selectedOrder.payment.errorGroup)}` : ''}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Quick payment actions */}
                        <div className="grid grid-cols-2 gap-2">
                          {selectedOrder.payment?.method === 'credit_card' && selectedOrder.payment?.status !== 'paid' && selectedOrder.payment?.token && (
                            <button
                              onClick={async () => {
                                if (!confirm('iyzico ödeme durumunu sorgula?')) return;
                                try {
                                  const res = await fetch('/api/orders/verify-payment', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ orderId: selectedOrder.id }),
                                  });
                                  const data = await res.json();
                                  if (data.success && data.verified) {
                                    alert('Ödeme doğrulandı. Sayfa yenilenecek.');
                                    window.location.reload();
                                  } else if (data.alreadyPaid) {
                                    alert('Bu ödeme zaten onaylı.');
                                    window.location.reload();
                                  } else if (data.paymentFailed) {
                                    alert(data.iyzicoResult?.errorMessage || 'Ödeme başarısız');
                                  } else if (data.pending) {
                                    alert(`Ödeme bekliyor: ${data.iyzicoResult?.paymentStatus || 'Bilinmiyor'}`);
                                  } else {
                                    alert(data.error || 'Bir hata oluştu');
                                  }
                                } catch (err) {
                                  console.error(err);
                                  alert('Bir hata oluştu');
                                }
                              }}
                              className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-500/15 text-blue-200 hover:bg-blue-500/25 transition"
                            >
                              iyzico Kontrol
                            </button>
                          )}
                          {selectedOrder.payment?.status !== 'paid' && (
                            <button
                              onClick={async () => {
                                const confirmText = prompt('Ödemeyi manuel onayla? ONAYLA yazın:');
                                if (confirmText !== 'ONAYLA') return;
                                try {
                                  const res = await fetch('/api/orders/manual-confirm-payment', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ orderId: selectedOrder.id, note: 'Admin panelden manuel onay' }),
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    alert('Ödeme onaylandı.');
                                    window.location.reload();
                                  } else if (data.alreadyPaid) {
                                    alert('Bu ödeme zaten onaylı.');
                                    window.location.reload();
                                  } else {
                                    alert(data.error || 'Bir hata oluştu');
                                  }
                                } catch (err) {
                                  console.error(err);
                                  alert('Bir hata oluştu');
                                }
                              }}
                              className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 transition"
                            >
                              Manuel Onay
                            </button>
                          )}
                          {selectedOrder.payment?.method === 'bank_transfer' && selectedOrder.payment?.status !== 'paid' && (
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
                                    alert('Havale ödemesi onaylandı.');
                                    window.location.reload();
                                  } else {
                                    alert(data.error || 'Bir hata oluştu');
                                  }
                                } catch (err) {
                                  console.error(err);
                                  alert('Bir hata oluştu');
                                }
                              }}
                              className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 transition col-span-2"
                            >
                              Havale Ödemesini Onayla
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Middle column: products & message */}
                  <div className="p-6 space-y-4">
                    {selectedOrder.message?.content && (
                      <div className={`p-4 rounded-2xl transition-all duration-300 hover:scale-[1.01] ${
                        isDark 
                          ? 'bg-pink-500/10 backdrop-blur-sm border border-pink-500/30 hover:border-pink-500/50 hover:shadow-xl hover:shadow-pink-500/10' 
                          : 'bg-pink-50/80 backdrop-blur-sm border border-pink-100 hover:border-pink-200 hover:shadow-xl hover:shadow-pink-500/10'
                      }`}>
                        <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-pink-200' : 'text-pink-700'}`}>
                          Mesaj Kartı {selectedOrder.message.isGift && '(Hediye)'}
                        </p>
                        <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isDark ? 'text-neutral-100' : 'text-gray-800'}`}>
                          {selectedOrder.message.content}
                        </p>
                        {selectedOrder.message.senderName && (
                          <p className={`text-xs mt-2 text-right ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>— {selectedOrder.message.senderName}</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-semibold ${isDark ? 'text-neutral-200' : 'text-gray-700'}`}>Ürünler</p>
                        <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{selectedOrder.products.length} adet</p>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${isDark ? 'bg-neutral-900 text-neutral-200' : 'bg-gray-100 text-gray-700'}`}>
                        {formatPrice(selectedOrder.total)}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedOrder.products.map((product, index) => (
                        <div key={index} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.01] group ${
                          isDark 
                            ? 'bg-neutral-900/60 backdrop-blur-sm border-neutral-800/50 hover:border-neutral-700 hover:shadow-xl hover:shadow-purple-500/5' 
                            : 'bg-white/80 backdrop-blur-sm border-gray-200/50 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-400/10'
                        }`}>
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-gray-100 to-gray-200">
                            {product.image ? (
                              <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">🌸</div>
                            )}
                            {product.quantity > 1 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#e05a4c] text-white text-xs font-bold rounded-full flex items-center justify-center">{product.quantity}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.name}</h4>
                            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>{product.quantity} × {formatPrice(product.price)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(product.price * product.quantity)}</p>
                            {(product.slug || product.productId) && (
                              <Link
                                href={`/${product.category || 'cicek'}/${product.slug || product.productId}`}
                                target="_blank"
                                className="text-xs font-semibold text-[#e05a4c] hover:text-[#cd3f31]"
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

                  {/* Right column: status, timeline, actions */}
                  <div className={`p-6 space-y-4 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
                    <div className={`p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                      isDark 
                        ? 'bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 hover:border-neutral-700 hover:shadow-xl hover:shadow-purple-500/5' 
                        : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-400/10'
                    }`}>
                      <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-neutral-200' : 'text-gray-700'}`}>Durum Güncelle</p>
                      <div className="grid grid-cols-2 gap-2">
                        {getNextStatus(selectedOrder.status) && (
                          <button
                            onClick={() => {
                              const next = getNextStatus(selectedOrder.status);
                              if (next) handleUpdateStatus(selectedOrder.id, next.status, next.label);
                            }}
                            className="px-4 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-emerald-400 text-white hover:brightness-110 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300"
                          >
                            {getNextStatus(selectedOrder.status)?.label}
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled', 'Admin tarafından iptal edildi')}
                          className="px-4 py-2.5 rounded-xl font-semibold bg-red-500/15 text-red-300 hover:bg-red-500/25 hover:scale-105 hover:shadow-xl hover:shadow-red-500/20 transition-all duration-300"
                        >
                          İptal Et
                        </button>
                      </div>
                    </div>

                    {selectedOrder.notes && (
                      <div className={`p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                        isDark 
                          ? 'bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 hover:border-neutral-700 hover:shadow-xl hover:shadow-purple-500/5' 
                          : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-400/10'
                      }`}>
                        <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-neutral-200' : 'text-gray-700'}`}>Notlar</p>
                        <p className={`text-sm leading-relaxed ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{selectedOrder.notes}</p>
                      </div>
                    )}

                    {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                      <div className={`p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                        isDark 
                          ? 'bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 hover:border-neutral-700 hover:shadow-xl hover:shadow-purple-500/5' 
                          : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-400/10'
                      }`}>
                        <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-neutral-200' : 'text-gray-700'}`}>Zaman Çizelgesi</p>
                        <div className="space-y-3 max-h-[320px] overflow-auto pr-1 custom-scroll">
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
                                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {statusConfig[entry.status]?.label || entry.status || 'Bilinmiyor'}
                                </p>
                                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{formatDate(entry.timestamp)}</p>
                                {entry.note && (
                                  <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>{entry.note}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={`p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                      isDark 
                        ? 'bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 hover:border-neutral-700 hover:shadow-xl hover:shadow-purple-500/5' 
                        : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-400/10'
                    }`}>
                      <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-neutral-200' : 'text-gray-700'}`}>Hızlı Eylemler</p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                        <button onClick={() => navigator.clipboard.writeText(selectedOrder.customerPhone || '')} className={`px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105 ${isDark ? 'bg-neutral-800/60 text-neutral-200 hover:bg-neutral-700 hover:shadow-lg' : 'bg-gray-100/60 text-gray-800 hover:bg-gray-200 hover:shadow-lg'}`}>Tel Kopyala</button>
                        <button onClick={() => navigator.clipboard.writeText(String(selectedOrder.orderNumber))} className={`px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105 ${isDark ? 'bg-neutral-800/60 text-neutral-200 hover:bg-neutral-700 hover:shadow-lg' : 'bg-gray-100/60 text-gray-800 hover:bg-gray-200 hover:shadow-lg'}`}>No Kopyala</button>
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105 ${isDark ? 'bg-neutral-800/60 text-neutral-200 hover:bg-neutral-700 hover:shadow-lg' : 'bg-gray-100/60 text-gray-800 hover:bg-gray-200 hover:shadow-lg'}`}>Başa Git</button>
                        <button onClick={() => setSelectedOrder(null)} className={`px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105 ${isDark ? 'bg-red-500/15 text-red-200 hover:bg-red-500/25 hover:shadow-lg hover:shadow-red-500/20' : 'bg-red-50 text-red-700 hover:bg-red-100 hover:shadow-lg hover:shadow-red-500/10'}`}>Kapat</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hidden printable template */}
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: 800 }} aria-hidden>
                <OrderPrintTemplate ref={printRef} order={selectedOrder} />
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
