'use client';

import { useState, useMemo, useRef, useEffect, useDeferredValue, useCallback, useTransition } from 'react';
import { FixedSizeList as List, FixedSizeGrid as Grid } from 'react-window';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { getMediaType } from '@/components/admin/MediaUpload';
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
  HiOutlineTrash,
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
  HiOutlineCalendar,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineUser
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
  refunded: { label: 'İade Edildi', variant: 'info', icon: <HiOutlineCurrencyDollar className="w-4 h-4" /> },
  failed: { label: 'Başarısız', variant: 'error', icon: <HiOutlineXCircle className="w-4 h-4" /> },
};

// Türkçe ay ve gün isimleri
const TURKISH_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const TURKISH_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function getPaymentLogoInfo(paymentMethod?: string): { src: string; alt: string; containerClass: (isDark: boolean) => string } | null {
  if (paymentMethod === 'credit_card') {
    return {
      src: '/TR/Tr_White/iyzico_ile_ode_white.png',
      alt: 'iyzico',
      containerClass: (isDark) =>
        `h-6 w-[76px] rounded-md flex items-center justify-center px-2 ${isDark ? 'bg-white/10 ring-1 ring-white/10' : 'bg-neutral-900'}`,
    };
  }

  if (paymentMethod === 'bank_transfer') {
    return {
      src: '/TR/garanti.svg',
      alt: 'Garanti Bankası',
      containerClass: (isDark) =>
        `h-6 w-[76px] rounded-md flex items-center justify-center px-2 ${isDark ? 'bg-white ring-1 ring-white/10' : 'bg-white border border-gray-200'}`,
    };
  }

  return null;
}

// Telefon numarasını formatla: 5XXXXXXXXX -> 5XX XXX XX XX
function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Sadece rakamları al
  const digits = phone.replace(/\D/g, '');
  
  // 10 haneli değilse olduğu gibi döndür
  if (digits.length !== 10) return phone;
  
  // 5XX XXX XX XX formatına çevir
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
}

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
    // dateStr: "2026-01-11" formatında (yerel tarih)
    const [year, month, day] = dateStr.split('-').map(Number);
    const orderDate = new Date(year, month - 1, day);
    if (isNaN(orderDate.getTime())) return '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
    const diffDays = Math.floor((today.getTime() - orderDay.getTime()) / (1000 * 60 * 60 * 24));
    
    const dayName = TURKISH_DAYS[orderDate.getDay()];
    const monthName = TURKISH_MONTHS[orderDate.getMonth()];
    const dayOfMonth = orderDate.getDate();
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
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [, startTransition] = useTransition();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const printRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vadiler_orders_view_mode');
      if (saved === 'grid' || saved === 'list') return saved as 'grid' | 'list';
    }
    return 'grid';
  });
  // Track seen orders (unseen orders are highlighted until clicked)
  const [seenOrderIds, setSeenOrderIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('vadiler_orders_seen');
        const arr = raw ? JSON.parse(raw) : [];
        if (Array.isArray(arr)) return new Set<string>(arr);
      } catch (e) {}
    }
    return new Set<string>();
  });
  
  const { isDark } = useTheme();
  const { state: orderState, updateOrderStatus, deleteOrder } = useOrder();
  const { getCustomerById } = useCustomer();

  // Persist view mode selection across sessions
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('vadiler_orders_view_mode', viewMode);
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [viewMode]);

  // Persist seen orders
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('vadiler_orders_seen', JSON.stringify([...seenOrderIds]));
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [seenOrderIds]);

  // Initialize seen set with current orders so only future orders appear as new
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('vadiler_orders_seen');
      if (!raw) {
        const initialIds = (orderState.orders || []).map(o => o.id);
        setSeenOrderIds(new Set(initialIds));
      }
    } catch (e) {
      // ignore storage errors
    }
    // run only when orders list first arrives/changes
  }, [orderState.orders]);

  const markOrderSeen = useCallback((id: string) => {
    setSeenOrderIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const handleSelectOrder = useCallback((order: Order) => {
    markOrderSeen(order.id);
    setSelectedOrder(order);
  }, [markOrderSeen]);

  const handleSearchChange = useCallback((nextValue: string) => {
    startTransition(() => {
      setSearchTerm(nextValue);
      setCurrentPage(1);
    });
  }, [startTransition]);

  const handleSetStatus = useCallback((nextStatus: string) => {
    startTransition(() => {
      setSelectedStatus(nextStatus);
      setCurrentPage(1);
    });
  }, [startTransition]);
  
  // Delete confirmation state
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination - "all" seçeneği ile tüm siparişleri göster
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(25);
  const itemsPerPageOptions: (number | 'all')[] = [10, 25, 50, 100, 'all'];
  const prefersReducedMotion = useReducedMotion();
  
  // Müşterinin kaçıncı siparişi olduğunu hesapla (sadece başarılı ve ödenmiş olanlar)
  const customerOrderCounts = useMemo(() => {
    const counts: Record<string, { total: number; orderMap: Record<string, number> }> = {};
    
    // Tüm siparişleri tarihe göre sırala (eskiden yeniye)
    const sortedOrders = [...orderState.orders].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    sortedOrders.forEach(order => {
      // İptal veya iade edilmiş siparişleri sayma
      const isCancelledOrRefunded = order.status === 'cancelled' || 
                                     order.status === 'refunded' || 
                                     order.status === 'failed' ||
                                     order.status === 'payment_failed';
      
      if (isCancelledOrRefunded) return;
      
      // Sadece ödenmiş ve teslim edilmiş/edilecek siparişleri say
      const isPaid = order.payment?.status === 'paid';
      const isDelivered = order.status === 'delivered' || order.status === 'shipped';
      const isSuccessful = isPaid || isDelivered;
      
      if (!isSuccessful) return;
      
      // Müşteri emaili veya telefonu ile eşleştir
      const customerKey = order.customerEmail?.toLowerCase() || order.customerPhone || order.customerId || order.id;
      
      if (!counts[customerKey]) {
        counts[customerKey] = { total: 0, orderMap: {} };
      }
      
      counts[customerKey].total += 1;
      counts[customerKey].orderMap[order.id] = counts[customerKey].total;
    });
    
    return counts;
  }, [orderState.orders]);
  
  // Belirli bir siparişin müşteri için kaçıncı sipariş olduğunu al
  const getCustomerOrderNumber = (order: Order): { current: number; total: number } => {
    const customerKey = order.customerEmail?.toLowerCase() || order.customerPhone || order.customerId || order.id;
    const data = customerOrderCounts[customerKey];
    if (!data) return { current: 1, total: 1 };
    return {
      current: data.orderMap[order.id] || 1,
      total: data.total
    };
  };

  // Portal için mount check
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filtreleme mantığı - Takvimsel gün seçimi ile
  const filteredOrders = useMemo(() => {
    const q = (deferredSearchTerm || '').trim().toLowerCase();
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
        const customerName = (order.customerName || '').toLowerCase();
        const customerEmail = (order.customerEmail || '').toLowerCase();
        const matchesSearch =
          q.length === 0 ||
          customerName.includes(q) ||
          order.orderNumber.toString().includes(deferredSearchTerm) ||
          customerEmail.includes(q);
        
        // Takvimsel tarih filtresi - Seçilen güne ait siparişleri göster
        let matchesDate = true;
        if (selectedDate) {
          const orderDate = new Date(order.createdAt);
          // Yerel tarihe göre karşılaştır (timezone sorununu önlemek için)
          const orderYear = orderDate.getFullYear();
          const orderMonth = orderDate.getMonth();
          const orderDay = orderDate.getDate();
          
          const selectedYear = selectedDate.getFullYear();
          const selectedMonth = selectedDate.getMonth();
          const selectedDay = selectedDate.getDate();
          
          matchesDate = orderYear === selectedYear && 
                        orderMonth === selectedMonth && 
                        orderDay === selectedDay;
        }
        
        return matchesStatus && matchesSearch && matchesDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orderState.orders, selectedStatus, deferredSearchTerm, selectedDate]);

  // itemsPerPage 'all' olduğunda tüm siparişleri göster
  const effectiveItemsPerPage = itemsPerPage === 'all' ? filteredOrders.length : itemsPerPage;
  // Perf gates: keep visuals, reduce per-item animation/video work on larger pages
  const largeListMode = itemsPerPage === 'all' || effectiveItemsPerPage >= 25;
  const enableListAnimations = !prefersReducedMotion && !largeListMode;
  const enableHoverAnimations = !prefersReducedMotion;
  const enableVideoAutoplay = !prefersReducedMotion && viewMode === 'grid' && !largeListMode;
  const enablePulseEffects = !prefersReducedMotion && !largeListMode;
  const enableModalAnimations = !prefersReducedMotion;
  const totalPages = effectiveItemsPerPage > 0 ? Math.ceil(filteredOrders.length / effectiveItemsPerPage) : 1;
  const paginatedOrders = useMemo(() => {
    if (itemsPerPage === 'all') {
      return filteredOrders;
    }
    return filteredOrders.slice(
      (currentPage - 1) * effectiveItemsPerPage,
      currentPage * effectiveItemsPerPage
    );
  }, [filteredOrders, currentPage, effectiveItemsPerPage, itemsPerPage]);

  // Siparişleri tarihe göre grupla
  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: Order[] } = {};
    
    paginatedOrders.forEach(order => {
      // Yerel tarihe göre grupla (timezone sorununu önlemek için)
      const orderDate = new Date(order.createdAt);
      const year = orderDate.getFullYear();
      const month = String(orderDate.getMonth() + 1).padStart(2, '0');
      const day = String(orderDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(order);
    });
    
    return Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }, [paginatedOrders]);

  const groupedOrdersWithStats = useMemo(() => {
    return groupedOrders.map(([dateKey, orders]) => {
      const dailyTotal = orders.reduce((sum, order) => {
        if (order.payment?.status === 'paid') return sum + (order.total || 0);
        return sum;
      }, 0);
      return { dateKey, orders, dailyTotal, label: getDateGroupLabel(dateKey) };
    });
  }, [groupedOrders]);

  const DateGroupHeaderWrapper: any = enableListAnimations ? motion.div : 'div';
  const GridCardWrapper: any = enableListAnimations ? motion.div : 'div';
  const TableRowWrapper: any = enableListAnimations ? motion.tr : 'tr';
  const ProductThumbWrapper: any = enableHoverAnimations ? motion.div : 'div';

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

  const handleDeleteOrder = async (order: Order) => {
    setIsDeleting(true);
    try {
      await deleteOrder(order.id);
      setDeleteConfirmOrder(null);
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Refund state
  const [refundLoading, setRefundLoading] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);

  const handleRefund = async () => {
    if (!refundOrder) return;
    setRefundLoading(true);
    try {
      const res = await fetch('/api/orders/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: refundOrder.id,
          reason: refundReason || 'Müşteri talebi',
          amount: refundOrder.total,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Refund error:', data.error);
        alert(data.error || 'İade işlemi başarısız.');
      } else {
        // Update local state
        if (selectedOrder?.id === refundOrder.id) {
          setSelectedOrder(prev => prev ? {
            ...prev,
            status: 'refunded' as OrderStatus,
            refund: data.order?.refund,
            timeline: data.order?.timeline || prev.timeline,
          } : null);
        }
        setShowRefundModal(false);
        setRefundOrder(null);
        setRefundReason('');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('İade işlemi başarısız.');
    } finally {
      setRefundLoading(false);
    }
  };

  // Check if order is eligible for refund
  const canRefund = (order: Order): boolean => {
    // Can refund any order that is not already refunded
    // Bank transfers and credit card payments can all be refunded
    const isRefunded = order.status === 'refunded';
    return !isRefunded;
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

  const getReminderInfo = (payment?: Order['payment']) => {
    if (!payment) return { shown: false, at: null as string | null, channel: null as string | null };
    const raw = payment as any;
    const at = raw.reminderShownAt || raw.reminder_shown_at || raw.reminderLastShownAt || raw.reminder_last_shown_at || null;
    const channel = raw.reminderChannel || raw.reminder_channel || raw.reminderType || raw.reminder_type || null;
    const shown = raw.reminderShown === true || raw.reminder_shown === true || raw.reminderAcknowledged === true || !!at;
    return { shown: !!shown, at: at ? String(at) : null, channel: channel ? String(channel) : null };
  };

  const reminderInfo = useMemo(() => getReminderInfo(selectedOrder?.payment), [selectedOrder]);

  const getReminderActions = (payment?: Order['payment']) => {
    if (!payment) return { hasAction: false, lastAction: null as string | null, lastAt: null as string | null, resumeCount: 0, dismissCount: 0 };
    const raw = payment as any;
    const lastAction = raw.reminderAction || raw.reminder_action || raw.reminderLastAction || raw.reminder_last_action || null;
    const lastAt = raw.reminderActionAt || raw.reminder_action_at || raw.reminderLastActionAt || raw.reminder_last_action_at || raw.reminderClosedAt || raw.reminder_closed_at || null;
    const resumeCount = Number(raw.reminderResumeCount || raw.reminder_resume_count || 0) || 0;
    const dismissCount = Number(raw.reminderDismissCount || raw.reminder_dismiss_count || 0) || 0;
    const hasAction = !!(lastAction || lastAt || resumeCount || dismissCount);
    return {
      hasAction,
      lastAction: lastAction ? String(lastAction) : null,
      lastAt: lastAt ? String(lastAt) : null,
      resumeCount,
      dismissCount,
    };
  };

  const reminderActions = useMemo(() => getReminderActions(selectedOrder?.payment), [selectedOrder]);

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
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-4 lg:px-0">{/* Glassmorphism Header */}
      <FadeContent direction="up" delay={0}>
        <div className={`p-3 sm:p-6 rounded-2xl sm:rounded-3xl backdrop-blur-xl ${
          isDark 
            ? 'bg-white/[0.03] border border-white/[0.08]' 
            : 'bg-white/60 border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
        }`}>
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <h1 className={`text-xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Siparişler
              </h1>
              <span className={`text-sm sm:text-lg font-medium tabular-nums ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                {filteredOrders.length}
              </span>
            </div>
            
            {/* Ar-Ge Stats - Glassmorphism Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              <div className={`flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl backdrop-blur-md flex-shrink-0 ${
                isDark ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20' : 'bg-emerald-50/80 ring-1 ring-emerald-200/50'
              }`}>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider ${isDark ? 'text-emerald-400/70' : 'text-emerald-600/70'}`}>Satış</span>
                <span className={`text-xs sm:text-base font-bold tabular-nums ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  {formatPrice(stats.totalSales)}
                </span>
              </div>
              
              {stats.totalFailed > 0 && (
                <button
                  onClick={() => handleSetStatus('payment_failed')}
                  className={`flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl backdrop-blur-md transition-all cursor-pointer active:scale-95 flex-shrink-0 ${
                    selectedStatus === 'payment_failed'
                      ? (isDark ? 'bg-red-500/20 ring-2 ring-red-500/40' : 'bg-red-100 ring-2 ring-red-300')
                      : (isDark ? 'bg-red-500/10 ring-1 ring-red-500/20 hover:bg-red-500/15' : 'bg-red-50/80 ring-1 ring-red-200/50 hover:bg-red-100')
                  }`}
                >
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider ${isDark ? 'text-red-400/70' : 'text-red-600/70'}`}>Başarısız</span>
                  <span className={`text-xs sm:text-base font-bold tabular-nums ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                    {stats.totalFailed}
                  </span>
                </button>
              )}

              <Link
                href="/yonetim/siparisler/silinen"
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl backdrop-blur-md transition-all flex-shrink-0 ${
                  isDark 
                    ? 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 ring-1 ring-white/10' 
                    : 'bg-black/5 text-gray-400 hover:text-gray-900 hover:bg-black/10 ring-1 ring-black/5'
                }`}
                title="Silinen Siparişler"
              >
                <HiOutlineTrash className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[10px] sm:text-xs font-medium hidden sm:inline">Silinen</span>
              </Link>

              <button
                onClick={() => window.location.reload()}
                className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl backdrop-blur-md transition-all flex-shrink-0 ${
                  isDark 
                    ? 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 ring-1 ring-white/10' 
                    : 'bg-black/5 text-gray-400 hover:text-gray-900 hover:bg-black/10 ring-1 ring-black/5'
                }`}
                title="Yenile"
              >
                <HiOutlineRefresh className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Grid/List View Toggle */}
              <div className={`flex items-center gap-0.5 p-0.5 rounded-lg sm:rounded-xl backdrop-blur-md ${
                isDark ? 'bg-white/5 ring-1 ring-white/10' : 'bg-black/5 ring-1 ring-black/5'
              }`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? (isDark ? 'bg-purple-500/30 text-purple-300' : 'bg-purple-100 text-purple-700')
                      : (isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-400 hover:text-gray-900')
                  }`}
                  title="Grid Görünüm"
                >
                  <HiOutlineViewGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${
                    viewMode === 'list'
                      ? (isDark ? 'bg-purple-500/30 text-purple-300' : 'bg-purple-100 text-purple-700')
                      : (isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-400 hover:text-gray-900')
                  }`}
                  title="Liste Görünüm"
                >
                  <HiOutlineViewList className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </FadeContent>

      {/* Glassmorphism Filter Bar */}
      <FadeContent direction="up" delay={0.1}>
        <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-xl ${
          isDark 
            ? 'bg-white/[0.02] border border-white/[0.06]' 
            : 'bg-white/50 border border-white/40 shadow-[0_4px_24px_rgba(0,0,0,0.04)]'
        }`}>
          <div className="flex flex-col gap-2.5">
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
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all backdrop-blur-md ${
                selectedDate
                  ? (isDark ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30' : 'bg-purple-100/80 text-purple-700 ring-1 ring-purple-200')
                  : (isDark ? 'bg-white/5 text-neutral-300 hover:bg-white/10 ring-1 ring-white/10' : 'bg-black/5 text-gray-700 hover:bg-black/10 ring-1 ring-black/5')
              }`}
            >
              <HiOutlineCalendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium text-xs sm:text-sm">
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
                  {...(enableModalAnimations
                    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
                    : {})}
                  onClick={() => setShowCalendar(false)}
                  className="fixed inset-0 z-[999998]"
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                />
                
                {/* Calendar - Fixed position at button */}
                <motion.div
                  {...(enableModalAnimations
                    ? {
                        initial: { opacity: 0, y: -8, scale: 0.95 },
                        animate: { opacity: 1, y: 0, scale: 1 },
                        exit: { opacity: 0, y: -8, scale: 0.95 },
                        transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
                      }
                    : {})}
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
                onClick={() => handleSetStatus(item.status)}
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
              onChange={(e) => handleSearchChange(e.target.value)}
              className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl transition-all focus:outline-none backdrop-blur-md ${
                isDark 
                  ? 'bg-white/5 text-white placeholder-neutral-500 focus:bg-white/10 ring-1 ring-white/10 focus:ring-white/20' 
                  : 'bg-black/5 text-gray-900 placeholder-gray-400 focus:bg-black/10 ring-1 ring-black/5 focus:ring-black/10'
              }`}
            />
            {searchTerm && (
              <button 
                onClick={() => handleSearchChange('')} 
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
            {groupedOrdersWithStats.map(({ dateKey, orders, dailyTotal, label }, groupIndex) => (
                {viewMode === 'grid' && orders.length > 20 ? (
                  <Grid
                    columnCount={3}
                    columnWidth={370}
                    height={900}
                    rowCount={Math.ceil(orders.length / 3)}
                    rowHeight={370}
                    width={1200}
                  >
                    {({ columnIndex, rowIndex, style }) => {
                      const index = rowIndex * 3 + columnIndex;
                      if (index >= orders.length) return null;
                      const order = orders[index];
                      const customer = order.customerId ? getCustomerById(order.customerId) : undefined;
                      const displayCustomerName = (order.customerName || '').trim() || customer?.name || 'Misafir';
                      const paymentStatus = order.payment?.status?.toLowerCase();
                      const paymentLogo = getPaymentLogoInfo(order.payment?.method);
                      const isSeen = seenOrderIds.has(order.id);
                      return (
                        <div style={style} key={order.id}>
                          <GridCardWrapper
                            {...(enableListAnimations
                              ? {
                                  initial: { opacity: 0, y: 20, scale: 0.96 },
                                  animate: { opacity: 1, y: 0, scale: 1 },
                                  transition: { delay: 0, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                                }
                              : {})}
                            onClick={() => handleSelectOrder(order)}
                            className="cursor-pointer group h-full"
                            style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 340px' }}
                          >
                            {/* ...existing code... */}
                          </GridCardWrapper>
                        </div>
                      );
                    }}
                  </Grid>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5 grid-auto-rows-fr">
                    {orders.map((order, index) => {
                      const customer = order.customerId ? getCustomerById(order.customerId) : undefined;
                      const displayCustomerName = (order.customerName || '').trim() || customer?.name || 'Misafir';
                      const paymentStatus = order.payment?.status?.toLowerCase();
                      const paymentLogo = getPaymentLogoInfo(order.payment?.method);
                      const isSeen = seenOrderIds.has(order.id);
                      return (
                        <GridCardWrapper
                          key={order.id}
                          {...(enableListAnimations
                            ? {
                                initial: { opacity: 0, y: 20, scale: 0.96 },
                                animate: { opacity: 1, y: 0, scale: 1 },
                                transition: { delay: Math.min(index * 0.025, 0.2), duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                              }
                            : {})}
                          onClick={() => handleSelectOrder(order)}
                          className="cursor-pointer group h-full"
                          style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 340px' }}
                        >
                          {/* ...existing code... */}
                        </GridCardWrapper>
                      );
                    })}
                  </div>
                ) : (

                  <div className={`overflow-x-auto rounded-xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-gray-200'}`}>
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className={`text-left text-xs uppercase tracking-wider ${isDark ? 'text-neutral-500 border-b border-neutral-800' : 'text-gray-500 border-b border-gray-200'}`}>
                          <th className="px-4 py-3 font-medium">Sipariş</th>
                          <th className="px-4 py-3 font-medium">Tarih</th>
                          <th className="px-4 py-3 font-medium">Müşteri</th>
                          <th className="px-4 py-3 font-medium">Ürünler</th>
                          <th className="px-4 py-3 font-medium">Teslimat</th>
                          <th className="px-4 py-3 font-medium">Durum</th>
                          <th className="px-4 py-3 font-medium">Ödeme</th>
                          <th className="px-4 py-3 font-medium text-right">Tutar</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-neutral-800' : 'divide-gray-100'}`}> 
                        {orders.length > 30 ? (
                          <List
                            height={900}
                            itemCount={orders.length}
                            itemSize={56}
                            width={1200}
                          >
                            {({ index, style }) => {
                              const order = orders[index];
                              const customer = order.customerId ? getCustomerById(order.customerId) : undefined;
                              const displayCustomerName = (order.customerName || '').trim() || customer?.name || 'Misafir';
                              const paymentStatus = order.payment?.status?.toLowerCase();
                              const paymentLogo = getPaymentLogoInfo(order.payment?.method);
                              const orderDate = new Date(order.createdAt);
                              const firstProduct = order.products[0];
                              const isSeen = seenOrderIds.has(order.id);
                              return (
                                <TableRowWrapper
                                  key={order.id}
                                  {...(enableListAnimations
                                    ? {
                                        initial: { opacity: 0, y: 10 },
                                        animate: { opacity: 1, y: 0 },
                                        transition: { delay: 0 },
                                      }
                                    : {})}
                                  onClick={() => handleSelectOrder(order)}
                                  style={{ ...style, contentVisibility: 'auto', containIntrinsicSize: '1px 56px' }}
                                  className={`cursor-pointer transition-colors ${isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-gray-50'} ${!isSeen ? 'outline-2 outline-purple-400/50' : ''}`}
                                >
                                  {/* ...existing code... */}
                                </TableRowWrapper>
                              );
                            }}
                          </List>
                        ) : (
                          orders.map((order, index) => {
                            const customer = order.customerId ? getCustomerById(order.customerId) : undefined;
                            const displayCustomerName = (order.customerName || '').trim() || customer?.name || 'Misafir';
                            const paymentStatus = order.payment?.status?.toLowerCase();
                            const paymentLogo = getPaymentLogoInfo(order.payment?.method);
                            const orderDate = new Date(order.createdAt);
                            const firstProduct = order.products[0];
                            const isSeen = seenOrderIds.has(order.id);
                            return (
                              <TableRowWrapper
                                key={order.id}
                                {...(enableListAnimations
                                  ? {
                                      initial: { opacity: 0, y: 10 },
                                      animate: { opacity: 1, y: 0 },
                                      transition: { delay: Math.min(index * 0.02, 0.2) },
                                    }
                                  : {})}
                                onClick={() => handleSelectOrder(order)}
                                style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 56px' }}
                                className={`cursor-pointer transition-colors ${isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-gray-50'} ${!isSeen ? 'outline-2 outline-purple-400/50' : ''}`}
                              >
                                {/* ...existing code... */}
                              </TableRowWrapper>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                      order.status === 'processing' || order.status === 'confirmed' ? 'shadow-[inset_0_0_20px_rgba(168,85,247,0.15)]' :
                      order.status === 'pending' ? 'shadow-[inset_0_0_20px_rgba(245,158,11,0.15)]' :
                      order.status === 'cancelled' ? 'shadow-[inset_0_0_20px_rgba(239,68,68,0.15)]' :
                      'shadow-[inset_0_0_20px_rgba(156,163,175,0.15)]'
                    }`} />

                    <div className="relative p-3 sm:p-6 flex-1 flex flex-col">
                      {/* Delete Button - Top Right Corner */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmOrder(order);
                        }}
                        className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-lg sm:rounded-xl opacity-0 sm:group-hover:opacity-100 transition-all duration-300 z-10 ${
                          isDark 
                            ? 'bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300' 
                            : 'bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600'
                        }`}
                        title="Siparişi Sil"
                      >
                        <HiOutlineTrash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>

                      {/* Header: Order Number + Status + Order Date */}
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="flex flex-col gap-1.5 sm:gap-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg sm:text-[26px] font-bold tracking-[-0.025em] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              #{order.orderNumber}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 sm:gap-1.5">
                            <div className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10.5px] font-semibold uppercase tracking-[0.08em] backdrop-blur-xl transition-all duration-300 ${
                              order.status === 'delivered' ? (isDark ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-300 ring-1 ring-emerald-400/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]' : 'bg-gradient-to-r from-emerald-50 to-emerald-100/80 text-emerald-700 ring-1 ring-emerald-200/50 shadow-sm') :
                              order.status === 'shipped' ? (isDark ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 ring-1 ring-blue-400/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]' : 'bg-gradient-to-r from-blue-50 to-blue-100/80 text-blue-700 ring-1 ring-blue-200/50 shadow-sm') :
                              order.status === 'processing' || order.status === 'confirmed' ? (isDark ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 ring-1 ring-purple-400/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]' : 'bg-gradient-to-r from-purple-50 to-purple-100/80 text-purple-700 ring-1 ring-purple-200/50 shadow-sm') :
                              order.status === 'pending' ? (isDark ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 ring-1 ring-amber-400/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]' : 'bg-gradient-to-r from-amber-50 to-amber-100/80 text-amber-700 ring-1 ring-amber-200/50 shadow-sm') :
                              order.status === 'cancelled' ? (isDark ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 ring-1 ring-red-400/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]' : 'bg-gradient-to-r from-red-50 to-red-100/80 text-red-700 ring-1 ring-red-200/50 shadow-sm') :
                              (isDark ? 'bg-gradient-to-r from-neutral-500/20 to-neutral-600/20 text-neutral-300 ring-1 ring-neutral-400/30' : 'bg-gradient-to-r from-gray-50 to-gray-100/80 text-gray-700 ring-1 ring-gray-200/50 shadow-sm')
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${enablePulseEffects ? 'animate-pulse' : ''} ${
                                order.status === 'delivered' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
                                order.status === 'shipped' ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]' :
                                order.status === 'processing' || order.status === 'confirmed' ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]' :
                                order.status === 'pending' ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]' :
                                order.status === 'cancelled' ? 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                                'bg-gray-400'
                              }`} />
                              {statusConfig[order.status]?.label || 'Bilinmiyor'}
                            </div>
                            <p className={`text-[10px] sm:text-[11px] font-medium flex items-center gap-1 sm:gap-1.5 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatOrderDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className={`text-lg sm:text-[26px] font-bold tabular-nums tracking-[-0.02em] ${
                            isDark ? 'bg-gradient-to-br from-white to-white/80 bg-clip-text text-transparent' : 'text-gray-900'
                          }`}>
                            {formatPrice(order.total)}
                          </span>
                          {paymentLogo && (
                            <div
                              className={paymentLogo.containerClass(isDark)}
                              title={order.payment?.method === 'credit_card' ? 'Kredi Kartı (iyzico)' : order.payment?.method === 'bank_transfer' ? 'Havale/EFT (Garanti)' : ''}
                            >
                              <img src={paymentLogo.src} alt={paymentLogo.alt} className="h-4 w-auto" loading="lazy" />
                            </div>
                          )}
                          {paymentStatus === 'paid' && (
                            <div className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[8px] sm:text-[10px] font-semibold uppercase tracking-wide ${
                              isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              <span className="text-[8px]">✓</span> Ödendi
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className={`flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-4 rounded-xl sm:rounded-[18px] mb-3 sm:mb-4 backdrop-blur-sm transition-all duration-300 ${
                        isDark ? 'bg-white/[0.04] hover:bg-white/[0.06] ring-1 ring-white/[0.06]' : 'bg-black/[0.02] hover:bg-black/[0.03] ring-1 ring-black/[0.04]'
                      }`}>
                        <div className="relative">
                          <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-[14px] flex items-center justify-center text-xs sm:text-[15px] font-bold bg-gradient-to-br shadow-lg transition-transform group-hover:scale-105 ${
                            isDark ? 'from-purple-500/40 via-purple-400/30 to-pink-500/40 text-white shadow-purple-500/20' : 'from-purple-100 via-purple-50 to-pink-100 text-purple-700 shadow-purple-200/50'
                          }`}>
                            {displayCustomerName.charAt(0).toUpperCase()}
                          </div>
                          {/* Müşterinin kaçıncı siparişi badge */}
                          {(() => {
                            const orderNum = getCustomerOrderNumber(order);
                            if (orderNum.total > 1) {
                              return (
                                <div className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px] px-1 flex items-center justify-center rounded-full text-[8px] sm:text-[9px] font-bold shadow-md ${
                                  orderNum.total >= 5
                                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-2 ring-amber-300/50'
                                    : orderNum.total >= 3
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white ring-2 ring-purple-300/50'
                                    : isDark
                                    ? 'bg-blue-500/90 text-white ring-2 ring-blue-400/30'
                                    : 'bg-blue-500 text-white ring-2 ring-blue-200'
                                }`} title={`Bu müşterinin ${orderNum.current}. siparişi (Toplam: ${orderNum.total})`}>
                                  {orderNum.current}/{orderNum.total}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className={`text-xs sm:text-[14px] font-semibold truncate tracking-[-0.01em] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {displayCustomerName}
                            </p>
                            {(() => {
                              const orderNum = getCustomerOrderNumber(order);
                              if (orderNum.total > 1) {
                                return (
                                  <span className={`flex-shrink-0 text-[8px] sm:text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                                    orderNum.total >= 5 
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                      : orderNum.total >= 3
                                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                                      : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                  }`}>
                                    {orderNum.total >= 5 ? '⭐ Sadık' : orderNum.total >= 3 ? '💎 VIP' : `${orderNum.total}. sipariş`}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          {order.delivery?.deliveryDate && (
                            <p className={`text-[10px] sm:text-[11.5px] font-medium flex items-center gap-1 sm:gap-1.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                              <span className="text-xs sm:text-[13px]">📅</span>
                              {formatDeliveryDateFriendly(order.delivery.deliveryDate, order.delivery.deliveryTimeSlot)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Products Preview */}
                      <div className="flex items-center gap-2.5 sm:gap-4 flex-1">
                        <div className="flex -space-x-3 sm:-space-x-4">
                          {order.products.slice(0, 3).map((p, idx) => (
                            <ProductThumbWrapper
                              key={idx}
                              {...(enableHoverAnimations
                                ? {
                                    whileHover: { scale: 1.15, zIndex: 10 },
                                    transition: { type: 'spring', stiffness: 400, damping: 25 },
                                  }
                                : {})}
                              className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[16px] overflow-hidden ring-2 sm:ring-[3px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 ${
                                isDark ? 'ring-black/40 hover:ring-white/20' : 'ring-white hover:ring-black/10'
                              }`}
                              style={{ zIndex: 3 - idx }}
                            >
                              {p.image ? (
                                getMediaType(p.image) === 'video' ? (
                                  <video
                                    src={p.image}
                                    className="w-full h-full object-cover"
                                    muted
                                    loop
                                    playsInline
                                    autoPlay={enableVideoAutoplay}
                                    preload={enableVideoAutoplay ? 'auto' : 'metadata'}
                                  />
                                ) : (
                                  <Image src={p.image} alt={p.name} fill sizes="64px" className="object-cover transition-transform duration-300 group-hover:scale-110" unoptimized />
                                )
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center text-2xl backdrop-blur-sm ${
                                  isDark ? 'bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-500' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400'
                                }`}>
                                  🌸
                                </div>
                              )}
                            </ProductThumbWrapper>
                          ))}
                          {order.products.length > 3 && (
                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[16px] flex items-center justify-center text-[10px] sm:text-[12px] font-bold ring-2 sm:ring-[3px] backdrop-blur-xl shadow-lg transition-all duration-300 ${
                              isDark ? 'bg-gradient-to-br from-white/15 to-white/5 text-white ring-white/15 hover:ring-white/25' : 'bg-gradient-to-br from-black/8 to-black/4 text-gray-700 ring-white hover:ring-black/15'
                            }`}>
                              +{order.products.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs sm:text-[15px] font-semibold truncate tracking-[-0.01em] mb-0.5 sm:mb-1 ${isDark ? 'text-white/90' : 'text-gray-800'}`}>
                            {order.products[0]?.name}
                          </p>
                          {order.products.length > 1 && (
                            <p className={`text-[10px] sm:text-[12px] font-medium ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                              +{order.products.length - 1} ürün daha
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </GridCardWrapper>
              );
            })}
          </div>
        ) : (
          /* List View - Tablo */
          <div className={`overflow-x-auto rounded-xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-gray-200'}`}>
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className={`text-left text-xs uppercase tracking-wider ${isDark ? 'text-neutral-500 border-b border-neutral-800' : 'text-gray-500 border-b border-gray-200'}`}>
                  <th className="px-4 py-3 font-medium">Sipariş</th>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium">Müşteri</th>
                  <th className="px-4 py-3 font-medium">Ürünler</th>
                  <th className="px-4 py-3 font-medium">Teslimat</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">Ödeme</th>
                  <th className="px-4 py-3 font-medium text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-neutral-800' : 'divide-gray-100'}`}>
                {orders.map((order, index) => {
                  const customer = order.customerId ? getCustomerById(order.customerId) : undefined;
                  const displayCustomerName = (order.customerName || '').trim() || customer?.name || 'Misafir';
                  const paymentStatus = order.payment?.status?.toLowerCase();
                  const paymentLogo = getPaymentLogoInfo(order.payment?.method);
                  const orderDate = new Date(order.createdAt);
                  const firstProduct = order.products[0];
                  const isSeen = seenOrderIds.has(order.id);

                  return (
                    <TableRowWrapper
                      key={order.id}
                      {...(enableListAnimations
                        ? {
                            initial: { opacity: 0, y: 10 },
                            animate: { opacity: 1, y: 0 },
                            transition: { delay: Math.min(index * 0.02, 0.2) },
                          }
                        : {})}
                      onClick={() => handleSelectOrder(order)}
                      style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 56px' }}
                      className={`cursor-pointer transition-colors ${isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-gray-50'} ${!isSeen ? 'outline-2 outline-purple-400/50' : ''}`}
                    >
                      {/* Sipariş No */}
                      <td className="px-4 py-3">
                        <span className={`font-mono font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>#{order.orderNumber}</span>
                      </td>

                      {/* Tarih */}
                      <td className={`${isDark ? 'text-neutral-300' : 'text-gray-700'} px-4 py-3`}>
                        <div className="text-sm">{orderDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</div>
                        <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{orderDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>

                      {/* Müşteri */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                              <HiOutlineUser className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`} />
                            </div>
                            {/* Müşteri sipariş sayısı badge */}
                            {(() => {
                              const orderNum = getCustomerOrderNumber(order);
                              if (orderNum.total > 1) {
                                return (
                                  <div className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 flex items-center justify-center rounded-full text-[8px] font-bold ${
                                    orderNum.total >= 5
                                      ? 'bg-amber-500 text-white'
                                      : orderNum.total >= 3
                                      ? 'bg-purple-500 text-white'
                                      : 'bg-blue-500 text-white'
                                  }`} title={`${orderNum.current}/${orderNum.total}`}>
                                    {orderNum.total}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-medium text-sm truncate max-w-[140px] ${isDark ? 'text-white' : 'text-gray-900'}`}>{displayCustomerName}</p>
                            <p className={`text-xs truncate max-w-[140px] ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{order.customerPhone ? formatPhoneNumber(order.customerPhone) : '-'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Ürünler */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {firstProduct && (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                              {firstProduct.image ? (
                                getMediaType(firstProduct.image) === 'video' ? (
                                  <video
                                    src={firstProduct.image}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                    preload="none"
                                  />
                                ) : (
                                  <Image src={firstProduct.image} alt={firstProduct.name} fill className="object-cover" sizes="40px" />
                                )
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                                  <HiOutlineClipboardList className="w-4 h-4 text-neutral-500" />
                                </div>
                              )}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className={`text-sm truncate max-w-[140px] ${isDark ? 'text-white' : 'text-gray-900'}`}>{firstProduct?.name || 'Ürün yok'}</p>
                            {order.products.length > 1 && (
                              <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>+{order.products.length - 1} ürün daha</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Teslimat */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <HiOutlineLocationMarker className={`w-4 h-4 shrink-0 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                          <span className={`text-sm truncate max-w-[120px] ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{order.delivery?.district || '-'}</span>
                        </div>
                        {order.delivery?.deliveryDate && (
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{formatDeliveryDateFriendly(order.delivery.deliveryDate, order.delivery.deliveryTimeSlot)}</p>
                        )}
                      </td>

                      {/* Durum */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered' ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') :
                          order.status === 'shipped' ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700') :
                          order.status === 'processing' || order.status === 'confirmed' ? (isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700') :
                          order.status === 'pending' ? (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700') :
                          order.status === 'cancelled' || order.status === 'payment_failed' ? (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700') :
                          (isDark ? 'bg-neutral-700 text-neutral-300' : 'bg-gray-100 text-gray-700')
                        }`}>
                          {statusConfig[order.status]?.icon}
                          {statusConfig[order.status]?.label || order.status}
                        </span>
                      </td>

                      {/* Ödeme */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {paymentLogo && (
                            <div
                              className={paymentLogo.containerClass(isDark)}
                              title={order.payment?.method === 'credit_card' ? 'Kredi Kartı (iyzico)' : order.payment?.method === 'bank_transfer' ? 'Havale/EFT (Garanti)' : ''}
                            >
                              <img src={paymentLogo.src} alt={paymentLogo.alt} className="h-4 w-auto" loading="lazy" />
                            </div>
                          )}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            paymentStatus === 'paid' 
                              ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                              : paymentStatus === 'pending' || paymentStatus === 'awaiting_payment'
                                ? (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700')
                                : (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700')
                          }`}>
                            {paymentStatus === 'paid' ? '✓ Ödendi' : paymentStatus === 'pending' ? 'Bekliyor' : paymentStatus === 'awaiting_payment' ? 'Havale' : 'Başarısız'}
                          </span>
                        </div>
                      </td>

                      {/* Tutar */}
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${paymentStatus === 'paid' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-white' : 'text-gray-900')}`}>{formatPrice(order.total)}</span>
                      </td>
                    </TableRowWrapper>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
      <FadeContent direction="up" delay={0.3}>
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl ${
          isDark ? 'bg-neutral-900/50 border border-neutral-800' : 'bg-white border border-gray-200 shadow-sm'
        }`}>
          {/* Sol: Sayfa başına göster */}
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Göster:</span>
            <div className={`flex items-center gap-1 p-1 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
              {itemsPerPageOptions.map(option => (
                <button
                  key={String(option)}
                  onClick={() => { setItemsPerPage(option as number | 'all'); setCurrentPage(1); }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    itemsPerPage === option
                      ? isDark ? 'bg-purple-500 text-white' : 'bg-purple-600 text-white shadow-sm'
                      : isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-700' : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  {option === 'all' ? 'Tümü' : option}
                </button>
              ))}
            </div>
            <span className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
              ({filteredOrders.length} sipariş)
            </span>
          </div>
          
          {/* Sağ: Sayfa numaraları - sadece pagination aktifse göster */}
          {totalPages > 1 && itemsPerPage !== 'all' && (
            <div className="flex items-center gap-2">
              <p className={`text-sm mr-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                Sayfa <span className="font-semibold">{currentPage}</span> / <span className="font-semibold">{totalPages}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105
                    ${isDark 
                      ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' 
                      : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  <HiOutlineChevronLeft className="w-4 h-4" />
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
                      className={`min-w-9 h-9 px-2.5 rounded-lg text-sm font-medium transition-all hover:scale-105
                        ${currentPage === page 
                          ? (isDark ? 'bg-purple-500 text-white' : 'bg-purple-600 text-white shadow-sm')
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
                  className={`p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105
                    ${isDark 
                      ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' 
                      : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  <HiOutlineChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </FadeContent>
      
      {/* Fullscreen order detail - Portal ile body'ye render et */}
      {isMounted && selectedOrder && createPortal(
        <AnimatePresence>
          <motion.div
            {...(enableModalAnimations
              ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
              : {})}
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
              {...(enableModalAnimations
                ? {
                    initial: { y: 40, opacity: 0 },
                    animate: { y: 0, opacity: 1 },
                    exit: { y: 40, opacity: 0 },
                    transition: { type: 'spring', stiffness: 320, damping: 34 },
                  }
                : {})}
              className={`absolute inset-2 sm:inset-4 lg:inset-10 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col backdrop-blur-2xl ${
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
              <div className={`flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b backdrop-blur-sm relative ${
                isDark ? 'border-neutral-800/50 bg-gradient-to-r from-neutral-950/50 via-neutral-900/30 to-neutral-950/50' : 'border-gray-200/50 bg-gradient-to-r from-white/50 via-gray-50/30 to-white/50'
              }`}
              style={{
                boxShadow: isDark ? '0 1px 20px rgba(168, 85, 247, 0.1)' : '0 1px 15px rgba(0, 0, 0, 0.05)'
              }}>
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="min-w-16 sm:min-w-24 h-14 sm:h-16 px-3 sm:px-4 rounded-2xl sm:rounded-3xl flex items-center justify-center bg-gradient-to-br from-[#e05a4c] to-[#f5a524] text-white font-extrabold text-xl sm:text-2xl whitespace-nowrap relative overflow-hidden group"
                    style={{
                      boxShadow: '0 4px 20px rgba(224, 90, 76, 0.4), 0 0 40px rgba(245, 165, 36, 0.2)'
                    }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="relative z-10">#{selectedOrder.orderNumber}</span>
                  </div>
                  {(() => {
                    const paymentLogo = getPaymentLogoInfo(selectedOrder.payment?.method);
                    if (!paymentLogo) return null;
                    return (
                      <div
                        className={`${paymentLogo.containerClass(isDark)} !h-12 sm:!h-14 !w-auto px-4 sm:px-5`}
                        title={selectedOrder.payment?.method === 'credit_card' ? 'Kredi Kartı (iyzico)' : selectedOrder.payment?.method === 'bank_transfer' ? 'Havale/EFT (Garanti)' : ''}
                      >
                        <img src={paymentLogo.src} alt={paymentLogo.alt} className="h-7 sm:h-9 w-auto" loading="lazy" />
                      </div>
                    );
                  })()}
                  <div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <h3 className={`text-xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Sipariş Detayı</h3>
                      <StatusBadge
                        status={statusConfig[selectedOrder.status]?.variant || 'info'}
                        text={statusConfig[selectedOrder.status]?.label || selectedOrder.status || 'Bilinmiyor'}
                        pulse={selectedOrder.status === 'pending'}
                        size="md"
                        className="text-sm sm:text-base"
                      />
                    </div>
                    <p className={`text-sm sm:text-base ${isDark ? 'text-neutral-300' : 'text-gray-600'}`}>Oluşturulma: {formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => { if (printRef.current) openPrintableWindow(printRef.current); }}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1 sm:gap-2 transition-all duration-300 ${
                      isDark 
                        ? 'bg-neutral-900/80 text-neutral-200 hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-700/20 hover:-translate-y-0.5' 
                        : 'bg-gray-100/80 text-gray-800 hover:bg-gray-200 hover:shadow-lg hover:shadow-gray-400/20 hover:-translate-y-0.5'
                    }`}
                  >
                    <HiOutlinePrinter className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Yazdır</span>
                  </button>
                  <button
                    onClick={() => { if (printRef.current) downloadPdfClientSide(printRef.current, `siparis-${selectedOrder?.orderNumber || 'order'}.pdf`); }}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1 sm:gap-2 transition-all duration-300 ${
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
                  <div className={`p-3 sm:p-6 space-y-3 sm:space-y-4 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
                    <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                      isDark 
                        ? 'bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/50 hover:border-neutral-700 hover:shadow-xl hover:shadow-purple-500/5' 
                        : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-400/10'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm font-semibold ${isDark ? 'text-neutral-200' : 'text-gray-700'}`}>Müşteri</p>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const orderNum = getCustomerOrderNumber(selectedOrder);
                            if (orderNum.total > 1) {
                              return (
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                  orderNum.total >= 5 
                                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30'
                                    : orderNum.total >= 3
                                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30'
                                    : isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {orderNum.total >= 5 ? '⭐ Sadık Müşteri' : orderNum.total >= 3 ? '💎 VIP' : `${orderNum.current}. Sipariş`} ({orderNum.total} toplam)
                                </span>
                              );
                            }
                            return null;
                          })()}
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${selectedOrder.isGuest ? (isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700') : (isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700')}`}>
                            {selectedOrder.isGuest ? 'Misafir' : 'Üye'}
                          </span>
                        </div>
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
                          <HiOutlinePhone className="w-4 h-4" /> {formatPhoneNumber(selectedOrder.customerPhone)}
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
                              <HiOutlinePhone className="w-4 h-4" /> {formatPhoneNumber(selectedOrder.delivery.recipientPhone)}
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
                        <div className="flex items-center gap-2">
                          {(() => {
                            const paymentLogo = getPaymentLogoInfo(selectedOrder.payment?.method);
                            if (!paymentLogo) return null;
                            return (
                              <div
                                className={paymentLogo.containerClass(isDark)}
                                title={selectedOrder.payment?.method === 'credit_card' ? 'Kredi Kartı (iyzico)' : selectedOrder.payment?.method === 'bank_transfer' ? 'Havale/EFT (Garanti)' : ''}
                              >
                                <img src={paymentLogo.src} alt={paymentLogo.alt} className="h-4 w-auto" loading="lazy" />
                              </div>
                            );
                          })()}
                          <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                            {selectedOrder.payment.method === 'credit_card' ? '💳 Kredi Kartı' : selectedOrder.payment.method === 'bank_transfer' ? '🏦 Havale/EFT' : '💵 Kapıda Ödeme'}
                            {selectedOrder.payment.cardLast4 && ` (**** ${selectedOrder.payment.cardLast4})`}
                          </p>
                        </div>
                        {selectedOrder.payment.transactionId && (
                          <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>İşlem: {selectedOrder.payment.transactionId}</p>
                        )}
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-neutral-950 border border-neutral-800' : 'bg-gray-50 border border-gray-200'}`}>
                          <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                            Cihaz & Tarayıcı
                          </p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {/* Cihaz Tipi */}
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
                              selectedOrder.payment.clientInfo?.deviceType === 'mobile' 
                                ? 'bg-blue-500/15 text-blue-400' 
                                : selectedOrder.payment.clientInfo?.deviceType === 'tablet'
                                ? 'bg-purple-500/15 text-purple-400'
                                : 'bg-gray-500/15 text-gray-400'
                            }`}>
                              {selectedOrder.payment.clientInfo?.deviceType === 'mobile' ? '📱' : 
                               selectedOrder.payment.clientInfo?.deviceType === 'tablet' ? '📱' : '💻'}
                              {(selectedOrder.payment.clientInfo?.deviceType || 'Bilinmiyor').replace(/^(\w)/, (m: string) => m.toUpperCase())}
                            </span>
                            
                            {/* İşletim Sistemi */}
                            {selectedOrder.payment.clientInfo?.os && selectedOrder.payment.clientInfo.os !== 'Bilinmiyor' && (
                              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
                                selectedOrder.payment.clientInfo.os.toLowerCase().includes('ios') 
                                  ? 'bg-gray-500/15 text-gray-300' 
                                  : selectedOrder.payment.clientInfo.os.toLowerCase().includes('android')
                                  ? 'bg-green-500/15 text-green-400'
                                  : selectedOrder.payment.clientInfo.os.toLowerCase().includes('windows')
                                  ? 'bg-blue-500/15 text-blue-400'
                                  : selectedOrder.payment.clientInfo.os.toLowerCase().includes('mac')
                                  ? 'bg-gray-500/15 text-gray-300'
                                  : 'bg-neutral-500/15 text-neutral-400'
                              }`}>
                                {selectedOrder.payment.clientInfo.os.toLowerCase().includes('ios') ? '🍎' :
                                 selectedOrder.payment.clientInfo.os.toLowerCase().includes('android') ? '🤖' :
                                 selectedOrder.payment.clientInfo.os.toLowerCase().includes('windows') ? '🪟' :
                                 selectedOrder.payment.clientInfo.os.toLowerCase().includes('mac') ? '🍎' : '💿'}
                                {selectedOrder.payment.clientInfo.os}
                              </span>
                            )}
                            
                            {/* Cihaz Modeli */}
                            {selectedOrder.payment.clientInfo?.deviceModel && (
                              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
                                isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-700'
                              }`}>
                                📲 {selectedOrder.payment.clientInfo.deviceModel}
                              </span>
                            )}
                            
                            {/* Tarayıcı */}
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
                              isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-cyan-100 text-cyan-700'
                            }`}>
                              🌐 {selectedOrder.payment.clientInfo?.browser || 'Bilinmiyor'}
                              {selectedOrder.payment.clientInfo?.browserVersion ? ` v${selectedOrder.payment.clientInfo.browserVersion}` : ''}
                            </span>
                          </div>
                          <details className="group">
                            <summary className={`text-[10px] cursor-pointer hover:underline ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                              User Agent detayı
                            </summary>
                            <p className={`text-[10px] mt-1 leading-snug break-all ${isDark ? 'text-neutral-600' : 'text-gray-400'}`}>
                              {selectedOrder.payment.clientInfo?.userAgent || 'Kullanıcı aracısı yok'}
                            </p>
                          </details>
                        </div>
                        
                        {/* Traffic Source - Trafik Kaynağı */}
                        {(selectedOrder as any).trafficSource && (
                          <div className={`p-3 rounded-xl ${isDark ? 'bg-neutral-950 border border-neutral-800' : 'bg-gray-50 border border-gray-200'}`}>
                            <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                              📊 Trafik Kaynağı
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {/* Kaynak */}
                              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
                                (selectedOrder as any).trafficSource === 'google' 
                                  ? 'bg-blue-500/15 text-blue-400' 
                                  : (selectedOrder as any).trafficSource === 'instagram'
                                  ? 'bg-pink-500/15 text-pink-400'
                                  : (selectedOrder as any).trafficSource === 'facebook'
                                  ? 'bg-blue-600/15 text-blue-400'
                                  : (selectedOrder as any).trafficSource === 'tiktok'
                                  ? 'bg-purple-500/15 text-purple-400'
                                  : (selectedOrder as any).trafficSource === 'direct'
                                  ? 'bg-gray-500/15 text-gray-400'
                                  : 'bg-cyan-500/15 text-cyan-400'
                              }`}>
                                {(selectedOrder as any).trafficSource === 'google' && '🔍'}
                                {(selectedOrder as any).trafficSource === 'instagram' && '📷'}
                                {(selectedOrder as any).trafficSource === 'facebook' && '👥'}
                                {(selectedOrder as any).trafficSource === 'tiktok' && '🎵'}
                                {(selectedOrder as any).trafficSource === 'youtube' && '📺'}
                                {(selectedOrder as any).trafficSource === 'twitter' && '🐦'}
                                {(selectedOrder as any).trafficSource === 'direct' && '➡️'}
                                {(selectedOrder as any).trafficSource === 'referral' && '🔗'}
                                {' '}
                                {((selectedOrder as any).trafficSource || 'Bilinmiyor').charAt(0).toUpperCase() + ((selectedOrder as any).trafficSource || 'bilinmiyor').slice(1)}
                              </span>
                              
                              {/* Medium */}
                              {(selectedOrder as any).trafficMedium && (
                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
                                  isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {(selectedOrder as any).trafficMedium === 'organic' && '🌱 Organik'}
                                  {(selectedOrder as any).trafficMedium === 'cpc' && '💰 Reklam'}
                                  {(selectedOrder as any).trafficMedium === 'social' && '👥 Sosyal'}
                                  {(selectedOrder as any).trafficMedium === 'email' && '📧 E-posta'}
                                  {(selectedOrder as any).trafficMedium === 'referral' && '🔗 Yönlendirme'}
                                  {!['organic', 'cpc', 'social', 'email', 'referral', 'none'].includes((selectedOrder as any).trafficMedium) && (selectedOrder as any).trafficMedium}
                                </span>
                              )}
                              
                              {/* Campaign */}
                              {(selectedOrder as any).trafficCampaign && (
                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
                                  isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  🎯 {(selectedOrder as any).trafficCampaign}
                                </span>
                              )}
                            </div>
                            
                            {/* Referrer Details */}
                            {(selectedOrder as any).trafficReferrer && (
                              <details className="group mt-2">
                                <summary className={`text-[10px] cursor-pointer hover:underline ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                                  Referrer URL
                                </summary>
                                <p className={`text-[10px] mt-1 leading-snug break-all ${isDark ? 'text-neutral-600' : 'text-gray-400'}`}>
                                  {(selectedOrder as any).trafficReferrer}
                                </p>
                              </details>
                            )}
                          </div>
                        )}
                        
                        {reminderInfo.shown && (
                          <div className={`p-3 rounded-xl border ${isDark ? 'bg-amber-500/5 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                            <p className={`text-xs font-semibold ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>Hatırlatma Gösterildi</p>
                            <p className={`text-sm mt-1 ${isDark ? 'text-neutral-100' : 'text-gray-800'}`}>
                              Ödeme adımına dönüş için kullanıcıya hatırlatma penceresi gösterildi.
                            </p>
                            {(reminderInfo.at || reminderInfo.channel) && (
                              <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                                {reminderInfo.at ? `Gösterim: ${formatDate(reminderInfo.at)}` : ''}
                                {reminderInfo.at && reminderInfo.channel ? ' • ' : ''}
                                {reminderInfo.channel ? `Kanal: ${reminderInfo.channel}` : ''}
                              </p>
                            )}
                            {reminderActions.hasAction && (
                              <div className={`mt-2 p-2 rounded-lg ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-amber-100'}`}>
                                <p className={`text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>Kullanıcı Etkileşimi</p>
                                <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-700'}`}>
                                  {reminderActions.lastAction ? `Son aksiyon: ${reminderActions.lastAction}` : 'Son aksiyon kaydı yok.'}
                                  {reminderActions.lastAt ? ` • Zaman: ${formatDate(reminderActions.lastAt)}` : ''}
                                </p>
                                {(reminderActions.resumeCount > 0 || reminderActions.dismissCount > 0) && (
                                  <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-700'}`}>
                                    {reminderActions.resumeCount > 0 ? `Ödemeye geç: ${reminderActions.resumeCount}×` : ''}
                                    {reminderActions.resumeCount > 0 && reminderActions.dismissCount > 0 ? ' • ' : ''}
                                    {reminderActions.dismissCount > 0 ? `Sepete dön/kapat: ${reminderActions.dismissCount}×` : ''}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
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
                              getMediaType(product.image) === 'video' ? (
                                <video
                                  src={product.image}
                                  className="w-full h-full object-cover"
                                  muted
                                  loop
                                  playsInline
                                  autoPlay={enableModalAnimations}
                                  preload="none"
                                />
                              ) : (
                                <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                              )
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
                        {canRefund(selectedOrder) && (
                          <button
                            onClick={() => {
                              setRefundOrder(selectedOrder);
                              setShowRefundModal(true);
                            }}
                            className="col-span-2 px-4 py-2.5 rounded-xl font-semibold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300"
                          >
                            💰 İade Yap
                          </button>
                        )}
                        {selectedOrder.status === 'refunded' && (
                          <div className="col-span-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                            <div className="flex items-center gap-2 text-emerald-400">
                              <span>✓</span>
                              <span className="text-sm font-semibold">İade Tamamlandı</span>
                            </div>
                            {(selectedOrder as any).refund?.amount && (
                              <p className="text-xs text-emerald-400/70 mt-1">
                                Tutar: ₺{((selectedOrder as any).refund.amount || 0).toLocaleString('tr-TR')}
                              </p>
                            )}
                          </div>
                        )}
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

      {/* Delete Confirmation Modal */}
      {isMounted && deleteConfirmOrder && createPortal(
        <AnimatePresence>
          <motion.div
            {...(enableModalAnimations
              ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
              : {})}
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              {...(enableModalAnimations
                ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
                : {})}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isDeleting && setDeleteConfirmOrder(null)}
            />
            
            {/* Modal */}
            <motion.div
              {...(enableModalAnimations
                ? {
                    initial: { opacity: 0, scale: 0.95, y: 20 },
                    animate: { opacity: 1, scale: 1, y: 0 },
                    exit: { opacity: 0, scale: 0.95, y: 20 },
                  }
                : {})}
              className={`relative w-full max-w-md rounded-3xl p-6 shadow-2xl ${
                isDark 
                  ? 'bg-neutral-900 border border-neutral-800' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              {/* Warning Icon */}
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isDark ? 'bg-red-500/20' : 'bg-red-100'
              }`}>
                <HiOutlineTrash className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              
              {/* Title */}
              <h3 className={`text-xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Siparişi Sil
              </h3>
              
              {/* Description */}
              <p className={`text-center mb-6 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                <span className="font-semibold">#{deleteConfirmOrder.orderNumber}</span> numaralı siparişi silmek istediğinize emin misiniz? 
                <br />
                <span className="text-sm text-red-500">Bu işlem geri alınamaz.</span>
              </p>
              
              {/* Order Info */}
              <div className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                    isDark ? 'bg-purple-500/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {(deleteConfirmOrder.customerName || 'M').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {deleteConfirmOrder.customerName || 'Müşteri'}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                      {formatPrice(deleteConfirmOrder.total)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmOrder(null)}
                  disabled={isDeleting}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                    isDark 
                      ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  İptal
                </button>
                <button
                  onClick={() => handleDeleteOrder(deleteConfirmOrder)}
                  disabled={isDeleting}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    isDark 
                      ? 'bg-red-500/80 text-white hover:bg-red-500' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  } ${isDeleting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Siliniyor...
                    </>
                  ) : (
                    <>
                      <HiOutlineTrash className="w-4 h-4" />
                      Sil
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Refund Modal */}
      {isMounted && showRefundModal && refundOrder && createPortal(
        <AnimatePresence>
          <motion.div
            {...(enableModalAnimations
              ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
              : {})}
            className="fixed inset-0 z-[100001] flex items-center justify-center p-4"
          >
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !refundLoading && setShowRefundModal(false)}
            />
            <motion.div
              {...(enableModalAnimations
                ? {
                    initial: { opacity: 0, scale: 0.95, y: 20 },
                    animate: { opacity: 1, scale: 1, y: 0 },
                    exit: { opacity: 0, scale: 0.95, y: 20 },
                    transition: { type: 'spring', damping: 30, stiffness: 400 },
                  }
                : {})}
              className={`relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl ${
                isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200'
              }`}
            >
              <div className={`p-6 border-b ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20">
                    <span className="text-xl">💰</span>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>İade İşlemi</h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      Sipariş #{refundOrder.orderNumber}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Müşteri</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {refundOrder.customerName || 'Müşteri'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>İade Tutarı</span>
                    <span className="font-bold text-lg text-amber-500">
                      {formatPrice(refundOrder.total)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    İade Sebebi
                  </label>
                  <select
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      isDark 
                        ? 'bg-neutral-800 border-neutral-700 text-white focus:border-amber-500' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-amber-500'
                    } outline-none`}
                  >
                    <option value="">Sebep seçin...</option>
                    <option value="Müşteri talebi">Müşteri talebi</option>
                    <option value="Ürün hasarlı">Ürün hasarlı</option>
                    <option value="Yanlış ürün gönderildi">Yanlış ürün gönderildi</option>
                    <option value="Teslimat yapılamadı">Teslimat yapılamadı</option>
                    <option value="Ödeme hatası">Ödeme hatası</option>
                    <option value="Sipariş iptal edildi">Sipariş iptal edildi</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div className={`p-3 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'}`}>
                  <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                    ⚠️ İade işlemi geri alınamaz. Müşteriye otomatik e-posta bildirimi gönderilecektir.
                  </p>
                </div>
              </div>

              <div className={`flex gap-3 p-6 pt-0`}>
                <button
                  onClick={() => setShowRefundModal(false)}
                  disabled={refundLoading}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                    isDark 
                      ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${refundLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  İptal
                </button>
                <button
                  onClick={handleRefund}
                  disabled={refundLoading || !refundReason}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    isDark 
                      ? 'bg-amber-500/80 text-white hover:bg-amber-500' 
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  } ${refundLoading || !refundReason ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {refundLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      💰 İade Yap
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
