'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard, AnimatedCounter, FadeContent } from '@/components/admin';
import { GradientText, ShinyText } from '@/components/ui-kit';
import { useTheme } from '../ThemeContext';
import { 
  HiOutlineEye,
  HiOutlineUsers,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineChartBar,
  HiOutlineGlobe,
  HiOutlineDeviceMobile,
  HiOutlineDesktopComputer,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineShoppingCart,
  HiOutlineCurrencyDollar,
  HiOutlineLocationMarker,
  HiOutlineLink,
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import { 
  FaFacebook, 
  FaInstagram, 
  FaGoogle, 
  FaTiktok 
} from 'react-icons/fa';

// ============================================
// Types
// ============================================

interface OverviewStats {
  totalSessions: number;
  uniqueVisitors: number;
  totalPageViews: number;
  totalEvents: number;
  avgSessionDuration: number;
  avgPagesPerSession: number;
  bounceRate: number;
  realtimeVisitors: number;
}

interface ConversionStats {
  total: number;
  rate: number;
  revenue: number;
}

interface StatsResponse {
  period: string;
  dateRange: { from: string; to: string };
  overview: OverviewStats;
  conversions: ConversionStats;
  trafficSources: Record<string, number>;
  devices: Record<string, number>;
  browsers: Record<string, number>;
  operatingSystems: Record<string, number>;
  topPages: Array<{ path: string; count: number; title: string }>;
  topProducts: Array<{ productId: number; count: number; name: string }>;
  eventBreakdown: Record<string, number>;
}

interface RealtimeVisitor {
  sessionId: string;
  visitorId: string;
  device: string;
  browser: string;
  os: string;
  location: string;
  landingPage: string;
  currentPage: string;
  pageTitle: string;
  source: string;
  campaign: string;
  pageViews: number;
  startedAt: string;
  lastActivity: string;
  duration: number;
}

interface RealtimeResponse {
  count: number;
  visitors: RealtimeVisitor[];
  activePages: Array<{ path: string; count: number }>;
  timestamp: string;
}

// ============================================
// Helper Functions
// ============================================

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}dk ${secs}s`;
  const hours = Math.floor(mins / 60);
  return `${hours}sa ${mins % 60}dk`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount / 100);
}

function getSourceIcon(source: string) {
  switch (source.toLowerCase()) {
    case 'facebook': return <FaFacebook className="w-4 h-4 text-blue-600" />;
    case 'instagram': return <FaInstagram className="w-4 h-4 text-pink-500" />;
    case 'google': return <FaGoogle className="w-4 h-4 text-red-500" />;
    case 'tiktok': return <FaTiktok className="w-4 h-4" />;
    default: return <HiOutlineGlobe className="w-4 h-4 text-gray-400" />;
  }
}

function getDeviceIcon(device: string) {
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
  trend, 
  suffix,
  prefix,
  isDark 
}: { 
  title: string; 
  value: number | string; 
  icon: any; 
  trend?: number;
  suffix?: string;
  prefix?: string;
  isDark: boolean;
}) {
  return (
    <SpotlightCard className="p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {prefix}{typeof value === 'number' ? <AnimatedCounter value={value} /> : value}{suffix}
            </span>
            {trend !== undefined && (
              <span className={`flex items-center text-xs sm:text-sm font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trend >= 0 ? <HiOutlineTrendingUp className="w-4 h-4 mr-0.5" /> : <HiOutlineTrendingDown className="w-4 h-4 mr-0.5" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
        <div className={`p-2 sm:p-3 rounded-xl ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-white' : 'text-gray-600'}`} />
        </div>
      </div>
    </SpotlightCard>
  );
}

function RealtimeWidget({ data, isDark }: { data: RealtimeResponse | null; isDark: boolean }) {
  if (!data) return null;

  return (
    <SpotlightCard className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Şu Anda Sitede
          </h3>
        </div>
        <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {data.count}
        </span>
      </div>

      {data.activePages.length > 0 && (
        <div className="space-y-2">
          <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Aktif Sayfalar
          </p>
          {data.activePages.slice(0, 5).map((page, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className={`text-sm truncate flex-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {page.path === '/' ? 'Ana Sayfa' : page.path}
              </span>
              <span className={`text-sm font-medium ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {page.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </SpotlightCard>
  );
}

function TrafficSourcesChart({ data, isDark }: { data: Record<string, number>; isDark: boolean }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const sources = [
    { key: 'direct', label: 'Direkt', color: 'bg-blue-500' },
    { key: 'organic', label: 'Organik', color: 'bg-green-500' },
    { key: 'social', label: 'Sosyal Medya', color: 'bg-pink-500' },
    { key: 'paid', label: 'Ücretli Reklam', color: 'bg-yellow-500' },
    { key: 'referral', label: 'Referans', color: 'bg-purple-500' },
    { key: 'email', label: 'E-posta', color: 'bg-orange-500' },
  ];

  return (
    <SpotlightCard className="p-4 sm:p-6">
      <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Trafik Kaynakları
      </h3>
      
      {/* Bar chart */}
      <div className="h-4 flex rounded-full overflow-hidden mb-4">
        {sources.map(source => {
          const value = data[source.key] || 0;
          const percent = (value / total) * 100;
          if (percent < 1) return null;
          return (
            <div 
              key={source.key}
              className={`${source.color} transition-all duration-500`}
              style={{ width: `${percent}%` }}
              title={`${source.label}: ${value} (${percent.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {sources.map(source => {
          const value = data[source.key] || 0;
          const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
          return (
            <div key={source.key} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${source.color}`} />
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {source.label}
              </span>
              <span className={`text-xs font-medium ml-auto ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {percent}%
              </span>
            </div>
          );
        })}
      </div>
    </SpotlightCard>
  );
}

function DeviceChart({ data, isDark }: { data: Record<string, number>; isDark: boolean }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const devices = [
    { key: 'desktop', label: 'Masaüstü', icon: HiOutlineDesktopComputer },
    { key: 'mobile', label: 'Mobil', icon: HiOutlineDeviceMobile },
    { key: 'tablet', label: 'Tablet', icon: HiOutlineDeviceMobile },
  ];

  return (
    <SpotlightCard className="p-4 sm:p-6">
      <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Cihaz Dağılımı
      </h3>
      
      <div className="space-y-3">
        {devices.map(device => {
          const value = data[device.key] || 0;
          const percent = total > 0 ? (value / total) * 100 : 0;
          return (
            <div key={device.key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <device.icon className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {device.label}
                  </span>
                </div>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatNumber(value)} ({percent.toFixed(1)}%)
                </span>
              </div>
              <div className={`h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>
            </div>
          );
        })}
      </div>
    </SpotlightCard>
  );
}

function TopPagesTable({ pages, isDark }: { pages: Array<{ path: string; count: number; title: string }>; isDark: boolean }) {
  if (pages.length === 0) return null;

  return (
    <SpotlightCard className="p-4 sm:p-6">
      <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        En Çok Ziyaret Edilen Sayfalar
      </h3>
      
      <div className="space-y-2">
        {pages.map((page, idx) => (
          <div 
            key={page.path} 
            className={`flex items-center gap-3 p-2 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors`}
          >
            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium ${
              isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {page.title || page.path}
              </p>
              <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {page.path}
              </p>
            </div>
            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatNumber(page.count)}
            </span>
          </div>
        ))}
      </div>
    </SpotlightCard>
  );
}

function TopProductsTable({ products, isDark }: { products: Array<{ productId: number; count: number; name: string }>; isDark: boolean }) {
  if (products.length === 0) return null;

  return (
    <SpotlightCard className="p-4 sm:p-6">
      <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        En Çok Görüntülenen Ürünler
      </h3>
      
      <div className="space-y-2">
        {products.map((product, idx) => (
          <div 
            key={product.productId} 
            className={`flex items-center gap-3 p-2 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors`}
          >
            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium ${
              isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {product.name}
              </p>
            </div>
            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatNumber(product.count)} görüntüleme
            </span>
          </div>
        ))}
      </div>
    </SpotlightCard>
  );
}

function EventBreakdown({ events, isDark }: { events: Record<string, number>; isDark: boolean }) {
  const eventLabels: Record<string, string> = {
    'page_view': 'Sayfa Görüntüleme',
    'add_to_cart': 'Sepete Ekleme',
    'remove_from_cart': 'Sepetten Çıkarma',
    'view_item': 'Ürün Görüntüleme',
    'begin_checkout': 'Ödeme Başlatma',
    'purchase': 'Satın Alma',
    'search': 'Arama',
    'favorite_add': 'Favorilere Ekleme',
    'login': 'Giriş',
    'sign_up': 'Kayıt',
    'click': 'Tıklama',
  };

  const entries = Object.entries(events);
  if (entries.length === 0) return null;

  return (
    <SpotlightCard className="p-4 sm:p-6">
      <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Kullanıcı Eylemleri
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {entries.map(([event, count]) => (
          <div 
            key={event}
            className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
          >
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {eventLabels[event] || event}
            </p>
            <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatNumber(count)}
            </p>
          </div>
        ))}
      </div>
    </SpotlightCard>
  );
}

function RealtimeVisitorsList({ visitors, isDark }: { visitors: RealtimeVisitor[]; isDark: boolean }) {
  if (visitors.length === 0) return null;

  return (
    <SpotlightCard className="p-4 sm:p-6">
      <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Aktif Ziyaretçiler
      </h3>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {visitors.map((visitor) => (
          <a 
            key={visitor.sessionId}
            href={`/yonetim/analizler/ziyaretci/${visitor.visitorId}`}
            className={`block p-3 rounded-lg transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getDeviceIcon(visitor.device)}
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {visitor.browser} / {visitor.os}
                </span>
              </div>
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {visitor.duration} dk
              </span>
            </div>
            
            <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className="flex items-center gap-1 mb-1">
                <HiOutlineLink className="w-3 h-3" />
                <span className="truncate">{visitor.currentPage}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1">
                  {getSourceIcon(visitor.source)}
                  {visitor.source}
                </span>
                <span>•</span>
                <span>{visitor.pageViews} sayfa</span>
                <span>•</span>
                <span className="text-green-500 flex items-center gap-1">
                  Detay <HiOutlineArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </SpotlightCard>
  );
}

// ============================================
// Main Component
// ============================================

export default function AnalizlerPage() {
  const { isDark } = useTheme();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [realtime, setRealtime] = useState<RealtimeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'1d' | '7d' | '30d' | '90d'>('7d');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/stats?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [period]);

  const fetchRealtime = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/realtime?minutes=5');
      if (res.ok) {
        const data = await res.json();
        setRealtime(data);
      }
    } catch (error) {
      console.error('Failed to fetch realtime:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchRealtime()]);
      setLoading(false);
    };

    loadData();
  }, [fetchStats, fetchRealtime]);

  // Auto-refresh realtime data
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchRealtime();
    }, 10000); // Her 10 saniyede bir

    return () => clearInterval(interval);
  }, [autoRefresh, fetchRealtime]);

  const periods = [
    { value: '1d', label: 'Bugün' },
    { value: '7d', label: 'Son 7 Gün' },
    { value: '30d', label: 'Son 30 Gün' },
    { value: '90d', label: 'Son 90 Gün' },
  ];

  return (
    <FadeContent>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <GradientText>Ziyaretçi Analizleri</GradientText>
            </h1>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Detaylı ziyaretçi davranışları ve trafik istatistikleri
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Period selector */}
            <div className={`flex rounded-lg overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
              {periods.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value as any)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    period === p.value
                      ? isDark
                        ? 'bg-white text-black'
                        : 'bg-gray-900 text-white'
                      : isDark
                        ? 'text-gray-300 hover:bg-white/5'
                        : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Refresh button */}
            <button
              onClick={() => {
                fetchStats();
                fetchRealtime();
              }}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Yenile"
            >
              <HiOutlineRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading && !stats ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Toplam Oturum"
                value={stats?.overview.totalSessions || 0}
                icon={HiOutlineEye}
                isDark={isDark}
              />
              <StatCard
                title="Benzersiz Ziyaretçi"
                value={stats?.overview.uniqueVisitors || 0}
                icon={HiOutlineUsers}
                isDark={isDark}
              />
              <StatCard
                title="Sayfa Görüntüleme"
                value={stats?.overview.totalPageViews || 0}
                icon={HiOutlineChartBar}
                isDark={isDark}
              />
              <StatCard
                title="Ort. Oturum Süresi"
                value={formatDuration(stats?.overview.avgSessionDuration || 0)}
                icon={HiOutlineClock}
                isDark={isDark}
              />
            </div>

            {/* Engagement & Conversion */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Sayfa/Oturum"
                value={(stats?.overview.avgPagesPerSession || 0).toFixed(1)}
                icon={HiOutlineChartBar}
                isDark={isDark}
              />
              <StatCard
                title="Hemen Çıkma Oranı"
                value={stats?.overview.bounceRate || 0}
                icon={HiOutlineTrendingDown}
                suffix="%"
                isDark={isDark}
              />
              <StatCard
                title="Dönüşüm Oranı"
                value={stats?.conversions.rate || 0}
                icon={HiOutlineShoppingCart}
                suffix="%"
                isDark={isDark}
              />
              <StatCard
                title="Toplam Gelir"
                value={formatCurrency(stats?.conversions.revenue || 0)}
                icon={HiOutlineCurrencyDollar}
                isDark={isDark}
              />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Realtime */}
              <div className="space-y-6">
                <RealtimeWidget data={realtime} isDark={isDark} />
                <DeviceChart data={stats?.devices || {}} isDark={isDark} />
              </div>

              {/* Middle Column - Traffic & Events */}
              <div className="space-y-6">
                <TrafficSourcesChart data={stats?.trafficSources || {}} isDark={isDark} />
                <EventBreakdown events={stats?.eventBreakdown || {}} isDark={isDark} />
              </div>

              {/* Right Column - Top Content */}
              <div className="space-y-6">
                <TopPagesTable pages={stats?.topPages || []} isDark={isDark} />
                <TopProductsTable products={stats?.topProducts || []} isDark={isDark} />
              </div>
            </div>

            {/* Active Visitors Detail */}
            {realtime && realtime.visitors.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RealtimeVisitorsList visitors={realtime.visitors.slice(0, 10)} isDark={isDark} />
              </div>
            )}
          </>
        )}
      </div>
    </FadeContent>
  );
}
