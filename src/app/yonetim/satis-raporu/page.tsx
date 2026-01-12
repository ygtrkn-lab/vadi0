'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MediaImage from '@/components/MediaImage';
import { SpotlightCard, FadeContent } from '@/components/admin';
import { GradientText, ShinyText } from '@/components/ui-kit';
import { useTheme } from '../ThemeContext';
import { useOrder } from '@/context/OrderContext';
import { 
  HiOutlineTrendingUp,
  HiOutlineCurrencyDollar,
  HiOutlineShoppingCart,
  HiOutlineRefresh,
  HiOutlineChartBar,
  HiOutlineEye,
  HiOutlineCheckCircle,
  HiOutlineCalendar,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineGlobeAlt,
  HiOutlineUser,
  HiOutlineLocationMarker,
  HiOutlineClipboardList
} from 'react-icons/hi';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  slug: string;
  category: string;
}

interface ProductSalesData {
  productId: string;
  productName: string;
  productImage: string;
  productSlug: string;
  productCategory: string;
  productPrice: number;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

type TimeFilter = 'today' | 'yesterday' | '2days' | '3days' | '4days' | '5days' | '6days' | 'week' | 'month' | 'year' | 'custom' | 'all';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

// Tarih yardımcı fonksiyonları
const getStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const getDateRange = (filter: TimeFilter, customRange: DateRange): { start: Date; end: Date } | null => {
  const now = new Date();
  
  switch (filter) {
    case 'today':
      return { start: getStartOfDay(now), end: getEndOfDay(now) };
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return { start: getStartOfDay(yesterday), end: getEndOfDay(yesterday) };
    }
    case '2days': {
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(now.getDate() - 2);
      return { start: getStartOfDay(twoDaysAgo), end: getEndOfDay(twoDaysAgo) };
    }
    case '3days': {
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(now.getDate() - 3);
      return { start: getStartOfDay(threeDaysAgo), end: getEndOfDay(threeDaysAgo) };
    }
    case '4days': {
      const fourDaysAgo = new Date(now);
      fourDaysAgo.setDate(now.getDate() - 4);
      return { start: getStartOfDay(fourDaysAgo), end: getEndOfDay(fourDaysAgo) };
    }
    case '5days': {
      const fiveDaysAgo = new Date(now);
      fiveDaysAgo.setDate(now.getDate() - 5);
      return { start: getStartOfDay(fiveDaysAgo), end: getEndOfDay(fiveDaysAgo) };
    }
    case '6days': {
      const sixDaysAgo = new Date(now);
      sixDaysAgo.setDate(now.getDate() - 6);
      return { start: getStartOfDay(sixDaysAgo), end: getEndOfDay(sixDaysAgo) };
    }
    case 'week': {
      // Bu haftanın pazartesi günü (haftanın başı)
      const weekStart = new Date(now);
      const dayOfWeek = weekStart.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Pazartesi = 0
      weekStart.setDate(weekStart.getDate() - diff);
      return { start: getStartOfDay(weekStart), end: getEndOfDay(now) };
    }
    case 'month': {
      // Bu ayın 1'i
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: getStartOfDay(monthStart), end: getEndOfDay(now) };
    }
    case 'year': {
      // Bu yılın 1 Ocak'ı
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return { start: getStartOfDay(yearStart), end: getEndOfDay(now) };
    }
    case 'custom':
      if (customRange.start && customRange.end) {
        return { start: getStartOfDay(customRange.start), end: getEndOfDay(customRange.end) };
      }
      return null;
    case 'all':
    default:
      return null;
  }
};

export default function SatisRaporuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [paidOrders, setPaidOrders] = useState<any[]>([]);
  const [serverStats, setServerStats] = useState<{ totalProducts: number; totalQuantity: number; totalRevenue: number; totalOrders: number } | null>(null);
  const [serverSales, setServerSales] = useState<ProductSalesData[]>([]);
  const [serverDistricts, setServerDistricts] = useState<Array<{ district: string; province: string; orderCount: number; revenue: number; productCount: number }>>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ start: null, end: null });
  const { isDark } = useTheme();
  
  // Dinamik sipariş verileri - OrderContext'ten (real-time güncellenir)
  const { state: orderState } = useOrder();

  // Ürünleri yükle
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Ürünler yüklenemedi:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Sunucudan gerçek satış raporunu getir (kesin ödenmiş + tarih filtresi)
  useEffect(() => {
    const fetchReport = async () => {
      setReportLoading(true);
      setReportError(null);
      try {
        const range = getDateRange(timeFilter, customDateRange);
        const params = new URLSearchParams();
        if (range?.start) params.set('start', range.start.toISOString());
        if (range?.end) params.set('end', range.end.toISOString());
        const url = `/api/admin/sales-report${params.toString() ? `?${params.toString()}` : ''}`;
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setPaidOrders(Array.isArray(data.paidOrders) ? data.paidOrders : []);
        setServerStats(data.stats || null);
        setServerSales(Array.isArray(data.sales) ? data.sales : []);
        setServerDistricts(Array.isArray(data.districtSales) ? data.districtSales : []);
      } catch (err: any) {
        console.error('Satış raporu alınamadı:', err);
        setReportError(err?.message || 'Rapor alınamadı');
      } finally {
        setReportLoading(false);
      }
    };
    fetchReport();
  }, [timeFilter, customDateRange]);

  // Son güncelleme zamanını takip et
  useEffect(() => {
    setLastUpdated(new Date());
  }, [paidOrders]);

  // ✅ KESİN ÖDENEN SİPARİŞLERDEN SATIŞ VERİLERİNİ HESAPLA
  const salesData = useMemo(() => {
    // Öncelik: Sunucudan gelen gerçek veri; yoksa OrderContext'e düş
    const orders = (paidOrders && paidOrders.length > 0) ? paidOrders : (orderState.orders || []);
    
    // Debug: Siparişlerin payment durumlarını logla
    console.log('📊 Satış Raporu - Toplam sipariş:', orders.length);
    console.log('📊 Payment durumları:', orders.map(o => ({
      id: o.orderNumber,
      paymentStatus: o.payment?.status,
      status: o.status
    })));
    
    // Negatif statüleri hariç tut (iade, iptal, başarısız)
    const negativeStatuses = ['refunded', 'cancelled', 'canceled', 'failed', 'payment_failed'];
    
    // Sadece kesin ödenmiş ve negatif durumda olmayan siparişler
    let paidOnly = orders.filter((o: any) => 
      o.payment?.status === 'paid' && 
      !negativeStatuses.includes(o.status)
    );
    
    // Tarih filtreleme
    const dateRange = getDateRange(timeFilter, customDateRange);
    if (dateRange) {
      paidOnly = paidOnly.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= dateRange.start && orderDate <= dateRange.end;
      });
    }
    
    console.log('📊 Ödenmiş sipariş sayısı:', paidOnly.length);
    
    // Debug: İlk ödenmiş siparişin ürünlerini logla
    if (paidOnly.length > 0) {
      console.log('📊 İlk ödenmiş sipariş ürünleri:', paidOnly[0].products);
    }
    
    // Ürün bazlı satış verileri
    const productSalesMap = new Map<string, ProductSalesData>();
    
    paidOnly.forEach(order => {
      const orderProducts = order.products || [];
      console.log('📊 Sipariş #' + order.orderNumber + ' ürün sayısı:', orderProducts.length);
      orderProducts.forEach(item => {
        // Veritabanında "id" veya "productId" olabilir
        const productId = String(item.productId || item.id || '');
        console.log('📊 Ürün:', { productId, name: item.name, quantity: item.quantity });
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        
        if (!productId) {
          console.log('📊 ⚠️ productId yok, atlıyorum');
          return;
        }
        
        const existing = productSalesMap.get(productId);
        if (existing) {
          existing.totalQuantity += quantity;
          existing.totalRevenue += price * quantity;
          existing.orderCount += 1;
        } else {
          // Ürün bilgisini products listesinden al (id string veya number olabilir)
          const productInfo = products.find(p => String(p.id) === String(productId));
          productSalesMap.set(productId, {
            productId,
            productName: item.name || productInfo?.name || `Ürün #${productId}`,
            productImage: item.image || productInfo?.image || '',
            productSlug: productInfo?.slug || '',
            productCategory: productInfo?.category || '',
            productPrice: price || productInfo?.price || 0,
            totalQuantity: quantity,
            totalRevenue: price * quantity,
            orderCount: 1
          });
        }
      });
    });
    
    // Satış adedine göre sırala (en çok satan üstte)
    const sortedSales = Array.from(productSalesMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
    
    // Bölgesel satış verileri (ilçe bazlı)
    const districtSalesMap = new Map<string, { district: string; province: string; orderCount: number; revenue: number; productCount: number }>();
    
    paidOrders.forEach(order => {
      const district = order.delivery?.district || 'Bilinmiyor';
      const province = order.delivery?.province || 'İstanbul';
      const orderTotal = order.total || 0;
      const productCount = (order.products || []).reduce((sum, p) => sum + (p.quantity || 1), 0);
      
      const existing = districtSalesMap.get(district);
      if (existing) {
        existing.orderCount += 1;
        existing.revenue += orderTotal;
        existing.productCount += productCount;
      } else {
        districtSalesMap.set(district, {
          district,
          province,
          orderCount: 1,
          revenue: orderTotal,
          productCount
        });
      }
    });
    
    const sortedDistricts = Array.from(districtSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue);
    
    // Toplam istatistikler
    const totalStats = {
      totalProducts: sortedSales.length,
      totalQuantity: sortedSales.reduce((sum, p) => sum + p.totalQuantity, 0),
      totalRevenue: sortedSales.reduce((sum, p) => sum + p.totalRevenue, 0),
      totalOrders: paidOnly.length
    };
    
    return { sales: sortedSales, stats: totalStats, paidOrders: paidOnly, districtSales: sortedDistricts };
  }, [paidOrders, orderState.orders, products, timeFilter, customDateRange]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Filtre etiketlerini al
  const getFilterLabel = useCallback(() => {
    const now = new Date();
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    const getDateLabel = (daysAgo: number) => {
      const date = new Date(now);
      date.setDate(now.getDate() - daysAgo);
      return `${date.getDate()} ${monthNames[date.getMonth()]} ${dayNames[date.getDay()]}`;
    };
    
    switch (timeFilter) {
      case 'today': return `Bugün (${getDateLabel(0)})`;
      case 'yesterday': return `Dün (${getDateLabel(1)})`;
      case '2days': return getDateLabel(2);
      case '3days': return getDateLabel(3);
      case '4days': return getDateLabel(4);
      case '5days': return getDateLabel(5);
      case '6days': return getDateLabel(6);
      case 'week': return 'Bu Hafta';
      case 'month': return 'Bu Ay';
      case 'year': return 'Bu Yıl';
      case 'custom': 
        if (customDateRange.start && customDateRange.end) {
          return `${formatDate(customDateRange.start)} - ${formatDate(customDateRange.end)}`;
        }
        return 'Özel Tarih';
      case 'all':
      default: return 'Tüm Zamanlar';
    }
  }, [timeFilter, customDateRange]);

  // Filtre uygula
  const applyFilter = (filter: TimeFilter) => {
    setTimeFilter(filter);
    if (filter !== 'custom') {
      setShowDateModal(false);
    }
  };

  // Özel tarih uygula
  const applyCustomDate = () => {
    if (customDateRange.start && customDateRange.end) {
      setTimeFilter('custom');
      setShowDateModal(false);
    }
  };

  // Ürünler veya siparişler yükleniyorsa loading göster
  if (loading || reportLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Tarih Filtre Modal */}
      <AnimatePresence>
        {showDateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDateModal(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-neutral-900' : 'bg-white'}`}
            >
              {/* Modal Header */}
              <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/20">
                    <HiOutlineCalendar className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Zaman Aralığı</h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Rapor için tarih seçin</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDateModal(false)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>

              {/* Hızlı Seçenekler */}
              <div className="p-6 space-y-3">
                <p className={`text-xs font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                  Yakın Zamanlar
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {(() => {
                    const now = new Date();
                    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
                    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
                    
                    const getDateInfo = (daysAgo: number) => {
                      const date = new Date(now);
                      date.setDate(now.getDate() - daysAgo);
                      const dayName = dayNames[date.getDay()];
                      const day = date.getDate();
                      const month = monthNames[date.getMonth()];
                      return { dayName, day, month };
                    };
                    
                    return [
                      { id: 'today', daysAgo: 0, special: 'Bugün' },
                      { id: 'yesterday', daysAgo: 1, special: 'Dün' },
                      { id: '2days', daysAgo: 2 },
                      { id: '3days', daysAgo: 3 },
                      { id: '4days', daysAgo: 4 },
                      { id: '5days', daysAgo: 5 },
                      { id: '6days', daysAgo: 6 },
                    ].map(item => {
                      const info = getDateInfo(item.daysAgo);
                      return {
                        id: item.id,
                        label: item.special || `${info.day} ${info.month}`,
                        sub: item.special ? `${info.day} ${info.month}` : info.dayName,
                      };
                    });
                  })().map((option, index) => (
                    <button
                      key={option.id}
                      onClick={() => applyFilter(option.id as TimeFilter)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                        timeFilter === option.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : isDark
                            ? 'border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <HiOutlineCalendar className={`w-5 h-5 mb-1 ${
                        timeFilter === option.id 
                          ? 'text-purple-500' 
                          : index === 0 
                            ? 'text-emerald-500' 
                            : isDark ? 'text-neutral-400' : 'text-gray-500'
                      }`} />
                      <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {option.label}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                        {option.sub}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Dönemler */}
                <p className={`text-xs font-medium uppercase tracking-wider mt-6 mb-4 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                  Dönemler
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'week', label: 'Bu Hafta', Icon: HiOutlineClock },
                    { id: 'month', label: 'Bu Ay', Icon: HiOutlineCalendar },
                    { id: 'year', label: 'Bu Yıl', Icon: HiOutlineChartBar },
                    { id: 'all', label: 'Tümü', Icon: HiOutlineGlobeAlt },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => applyFilter(option.id as TimeFilter)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                        timeFilter === option.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : isDark
                            ? 'border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <option.Icon className={`w-5 h-5 mb-1 ${
                        timeFilter === option.id ? 'text-purple-500' : isDark ? 'text-neutral-400' : 'text-gray-500'
                      }`} />
                      <span className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Özel Tarih Aralığı */}
                <div className={`mt-6 pt-6 border-t ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                  <p className={`text-xs font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Özel Tarih Aralığı
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        Başlangıç
                      </label>
                      <input
                        type="date"
                        value={customDateRange.start ? customDateRange.start.toISOString().split('T')[0] : ''}
                        onChange={(e) => setCustomDateRange(prev => ({ 
                          ...prev, 
                          start: e.target.value ? new Date(e.target.value) : null 
                        }))}
                        className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                          isDark 
                            ? 'bg-neutral-800 border-neutral-700 text-white focus:border-purple-500' 
                            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-purple-500'
                        } outline-none`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        Bitiş
                      </label>
                      <input
                        type="date"
                        value={customDateRange.end ? customDateRange.end.toISOString().split('T')[0] : ''}
                        onChange={(e) => setCustomDateRange(prev => ({ 
                          ...prev, 
                          end: e.target.value ? new Date(e.target.value) : null 
                        }))}
                        className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                          isDark 
                            ? 'bg-neutral-800 border-neutral-700 text-white focus:border-purple-500' 
                            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-purple-500'
                        } outline-none`}
                      />
                    </div>
                  </div>
                  <button
                    onClick={applyCustomDate}
                    disabled={!customDateRange.start || !customDateRange.end}
                    className={`w-full mt-4 py-3 px-4 rounded-xl font-medium transition-all ${
                      customDateRange.start && customDateRange.end
                        ? 'bg-purple-500 hover:bg-purple-600 text-white'
                        : isDark
                          ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Özel Tarihi Uygula
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <FadeContent direction="up" delay={0}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <HiOutlineChartBar className="w-8 h-8 text-purple-500" />
              <GradientText>Satış Raporu</GradientText>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <HiOutlineCheckCircle className="w-4 h-4 text-emerald-500" />
              <ShinyText 
                text="Sadece kesin ödenmiş siparişler" 
                speed={4} 
                className={`${isDark ? '' : 'text-gray-500!'}`}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Tarih Filtre Butonu */}
            <button
              onClick={() => setShowDateModal(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                timeFilter !== 'all'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30'
                  : isDark 
                    ? 'bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <HiOutlineCalendar className="w-5 h-5" />
              <span>{getFilterLabel()}</span>
            </button>

            {/* Son güncelleme */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? 'bg-neutral-800/50' : 'bg-gray-100'}`}>
              <HiOutlineRefresh className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-gray-500'} animate-spin`} style={{ animationDuration: '3s' }} />
              <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                Son güncelleme: {formatTime(lastUpdated)}
              </span>
            </div>
          </div>
        </div>
      </FadeContent>

      {/* Özet İstatistikler */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <FadeContent direction="up" delay={0.1}>
          <SpotlightCard className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <HiOutlineShoppingCart className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Ödenmiş Sipariş</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{serverStats?.totalOrders ?? salesData.stats.totalOrders}</p>
              </div>
            </div>
          </SpotlightCard>
        </FadeContent>

        <FadeContent direction="up" delay={0.15}>
          <SpotlightCard className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10">
                <HiOutlineTrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Satılan Ürün</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{serverStats?.totalQuantity ?? salesData.stats.totalQuantity}</p>
              </div>
            </div>
          </SpotlightCard>
        </FadeContent>

        <FadeContent direction="up" delay={0.2}>
          <SpotlightCard className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <HiOutlineCurrencyDollar className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Kesin Gelir</p>
                <p className={`text-xl font-bold text-emerald-500`}>{formatPrice(serverStats?.totalRevenue ?? salesData.stats.totalRevenue)}</p>
              </div>
            </div>
          </SpotlightCard>
        </FadeContent>

        <FadeContent direction="up" delay={0.25}>
          <SpotlightCard className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <HiOutlineEye className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Farklı Ürün</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{serverStats?.totalProducts ?? salesData.stats.totalProducts}</p>
              </div>
            </div>
          </SpotlightCard>
        </FadeContent>
      </div>

      {/* Ürün Satış Tablosu */}
      <FadeContent direction="up" delay={0.3}>
        <SpotlightCard className="p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              En Çok Satılan Ürünler
            </h2>
            <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              {salesData.sales.length} ürün satıldı
            </span>
          </div>

              { (serverSales?.length ?? salesData.sales.length) === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              <HiOutlineShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Henüz kesin ödenmiş sipariş yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:-mx-6">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className={`text-left text-xs uppercase tracking-wider ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    <th className="px-4 sm:px-6 py-3 font-medium">#</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Ürün</th>
                    <th className="px-4 sm:px-6 py-3 font-medium text-center">Satış Adedi</th>
                    <th className="px-4 sm:px-6 py-3 font-medium text-center">Sipariş Sayısı</th>
                    <th className="px-4 sm:px-6 py-3 font-medium text-right">Toplam Gelir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/30">
                  {(serverSales?.length ? serverSales : salesData.sales).map((item, index) => (
                    <motion.tr
                      key={item.productId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.03 }}
                      className={`transition-colors ${isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-gray-50'}`}
                    >
                      {/* Sıra */}
                      <td className="px-4 sm:px-6 py-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                          index === 1 ? 'bg-neutral-400/20 text-neutral-400' :
                          index === 2 ? 'bg-orange-500/20 text-orange-500' :
                          isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                      </td>

                      {/* Ürün */}
                      <td className="px-4 sm:px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                            <MediaImage
                              src={item.productImage}
                              alt={item.productName}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {item.productName}
                            </p>
                            <p className={`text-xs truncate ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                              {item.productCategory || 'Kategori yok'} • {formatPrice(item.productPrice)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Satış Adedi */}
                      <td className="px-4 sm:px-6 py-3 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                          index < 3 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.totalQuantity} adet
                        </span>
                      </td>

                      {/* Sipariş Sayısı */}
                      <td className={`px-4 sm:px-6 py-3 text-center ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        {item.orderCount} sipariş
                      </td>

                      {/* Toplam Gelir */}
                      <td className="px-4 sm:px-6 py-3 text-right">
                        <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {formatPrice(item.totalRevenue)}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SpotlightCard>
      </FadeContent>

      {/* Bölgesel Satışlar */}
      <FadeContent direction="up" delay={0.32}>
        <SpotlightCard className="p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <HiOutlineLocationMarker className="w-5 h-5 text-blue-500" />
              Bölgesel Satışlar
            </h2>
            <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              {salesData.districtSales.length} bölge
            </span>
          </div>

              {(serverDistricts?.length ?? salesData.districtSales.length) === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              <HiOutlineLocationMarker className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Seçilen tarih aralığında sipariş yok</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(serverDistricts?.length ? serverDistricts : salesData.districtSales).slice(0, 12).map((district, index) => {
                // En yüksek gelire göre yüzde hesapla
                const maxRevenue = (serverDistricts?.length ? serverDistricts : salesData.districtSales)[0]?.revenue || 1;
                const percentage = (district.revenue / maxRevenue) * 100;
                
                return (
                  <motion.div
                    key={district.district}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.03 }}
                    className={`relative p-4 rounded-xl border overflow-hidden ${
                      isDark ? 'bg-neutral-800/30 border-neutral-800' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {/* Progress bar arka plan */}
                    <div 
                      className={`absolute inset-0 ${index === 0 ? 'bg-blue-500/10' : 'bg-blue-500/5'}`}
                      style={{ width: `${percentage}%` }}
                    />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-blue-500 text-white' :
                            index === 1 ? 'bg-blue-400/20 text-blue-400' :
                            index === 2 ? 'bg-blue-300/20 text-blue-300' :
                            isDark ? 'bg-neutral-700 text-neutral-400' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {index + 1}
                          </div>
                          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {district.district}
                          </span>
                        </div>
                        <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                          {district.province}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                            {district.orderCount} sipariş
                          </span>
                          <span className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                            {district.productCount} ürün
                          </span>
                        </div>
                        <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {formatPrice(district.revenue)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          
          {salesData.districtSales.length > 12 && (
            <div className={`text-center pt-4 mt-4 border-t ${isDark ? 'border-neutral-800 text-neutral-500' : 'border-gray-200 text-gray-500'}`}>
              <p className="text-sm">
                İlk 12 bölge gösteriliyor • Toplam {salesData.districtSales.length} bölge
              </p>
            </div>
          )}
        </SpotlightCard>
      </FadeContent>

      {/* Son Ödenmiş Siparişler */}
      <FadeContent direction="up" delay={0.35}>
        <SpotlightCard className="p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <HiOutlineClipboardList className="w-5 h-5 text-purple-500" />
              Son Ödenmiş Siparişler
            </h2>
            <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              {salesData.paidOrders.length} sipariş
            </span>
          </div>

              {(paidOrders?.length ?? salesData.paidOrders.length) === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              <HiOutlineShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Seçilen tarih aralığında ödenmiş sipariş yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:-mx-6">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className={`text-left text-xs uppercase tracking-wider ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    <th className="px-4 sm:px-6 py-3 font-medium">Sipariş No</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Tarih</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Müşteri</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Ürünler</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Teslimat</th>
                    <th className="px-4 sm:px-6 py-3 font-medium text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/30">
                  {(paidOrders?.length ? paidOrders : salesData.paidOrders)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 20)
                    .map((order, index) => {
                      const orderDate = new Date(order.createdAt);
                      const products = order.products || [];
                      const productCount = products.reduce((sum, p) => sum + (p.quantity || 1), 0);
                      const firstProduct = products[0];
                      
                      return (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + index * 0.02 }}
                          className={`transition-colors ${isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-gray-50'}`}
                        >
                          {/* Sipariş No */}
                          <td className="px-4 sm:px-6 py-3">
                            <span className={`font-mono font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                              #{order.orderNumber}
                            </span>
                          </td>

                          {/* Tarih */}
                          <td className={`px-4 sm:px-6 py-3 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                            <div className="text-sm">
                              {orderDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                            </div>
                            <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                              {orderDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          {/* Müşteri */}
                          <td className="px-4 sm:px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                                <HiOutlineUser className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`} />
                              </div>
                              <div className="min-w-0">
                                <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {order.customerName || 'İsimsiz'}
                                </p>
                                <p className={`text-xs truncate ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                                  {order.customerPhone || '-'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Ürünler */}
                          <td className="px-4 sm:px-6 py-3">
                            <div className="flex items-center gap-2">
                              {firstProduct && (
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                                  <MediaImage
                                    src={firstProduct.image || ''}
                                    alt={firstProduct.name || ''}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                  />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className={`text-sm truncate max-w-[150px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {firstProduct?.name || 'Ürün yok'}
                                </p>
                                {products.length > 1 && (
                                  <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                                    +{products.length - 1} ürün daha
                                  </p>
                                )}
                                {products.length === 1 && productCount > 1 && (
                                  <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                                    x{productCount} adet
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Teslimat */}
                          <td className="px-4 sm:px-6 py-3">
                            <div className="flex items-center gap-1">
                              <HiOutlineLocationMarker className={`w-4 h-4 shrink-0 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                              <span className={`text-sm truncate max-w-[120px] ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                                {order.delivery?.district || order.delivery?.province || '-'}
                              </span>
                            </div>
                          </td>

                          {/* Tutar */}
                          <td className="px-4 sm:px-6 py-3 text-right">
                            <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              {formatPrice(order.total || 0)}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
          
          {salesData.paidOrders.length > 20 && (
            <div className={`text-center pt-4 mt-4 border-t ${isDark ? 'border-neutral-800 text-neutral-500' : 'border-gray-200 text-gray-500'}`}>
              <p className="text-sm">
                Son 20 sipariş gösteriliyor • Toplam {salesData.paidOrders.length} sipariş
              </p>
            </div>
          )}
        </SpotlightCard>
      </FadeContent>

      {/* Alt Bilgi */}
      <FadeContent direction="up" delay={0.4}>
        <div className={`text-center py-4 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`}>
          <p className="text-xs">
            💡 Bu sayfa otomatik olarak güncellenir. Sadece <strong>kesin ödenmiş</strong> siparişler hesaba katılır.
          </p>
        </div>
      </FadeContent>
    </div>
  );
}
