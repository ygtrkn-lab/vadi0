'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  ip_address?: string;
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
  interactions?: InteractionDetails;
}

interface InteractionField {
  focus: number;
  blur: number;
  input: number;
  totalInputMs: number;
  errors: number;
}

interface InteractionDetails {
  fields?: Record<string, InteractionField>;
  scroll?: {
    maxDepthPercent?: number;
    timeTo50PercentMs?: number;
    timeTo90PercentMs?: number;
  };
  clicks?: Record<string, number>;
  cart?: {
    quantityChanges?: number;
    removals?: number;
    valueChange?: number;
  };
  timeToFirstInputMs?: number;
  timeToFirstErrorMs?: number;
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
  interactions?: {
    topErrorFields: Array<{ field: string; errors: number }>;
    topSlowFields: Array<{ field: string; ms: number }>;
    avgMaxScrollPercent: number;
    avgTimeToFirstInputSeconds?: number;
    avgTimeToFirstErrorSeconds?: number;
    avgTimeTo50ScrollSeconds?: number;
    avgTimeTo90ScrollSeconds?: number;
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

function formatMsToSeconds(ms?: number): string {
  if (!ms) return '-';
  const seconds = Math.round(ms / 1000);
  return formatDuration(seconds);
}

function buildRecommendations(summary: Summary | null): string[] {
  if (!summary) return [];

  const recs: string[] = [];
  const inter = summary.interactions;

  if (summary.avgTimeSeconds > 120) {
    recs.push('Checkout adımlarında ortalama süre yüksek; adres alanlarını sadeleştirip otomatik doldurma/ilçe-telefon maskesi ekleyin.');
  }

  if ((summary.byStep.payment || 0) < (summary.byStep.recipient || 0) / 2) {
    recs.push('Ödeme adımına geçiş düşük; ödeme hatalarını loglayıp taksit/iyzico hata mesajlarını görünür kılın, “tekrar dene” CTA ekleyin.');
  }

  if (summary.totalAbandonedValue > 5000) {
    recs.push('Yüksek kayıp sepet değeri var; yüksek değerli sepetlere küçük indirim / kargo hediyesi A/B test edin.');
  }

  if (inter?.topErrorFields?.length) {
    recs.push(`Hata alan alanlar: ${inter.topErrorFields.map(f => f.field).join(', ')}. Bu alanlarda satır içi hata mesajlarını netleştirin.`);
  }

  if (inter?.topSlowFields?.length) {
    recs.push(`En çok vakit harcanan alanlar: ${inter.topSlowFields.map(f => f.field).join(', ')}. İpucu/metin kısaltma veya otomatik tamamlama deneyin.`);
  }

  if ((inter?.avgMaxScrollPercent || 0) < 60) {
    recs.push('Scroll derinliği düşük; kritik güven/teslimat mesajlarını ilk ekrana alın, öne çıkan CTA ekleyin.');
  }

  if ((inter?.avgTimeToFirstInputSeconds || 0) > 8) {
    recs.push('İlk input gecikiyor; form girişini hızlandırmak için varsayılan odak ve klavye açılışı ekleyin.');
  }

  if (!recs.length) {
    recs.push('Metrikler dengeli; küçük kopya/güven rozetleri ve teslimat mesajları için hızlı A/B testleri deneyin.');
  }

  return recs;
}

function formatCurrency(amount: number): string {
  // cart_total zaten TL bazında gönderiliyor; kuruş bölme yapma
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
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
                <p className="text-xs text-gray-500">IP</p>
                <p className={`text-sm font-mono break-all ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {record.ip_address || 'N/A'}
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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const recommendations = useMemo(() => buildRecommendations(summary), [summary]);

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
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

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
  }, [period, page, stepFilter, statusFilter, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const periodOptions = [
    { value: '1d', label: 'Son 24 Saat' },
    { value: '7d', label: 'Son 7 Gün' },
    { value: '30d', label: 'Son 30 Gün' },
    { value: '90d', label: 'Son 90 Gün' },
    { value: 'custom', label: 'Özel Tarih' },
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
                  onChange={(e) => { 
                    const val = e.target.value;
                    setPeriod(val); 
                    if (val !== 'custom') {
                      setFromDate('');
                      setToDate('');
                    } else {
                      const today = new Date().toISOString().slice(0, 10);
                      setFromDate(prev => prev || today);
                      setToDate(prev => prev || today);
                    }
                    setPage(1); 
                  }}
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

                    {period === 'custom' && (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => {
                              const today = new Date().toISOString().slice(0, 10);
                              setFromDate(today);
                              setToDate(today);
                              setPage(1);
                            }}
                            className={`px-3 py-1.5 text-xs rounded-lg border ${
                              isDark 
                                ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' 
                                : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            Bugün
                          </button>
                          <button
                            onClick={() => {
                              const yesterday = new Date();
                              yesterday.setDate(yesterday.getDate() - 1);
                              const dateStr = yesterday.toISOString().slice(0, 10);
                              setFromDate(dateStr);
                              setToDate(dateStr);
                              setPage(1);
                            }}
                            className={`px-3 py-1.5 text-xs rounded-lg border ${
                              isDark 
                                ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' 
                                : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            Dün
                          </button>
                          <button
                            onClick={() => {
                              const today = new Date();
                              const sevenDaysAgo = new Date();
                              sevenDaysAgo.setDate(today.getDate() - 7);
                              setFromDate(sevenDaysAgo.toISOString().slice(0, 10));
                              setToDate(today.toISOString().slice(0, 10));
                              setPage(1);
                            }}
                            className={`px-3 py-1.5 text-xs rounded-lg border ${
                              isDark 
                                ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' 
                                : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            Son 7 Gün
                          </button>
                          <button
                            onClick={() => {
                              const today = new Date();
                              const thirtyDaysAgo = new Date();
                              thirtyDaysAgo.setDate(today.getDate() - 30);
                              setFromDate(thirtyDaysAgo.toISOString().slice(0, 10));
                              setToDate(today.toISOString().slice(0, 10));
                              setPage(1);
                            }}
                            className={`px-3 py-1.5 text-xs rounded-lg border ${
                              isDark 
                                ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' 
                                : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            Son 30 Gün
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full">
                          <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => { 
                              const val = e.target.value;
                              setFromDate(val); 
                              if (!toDate) setToDate(val);
                              setPage(1); 
                            }}
                            className={`px-3 py-2 text-sm rounded-lg border ${
                              isDark 
                                ? 'bg-gray-800 border-gray-700 text-white' 
                                : 'bg-white border-gray-200 text-gray-900'
                            }`}
                          />
                          <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>-</span>
                          <input
                            type="date"
                            value={toDate}
                            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                            className={`px-3 py-2 text-sm rounded-lg border ${
                              isDark 
                                ? 'bg-gray-800 border-gray-700 text-white' 
                                : 'bg-white border-gray-200 text-gray-900'
                            }`}
                          />
                        </div>
                      </>
                    )}

                    {(stepFilter || statusFilter || fromDate || toDate) && (
                      <button
                        onClick={() => { 
                          setStepFilter(''); 
                          setStatusFilter(''); 
                          setFromDate(''); 
                          setToDate(''); 
                          if (period === 'custom') setPeriod('7d');
                          setPage(1); 
                        }}
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

          {summary?.interactions && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <SpotlightCard className={`p-4 h-full border ${borderClass}`}>
                <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Form Sorunları
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Hata Alan Alanlar</p>
                    {summary.interactions.topErrorFields?.length ? (
                      <ul className="mt-1 space-y-1">
                        {summary.interactions.topErrorFields.map((f, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span className={textClass}>{f.field}</span>
                            <span className="text-red-500 font-semibold">{f.errors}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Kritik hata alanı yok.</p>
                    )}
                  </div>

                  <div>
                    <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>En Yavaş Alanlar</p>
                    {summary.interactions.topSlowFields?.length ? (
                      <ul className="mt-1 space-y-1">
                        {summary.interactions.topSlowFields.map((f, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span className={textClass}>{f.field}</span>
                            <span className="text-amber-500 font-semibold">{formatDuration(Math.round((f.ms || 0) / 1000))}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Belirgin yavaş alan yok.</p>
                    )}
                  </div>
                </div>
              </SpotlightCard>

              <SpotlightCard className={`p-4 h-full border ${borderClass}`}>
                <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Scroll & İlk Etkileşim
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-3`}>
                    <p className="text-xs text-gray-500">Ort. Maks Scroll</p>
                    <p className={`text-lg font-semibold ${textClass}`}>{summary.interactions.avgMaxScrollPercent}%</p>
                  </div>
                  <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-3`}>
                    <p className="text-xs text-gray-500">İlk Input</p>
                    <p className={`text-lg font-semibold ${textClass}`}>{formatMsToSeconds(summary.interactions.avgTimeToFirstInputSeconds ? summary.interactions.avgTimeToFirstInputSeconds * 1000 : undefined)}</p>
                  </div>
                  <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-3`}>
                    <p className="text-xs text-gray-500">İlk Hata</p>
                    <p className={`text-lg font-semibold ${textClass}`}>{formatMsToSeconds(summary.interactions.avgTimeToFirstErrorSeconds ? summary.interactions.avgTimeToFirstErrorSeconds * 1000 : undefined)}</p>
                  </div>
                  <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-3`}>
                    <p className="text-xs text-gray-500">Scroll %50 / %90</p>
                    <p className={`text-sm font-semibold ${textClass}`}>
                      {formatMsToSeconds(summary.interactions.avgTimeTo50ScrollSeconds ? summary.interactions.avgTimeTo50ScrollSeconds * 1000 : undefined)} / {formatMsToSeconds(summary.interactions.avgTimeTo90ScrollSeconds ? summary.interactions.avgTimeTo90ScrollSeconds * 1000 : undefined)}
                    </p>
                  </div>
                </div>
              </SpotlightCard>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className={`${cardBg} rounded-2xl p-4 mb-6 border ${borderClass}`}>
              <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Analize Göre AR-GE Önerileri
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className={textClass}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Form Sorunları & Scroll */}
          {summary?.interactions && (
            <div className={`${cardBg} rounded-2xl p-4 mb-6 border ${borderClass}`}>
              <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Form Sorunları & Scroll Davranışı
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>En Çok Hata Veren Alanlar</p>
                  <div className="mt-2 space-y-2">
                    {(summary.interactions.topErrorFields.length ? summary.interactions.topErrorFields : [{ field: 'Veri yok', errors: 0 }]).map((item, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <span className={`text-sm ${textClass}`}>{item.field}</span>
                        <span className="text-xs text-red-500 font-semibold">{item.errors} hata</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>En Uzun Oyalanılan Alanlar</p>
                  <div className="mt-2 space-y-2">
                    {(summary.interactions.topSlowFields.length ? summary.interactions.topSlowFields : [{ field: 'Veri yok', ms: 0 }]).map((item, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <span className={`text-sm ${textClass}`}>{item.field}</span>
                        <span className="text-xs text-blue-500 font-semibold">{formatMsToSeconds(item.ms)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Scroll & İlk Aksiyon</p>
                  <div className={`mt-2 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'} space-y-2`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className={textClass}>Ort. Maks Scroll</span>
                      <span className="font-semibold">%{summary.interactions.avgMaxScrollPercent}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className={textClass}>İlk Input</span>
                      <span className="font-semibold">{summary.interactions.avgTimeToFirstInputSeconds ? formatDuration(summary.interactions.avgTimeToFirstInputSeconds) : '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className={textClass}>İlk Hata</span>
                      <span className="font-semibold">{summary.interactions.avgTimeToFirstErrorSeconds ? formatDuration(summary.interactions.avgTimeToFirstErrorSeconds) : '-'}</span>
                    </div>
                  </div>
                </div>
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

                          {record.ip_address && (
                            <div className={`flex items-center gap-1 mt-1 text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              <HiOutlineUser className="w-3 h-3" />
                              <span className="font-mono">{record.ip_address}</span>
                            </div>
                          )}

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
