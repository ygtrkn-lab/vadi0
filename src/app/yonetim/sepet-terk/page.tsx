'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard, AnimatedCounter, FadeContent, GradientText } from '@/components/admin';
import { useTheme } from '../ThemeContext';
import Link from 'next/link';
import { 
  HiOutlineShoppingCart,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineDeviceMobile,
  HiOutlineDesktopComputer,
  HiOutlineCurrencyDollar,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineArrowLeft,
  HiOutlineUser,
  HiOutlineExclamationCircle,
  HiOutlineFilter,
  HiOutlineEye,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineX,
} from 'react-icons/hi';

// ============================================
// Types
// ============================================

interface CartAbandonmentRecord {
  id: string;
  ip_address: string;
  ip_hash: string;
  visitor_id?: string;
  session_id?: string;
  customer_id?: string;
  customer_email?: string;
  customer_phone?: string;
  cart_items: Array<{ id: number; name: string; price: number; quantity: number }>;
  cart_total: number;
  cart_item_count: number;
  reached_step: 'cart' | 'recipient' | 'message' | 'payment';
  reached_address_form: boolean;
  filled_fields: Record<string, boolean>;
  time_on_cart_seconds: number;
  time_on_recipient_seconds: number;
  time_on_message_seconds: number;
  time_on_payment_seconds: number;
  total_checkout_seconds: number;
  selected_district?: string;
  selected_neighborhood?: string;
  selected_delivery_date?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  landing_page?: string;
  status: 'abandoned' | 'recovered' | 'converted';
  started_at: string;
  abandoned_at: string;
}

interface Summary {
  totalRecords: number;
  uniqueIPs: number;
  totalAbandonedValue: number;
  avgTimeSeconds: number;
  byStep: {
    cart: number;
    recipient: number;
    message: number;
    payment: number;
  };
  byDevice: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  byStatus: {
    abandoned: number;
    recovered: number;
    converted: number;
  };
}

// ============================================
// Helper Functions
// ============================================

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}sn`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}dk ${secs}sn`;
  const hours = Math.floor(mins / 60);
  return `${hours}sa ${mins % 60}dk`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount / 100);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStepLabel(step: string): string {
  switch (step) {
    case 'cart': return 'Sepet';
    case 'recipient': return 'Alıcı Bilgileri';
    case 'message': return 'Mesaj';
    case 'payment': return 'Ödeme';
    default: return step;
  }
}

function getStepColor(step: string): string {
  switch (step) {
    case 'cart': return 'bg-gray-500';
    case 'recipient': return 'bg-blue-500';
    case 'message': return 'bg-purple-500';
    case 'payment': return 'bg-green-500';
    default: return 'bg-gray-400';
  }
}

function getDeviceIcon(device?: string) {
  switch (device) {
    case 'mobile': return <HiOutlineDeviceMobile className="w-4 h-4" />;
    case 'tablet': return <HiOutlineDeviceMobile className="w-5 h-5" />;
    default: return <HiOutlineDesktopComputer className="w-4 h-4" />;
  }
}

// ============================================
// Components
// ============================================

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  suffix,
  prefix,
  subtitle,
  highlight,
  isDark 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ComponentType<{ className?: string }>; 
  suffix?: string;
  prefix?: string;
  subtitle?: string;
  highlight?: boolean;
  isDark: boolean;
}) {
  return (
    <SpotlightCard className={`p-4 sm:p-6 ${highlight ? 'ring-2 ring-red-500/50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-bold ${highlight ? 'text-red-400' : isDark ? 'text-white' : 'text-gray-900'}`}>
              {prefix}{typeof value === 'number' ? <AnimatedCounter value={value} /> : value}{suffix}
            </span>
          </div>
          {subtitle && (
            <p className={`mt-1 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl ${highlight ? 'bg-red-500/20 text-red-400' : isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </SpotlightCard>
  );
}

function RecordDetailModal({ 
  record, 
  onClose, 
  isDark 
}: { 
  record: CartAbandonmentRecord; 
  onClose: () => void;
  isDark: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl ${
          isDark ? 'bg-gray-900' : 'bg-white'
        } shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-inherit">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Terk Detayı
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Temel Bilgiler */}
          <div>
            <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Temel Bilgiler
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-500">IP Hash</p>
                <p className={`text-sm font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {record.ip_hash?.substring(0, 16)}...
                </p>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-500">Terk Zamanı</p>
                <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatDate(record.abandoned_at)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-500">Son Adım</p>
                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStepColor(record.reached_step)} text-white`}>
                  {getStepLabel(record.reached_step)}
                </span>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-500">Toplam Süre</p>
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatDuration(record.total_checkout_seconds)}
                </p>
              </div>
            </div>
          </div>

          {/* Müşteri Bilgileri */}
          {(record.customer_email || record.customer_phone) && (
            <div>
              <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Müşteri Bilgileri
              </h4>
              <div className="space-y-2">
                {record.customer_email && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <HiOutlineMail className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{record.customer_email}</span>
                  </div>
                )}
                {record.customer_phone && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <HiOutlinePhone className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{record.customer_phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Süre Dağılımı */}
          <div>
            <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Adım Bazlı Süre
            </h4>
            <div className="grid grid-cols-4 gap-2">
              <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-500">Sepet</p>
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatDuration(record.time_on_cart_seconds)}
                </p>
              </div>
              <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                <p className="text-xs text-blue-500">Alıcı</p>
                <p className={`text-sm font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  {formatDuration(record.time_on_recipient_seconds)}
                </p>
              </div>
              <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                <p className="text-xs text-purple-500">Mesaj</p>
                <p className={`text-sm font-semibold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                  {formatDuration(record.time_on_message_seconds)}
                </p>
              </div>
              <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
                <p className="text-xs text-green-500">Ödeme</p>
                <p className={`text-sm font-semibold ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                  {formatDuration(record.time_on_payment_seconds)}
                </p>
              </div>
            </div>
          </div>

          {/* Sepet İçeriği */}
          <div>
            <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Sepet İçeriği ({record.cart_item_count} ürün - {formatCurrency(record.cart_total)})
            </h4>
            <div className="space-y-2 max-h-48 overflow-auto">
              {record.cart_items.map((item, idx) => (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.name}</p>
                    <p className="text-xs text-gray-500">x{item.quantity}</p>
                  </div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Teslimat Bilgileri */}
          {(record.selected_district || record.selected_neighborhood) && (
            <div>
              <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Seçilen Teslimat Bilgileri
              </h4>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <HiOutlineLocationMarker className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {record.selected_neighborhood && `${record.selected_neighborhood}, `}
                    {record.selected_district}
                  </span>
                </div>
                {record.selected_delivery_date && (
                  <div className="flex items-center gap-2 mt-2">
                    <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {record.selected_delivery_date}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cihaz & Kaynak */}
          <div>
            <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Cihaz & Kaynak
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-500">Cihaz</p>
                <div className="flex items-center gap-2 mt-1">
                  {getDeviceIcon(record.device_type)}
                  <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {record.device_type || 'Bilinmiyor'} / {record.browser || 'Bilinmiyor'}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-500">Kaynak</p>
                <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {record.utm_source || record.referrer || 'Doğrudan'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function SepetTerkPage() {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState<CartAbandonmentRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<CartAbandonmentRecord | null>(null);
  const [stepFilter, setStepFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        page: page.toString(),
        limit: '25',
      });
      
      if (stepFilter) params.set('step', stepFilter);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/analytics/cart-abandonment?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setSummary(result.summary);
        setTotalPages(result.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch cart abandonment data:', error);
    } finally {
      setLoading(false);
    }
  }, [period, page, stepFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const periodOptions = [
    { value: '1d', label: 'Son 24 Saat' },
    { value: '7d', label: 'Son 7 Gün' },
    { value: '30d', label: 'Son 30 Gün' },
    { value: '90d', label: 'Son 90 Gün' },
  ];

  const bgClass = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const cardBg = isDark ? 'bg-gray-900/50' : 'bg-white';
  const borderClass = isDark ? 'border-gray-800' : 'border-gray-200';

  return (
    <div className={`min-h-screen ${bgClass} pb-20`}>
      <FadeContent duration={0.5}>
        {/* Header */}
        <div className={`sticky top-0 z-20 ${isDark ? 'bg-gray-950/90' : 'bg-gray-50/90'} backdrop-blur-xl border-b ${borderClass}`}>
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link 
                  href="/yonetim"
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <HiOutlineArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className={`text-xl sm:text-2xl font-bold ${textClass}`}>
                    <GradientText>Sepetten Geri Dönenler</GradientText>
                  </h1>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Adres formuna ulaşıp 20 saniyeden fazla kalıp çıkanlar
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Period Selector */}
                <select
                  value={period}
                  onChange={(e) => { setPeriod(e.target.value); setPage(1); }}
                  className={`px-3 py-2 text-sm rounded-lg border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  {periodOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  } ${(stepFilter || statusFilter) ? 'ring-2 ring-purple-500' : ''}`}
                >
                  <HiOutlineFilter className="w-5 h-5" />
                </button>

                {/* Refresh Button */}
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} border ${borderClass}`}
                >
                  <HiOutlineRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 flex flex-wrap gap-3">
                    <select
                      value={stepFilter}
                      onChange={(e) => { setStepFilter(e.target.value); setPage(1); }}
                      className={`px-3 py-2 text-sm rounded-lg border ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-white' 
                          : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    >
                      <option value="">Tüm Adımlar</option>
                      <option value="recipient">Alıcı Bilgileri</option>
                      <option value="message">Mesaj</option>
                      <option value="payment">Ödeme</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                      className={`px-3 py-2 text-sm rounded-lg border ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-white' 
                          : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    >
                      <option value="">Tüm Durumlar</option>
                      <option value="abandoned">Terk Edilmiş</option>
                      <option value="recovered">Kurtarılmış</option>
                      <option value="converted">Dönüştürülmüş</option>
                    </select>

                    {(stepFilter || statusFilter) && (
                      <button
                        onClick={() => { setStepFilter(''); setStatusFilter(''); setPage(1); }}
                        className="px-3 py-2 text-sm text-red-500 hover:text-red-400"
                      >
                        Filtreleri Temizle
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Toplam Terk"
                value={summary.totalRecords}
                icon={HiOutlineShoppingCart}
                isDark={isDark}
                highlight
              />
              <StatCard
                title="Benzersiz IP"
                value={summary.uniqueIPs}
                icon={HiOutlineUser}
                isDark={isDark}
              />
              <StatCard
                title="Kaybedilen Değer"
                value={formatCurrency(summary.totalAbandonedValue)}
                icon={HiOutlineCurrencyDollar}
                isDark={isDark}
                highlight
              />
              <StatCard
                title="Ort. Süre"
                value={formatDuration(summary.avgTimeSeconds)}
                icon={HiOutlineClock}
                isDark={isDark}
              />
            </div>
          )}

          {/* Step Distribution */}
          {summary && (
            <div className={`${cardBg} rounded-2xl p-4 mb-6 border ${borderClass}`}>
              <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Adım Bazlı Dağılım
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'cart', label: 'Sepet', color: 'bg-gray-500' },
                  { key: 'recipient', label: 'Alıcı', color: 'bg-blue-500' },
                  { key: 'message', label: 'Mesaj', color: 'bg-purple-500' },
                  { key: 'payment', label: 'Ödeme', color: 'bg-green-500' },
                ].map(step => (
                  <div key={step.key} className="text-center">
                    <div className={`${step.color} text-white text-xl font-bold py-3 rounded-lg`}>
                      {summary.byStep[step.key as keyof typeof summary.byStep]}
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{step.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Device Distribution */}
          {summary && (
            <div className={`${cardBg} rounded-2xl p-4 mb-6 border ${borderClass}`}>
              <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Cihaz Bazlı Dağılım
              </h3>
              <div className="flex gap-6">
                {[
                  { key: 'desktop', label: 'Masaüstü', icon: HiOutlineDesktopComputer },
                  { key: 'mobile', label: 'Mobil', icon: HiOutlineDeviceMobile },
                  { key: 'tablet', label: 'Tablet', icon: HiOutlineDeviceMobile },
                ].map(device => (
                  <div key={device.key} className="flex items-center gap-2">
                    <device.icon className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-lg font-semibold ${textClass}`}>
                      {summary.byDevice[device.key as keyof typeof summary.byDevice]}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{device.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Records List */}
          <div className={`${cardBg} rounded-2xl border ${borderClass} overflow-hidden`}>
            <div className="p-4 border-b ${borderClass}">
              <h3 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Terk Kayıtları ({summary?.totalRecords || 0})
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <HiOutlineRefresh className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <HiOutlineExclamationCircle className="w-12 h-12 text-gray-400 mb-3" />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Bu dönemde kayıt bulunamadı
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {data.map((record) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 hover:${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} cursor-pointer transition-colors`}
                      onClick={() => setSelectedRecord(record)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getStepColor(record.reached_step)} text-white`}>
                              {getStepLabel(record.reached_step)}
                            </span>
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {formatDate(record.abandoned_at)}
                            </span>
                            {getDeviceIcon(record.device_type)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span className={textClass}>
                              {record.cart_item_count} ürün
                            </span>
                            <span className="text-red-500 font-medium">
                              {formatCurrency(record.cart_total)}
                            </span>
                            <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {formatDuration(record.total_checkout_seconds)}
                            </span>
                          </div>

                          {record.selected_district && (
                            <div className={`flex items-center gap-1 mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              <HiOutlineLocationMarker className="w-3 h-3" />
                              {record.selected_neighborhood && `${record.selected_neighborhood}, `}
                              {record.selected_district}
                            </div>
                          )}
                        </div>
                        
                        <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                          <HiOutlineEye className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={`p-4 border-t ${borderClass} flex items-center justify-between`}>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className={`px-4 py-2 text-sm rounded-lg ${
                        page === 1 
                          ? 'opacity-50 cursor-not-allowed' 
                          : isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                    >
                      Önceki
                    </button>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Sayfa {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className={`px-4 py-2 text-sm rounded-lg ${
                        page === totalPages 
                          ? 'opacity-50 cursor-not-allowed' 
                          : isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                    >
                      Sonraki
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </FadeContent>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <RecordDetailModal
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
            isDark={isDark}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
