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
  HiOutlineExclamationCircle,
  HiOutlineViewList,
  HiOutlineXCircle,
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
  topSources: Array<{ source: string; count: number }>;
  topCampaigns: Array<{ name: string; count: number; source: string; medium: string }>;
  topReferrers: Array<{ domain: string; count: number; fullUrl: string }>;
  topLandingPages: Array<{ page: string; count: number }>;
  topMediums: Array<{ medium: string; count: number }>;
  devices: Record<string, number>;
  browsers: Record<string, number>;
  operatingSystems: Record<string, number>;
  topPages: Array<{ path: string; count: number; title: string }>;
  topProducts: Array<{ productId: number; count: number; name: string }>;
  eventBreakdown: Record<string, number>;
}

interface ClickData {
  totalClicks: number;
  topElements: Array<{
    id: string;
    element: string;
    text: string;
    count: number;
  }>;
  cartClicks: {
    total: number;
    breakdown: Array<{ text: string; count: number }>;
  };
}

interface CheckoutFlowData {
  funnel: {
    add_to_cart: number;
    view_cart: number;
    begin_checkout: number;
    step_recipient: number;
    step_message: number;
    step_payment: number;
    select_payment_method: number;
    purchase: number;
  };
  conversionRates: {
    cartToCheckout: string;
    checkoutToPayment: string;
    paymentToPurchase: string;
    overall: string;
  };
  paymentMethods: Array<{ method: string; count: number }>;
  cartActions: {
    adds: number;
    removes: number;
    quantityChanges: number;
  };
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

interface ClickData {
  totalClicks: number;
  topElements: Array<{
    id: string;
    element: string;
    text: string;
    count: number;
  }>;
  cartClicks: {
    total: number;
    breakdown: Array<{ text: string; count: number }>;
  };
}

interface CheckoutFlowData {
  funnel: {
    add_to_cart: number;
    view_cart: number;
    begin_checkout: number;
    step_recipient: number;
    step_message: number;
    step_payment: number;
    select_payment_method: number;
    purchase: number;
  };
  conversionRates: {
    cartToCheckout: string;
    checkoutToPayment: string;
    paymentToPurchase: string;
    overall: string;
  };
  paymentMethods: Array<{ method: string; count: number }>;
  cartActions: {
    adds: number;
    removes: number;
    quantityChanges: number;
  };
}

interface InsightsData {
  scrollDepth: {
    milestones: Record<number, number>;
    lowEngagementPages: Array<{ path: string; total: number; count: number; avg: number }>;
    totalMeasurements: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
    byPage: Record<string, number>;
    recent: Array<{ type: string; message: string; page: string; timestamp: string; count?: number }>;
  };
  cartAbandonment: {
    cartAbandons: number;
    checkoutAbandons: number;
    totalAbandons: number;
    totalLostRevenue: number;
    avgCartValue: number;
    totalItemsAbandoned: number;
    topAbandonedProducts: Array<{ id: string; name: string; count: number }>;
    byHour: Array<{ hour: string; count: number }>;
  };
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

// Detaylı Trafik Kaynakları (TikTok, Instagram, Facebook vs.)
function DetailedSourcesChart({ data, isDark }: { data: Array<{ source: string; count: number }>; isDark: boolean }) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Platform için ikon ve renk eşleştirmesi
  const getSourceStyle = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('instagram')) return { icon: FaInstagram, color: 'text-pink-500', bg: 'bg-pink-500/20' };
    if (s.includes('facebook')) return { icon: FaFacebook, color: 'text-blue-600', bg: 'bg-blue-600/20' };
    if (s.includes('tiktok')) return { icon: FaTiktok, color: 'text-gray-900 dark:text-white', bg: 'bg-gray-500/20' };
    if (s.includes('google')) return { icon: FaGoogle, color: 'text-red-500', bg: 'bg-red-500/20' };
    if (s.includes('twitter') || s.includes('x.')) return { icon: HiOutlineGlobe, color: 'text-blue-400', bg: 'bg-blue-400/20' };
    if (s.includes('youtube')) return { icon: HiOutlineGlobe, color: 'text-red-600', bg: 'bg-red-600/20' };
    if (s.includes('linkedin')) return { icon: HiOutlineGlobe, color: 'text-blue-700', bg: 'bg-blue-700/20' };
    if (s === 'doğrudan' || s === 'direct') return { icon: HiOutlineGlobe, color: 'text-gray-500', bg: 'bg-gray-500/20' };
    return { icon: HiOutlineGlobe, color: 'text-purple-500', bg: 'bg-purple-500/20' };
  };

  return (
    <SpotlightCard className="p-4 sm:p-6">
      <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
          📊
        </span>
        Ziyaretçi Kaynakları
      </h3>
      
      <div className="space-y-2">
        {data.slice(0, 10).map((item, idx) => {
          const style = getSourceStyle(item.source);
          const Icon = style.icon;
          const percent = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
          
          return (
            <div 
              key={idx}
              className={`flex items-center gap-3 p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
            >
              <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${style.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {item.source}
                  </span>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {percent}%
                  </span>
                </div>
                <div className={`h-1.5 mt-1 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                  <div 
                    className={`h-full rounded-full ${style.bg.replace('/20', '')}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatNumber(item.count)}
              </span>
            </div>
          );
        })}
      </div>
    </SpotlightCard>
  );
}

// Detaylı Trafik Analizi Paneli
function TrafficDetailsPanel({ 
  campaigns, 
  referrers, 
  landingPages, 
  mediums,
  isDark 
}: { 
  campaigns: Array<{ name: string; count: number; source: string; medium: string }>;
  referrers: Array<{ domain: string; count: number; fullUrl: string }>;
  landingPages: Array<{ page: string; count: number }>;
  mediums: Array<{ medium: string; count: number }>;
  isDark: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'referrers' | 'landing' | 'medium'>('campaigns');

  const tabs = [
    { key: 'campaigns', label: '🎯 Kampanyalar', count: campaigns?.length || 0 },
    { key: 'referrers', label: '🔗 Referanslar', count: referrers?.length || 0 },
    { key: 'landing', label: '📄 Giriş Sayfaları', count: landingPages?.length || 0 },
    { key: 'medium', label: '📡 Kanallar', count: mediums?.length || 0 },
  ];

  const mediumLabels: Record<string, { label: string; icon: string; color: string }> = {
    'organic': { label: 'Organik Arama', icon: '🔍', color: 'bg-green-500' },
    'cpc': { label: 'Tıklama Başı Ücret (CPC)', icon: '💰', color: 'bg-yellow-500' },
    'paid': { label: 'Ücretli Reklam', icon: '💵', color: 'bg-orange-500' },
    'social': { label: 'Sosyal Medya', icon: '📱', color: 'bg-pink-500' },
    'email': { label: 'E-posta', icon: '📧', color: 'bg-blue-500' },
    'referral': { label: 'Referans', icon: '🔗', color: 'bg-purple-500' },
    'display': { label: 'Görüntülü Reklam', icon: '🖼️', color: 'bg-indigo-500' },
    'affiliate': { label: 'Ortaklık', icon: '🤝', color: 'bg-teal-500' },
    'video': { label: 'Video', icon: '🎬', color: 'bg-red-500' },
  };

  return (
    <SpotlightCard className="p-4 sm:p-6">
      <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
          🔍
        </span>
        Detaylı Trafik Analizi
      </h3>

      {/* Tabs */}
      <div className={`flex flex-wrap gap-1 mb-4 p-1 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 min-w-0 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === tab.key
                ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                : isDark ? 'text-white/70 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            {tab.count > 0 && (
              <span className={`ml-1 ${activeTab === tab.key ? 'opacity-70' : 'opacity-50'}`}>
                ({tab.count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {activeTab === 'campaigns' && (
          campaigns && campaigns.length > 0 ? (
            campaigns.map((campaign, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    🎯 {campaign.name}
                  </span>
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {campaign.count}
                  </span>
                </div>
                <div className="flex gap-2">
                  {campaign.source && (
                    <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                      {campaign.source}
                    </span>
                  )}
                  {campaign.medium && (
                    <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                      {campaign.medium}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={`text-center py-8 ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
              <p className="text-2xl mb-2">📭</p>
              <p className="text-sm">Henüz kampanya verisi yok</p>
              <p className="text-xs mt-1 opacity-70">UTM parametreleri kullanarak kampanyalarınızı takip edin</p>
            </div>
          )
        )}

        {activeTab === 'referrers' && (
          referrers && referrers.length > 0 ? (
            referrers.map((ref, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      🔗 {ref.domain}
                    </span>
                    {ref.fullUrl && (
                      <p className={`text-xs truncate ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
                        {ref.fullUrl}
                      </p>
                    )}
                  </div>
                  <span className={`text-sm font-bold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {ref.count}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className={`text-center py-8 ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
              <p className="text-2xl mb-2">🔗</p>
              <p className="text-sm">Henüz referans verisi yok</p>
              <p className="text-xs mt-1 opacity-70">Diğer sitelerden gelen trafiği gösterir</p>
            </div>
          )
        )}

        {activeTab === 'landing' && (
          landingPages && landingPages.length > 0 ? (
            landingPages.map((lp, idx) => (
              <div 
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
              >
                <span className={`text-sm truncate flex-1 ${isDark ? 'text-white/90' : 'text-gray-700'}`}>
                  📄 {lp.page === '/' ? 'Ana Sayfa' : lp.page}
                </span>
                <span className={`text-sm font-bold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {lp.count}
                </span>
              </div>
            ))
          ) : (
            <div className={`text-center py-8 ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
              <p className="text-2xl mb-2">📄</p>
              <p className="text-sm">Henüz giriş sayfası verisi yok</p>
            </div>
          )
        )}

        {activeTab === 'medium' && (
          mediums && mediums.length > 0 ? (
            mediums.map((m, idx) => {
              const info = mediumLabels[m.medium.toLowerCase()] || { label: m.medium, icon: '📡', color: 'bg-gray-500' };
              return (
                <div 
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
                >
                  <div className={`w-8 h-8 rounded-lg ${info.color}/20 flex items-center justify-center`}>
                    <span>{info.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {info.label}
                    </span>
                    <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
                      utm_medium: {m.medium}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {m.count}
                  </span>
                </div>
              );
            })
          ) : (
            <div className={`text-center py-8 ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
              <p className="text-2xl mb-2">📡</p>
              <p className="text-sm">Henüz kanal verisi yok</p>
              <p className="text-xs mt-1 opacity-70">UTM medium parametresi ile kanal takibi yapın</p>
            </div>
          )
        )}
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
  const eventLabels: Record<string, { label: string; icon: string; color: string }> = {
    'page_view': { label: 'Sayfa Görüntüleme', icon: '👁️', color: 'from-blue-500 to-blue-400' },
    'add_to_cart': { label: 'Sepete Ekleme', icon: '🛒', color: 'from-green-500 to-green-400' },
    'remove_from_cart': { label: 'Sepetten Çıkarma', icon: '🗑️', color: 'from-red-500 to-red-400' },
    'view_item': { label: 'Ürün Görüntüleme', icon: '📦', color: 'from-purple-500 to-purple-400' },
    'begin_checkout': { label: 'Ödeme Başlatma', icon: '💳', color: 'from-yellow-500 to-yellow-400' },
    'purchase': { label: 'Satın Alma', icon: '✅', color: 'from-emerald-500 to-emerald-400' },
    'search': { label: 'Arama', icon: '🔍', color: 'from-indigo-500 to-indigo-400' },
    'favorite_add': { label: 'Favorilere Ekleme', icon: '❤️', color: 'from-pink-500 to-pink-400' },
    'login': { label: 'Giriş Yapma', icon: '🔐', color: 'from-cyan-500 to-cyan-400' },
    'sign_up': { label: 'Kayıt Olma', icon: '📝', color: 'from-teal-500 to-teal-400' },
    'click': { label: 'Tıklama', icon: '⚡', color: 'from-orange-500 to-orange-400' },
    'view_cart': { label: 'Sepet Görüntüleme', icon: '🛒', color: 'from-amber-500 to-amber-400' },
    'checkout_step': { label: 'Ödeme Adımı', icon: '📋', color: 'from-violet-500 to-violet-400' },
    'scroll_depth': { label: 'Scroll Derinliği', icon: '📊', color: 'from-sky-500 to-sky-400' },
    'scroll_depth_final': { label: 'Sayfa Sonu Scroll', icon: '📈', color: 'from-lime-500 to-lime-400' },
    'cart_visibility_hidden': { label: 'Sepetli Tab Değişimi', icon: '👀', color: 'from-rose-500 to-rose-400' },
    'cart_abandonment': { label: 'Sepet Terk', icon: '🚪', color: 'from-red-600 to-red-500' },
    'checkout_abandonment': { label: 'Ödeme Terk', icon: '💔', color: 'from-red-700 to-red-600' },
    'js_error': { label: 'JavaScript Hatası', icon: '🐛', color: 'from-red-500 to-red-400' },
    'api_error': { label: 'API Hatası', icon: '⚠️', color: 'from-yellow-600 to-yellow-500' },
    'network_error': { label: 'Ağ Hatası', icon: '🌐', color: 'from-gray-500 to-gray-400' },
  };

  const entries = Object.entries(events);
  if (entries.length === 0) return null;

  const maxCount = Math.max(...entries.map(([_, count]) => count));

  return (
    <SpotlightCard className="p-4 sm:p-6">
      <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Kullanıcı Eylemleri
      </h3>
      
      <div className="space-y-3">
        {entries.map(([event, count]) => {
          const eventInfo = eventLabels[event] || { label: event, icon: '⚡', color: 'from-gray-500 to-gray-400' };
          const percent = maxCount > 0 ? (count / maxCount) * 100 : 0;
          
          return (
            <div key={event}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{eventInfo.icon}</span>
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-700'}`}>
                    {eventInfo.label}
                  </span>
                </div>
                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatNumber(count)}
                </span>
              </div>
              <div className={`h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full bg-gradient-to-r ${eventInfo.color}`}
                />
              </div>
            </div>
          );
        })}
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

// Click Analytics Component
function ClickAnalytics({ data, isDark }: { data: ClickData | null; isDark: boolean }) {
  if (!data) return null;

  return (
    <SpotlightCard className="p-4 sm:p-6">
      <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
          👆
        </span>
        Tıklama Analizi
      </h3>
      
      <div className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {formatNumber(data.totalClicks)} <span className="text-sm font-normal opacity-60">toplam tıklama</span>
      </div>

      <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
        En Çok Tıklanan Elementler
      </h4>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {data.topElements.slice(0, 10).map((item, idx) => (
          <div 
            key={idx}
            className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-medium ${
                isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-600'
              }`}>
                {idx + 1}
              </span>
              <span className={`text-sm truncate ${isDark ? 'text-white/90' : 'text-gray-700'}`}>
                {item.text || item.id}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                {item.element}
              </span>
            </div>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </SpotlightCard>
  );
}

// Cart Click Details Component
function CartClickDetails({ data, isDark }: { data: ClickData | null; isDark: boolean }) {
  if (!data || data.cartClicks.total === 0) return null;

  return (
    <SpotlightCard className="p-4 sm:p-6">
      <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <span className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
          🛒
        </span>
        Sepet Sayfası Tıklamaları
      </h3>
      
      <div className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {formatNumber(data.cartClicks.total)} <span className="text-sm font-normal opacity-60">sepet tıklaması</span>
      </div>

      <div className="space-y-2">
        {data.cartClicks.breakdown.map((item, idx) => (
          <div 
            key={idx}
            className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
          >
            <span className={`text-sm truncate flex-1 ${isDark ? 'text-white/90' : 'text-gray-700'}`}>
              {item.text}
            </span>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </SpotlightCard>
  );
}

// Checkout Funnel Component
function CheckoutFunnel({ data, isDark }: { data: CheckoutFlowData | null; isDark: boolean }) {
  if (!data) return null;

  const funnelSteps = [
    { key: 'add_to_cart', label: 'Sepete Ekle', icon: '🛒', count: data.funnel.add_to_cart },
    { key: 'begin_checkout', label: 'Ödeme Başlat', icon: '💳', count: data.funnel.begin_checkout },
    { key: 'step_recipient', label: 'Alıcı Bilgisi', icon: '👤', count: data.funnel.step_recipient },
    { key: 'step_message', label: 'Mesaj Kartı', icon: '✉️', count: data.funnel.step_message },
    { key: 'step_payment', label: 'Ödeme Adımı', icon: '💰', count: data.funnel.step_payment },
    { key: 'purchase', label: 'Satın Alma', icon: '✅', count: data.funnel.purchase },
  ];

  const maxCount = Math.max(...funnelSteps.map(s => s.count), 1);

  return (
    <SpotlightCard className="p-4 sm:p-6">
      <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <span className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
          📊
        </span>
        Satın Alma Hunisi
      </h3>

      <div className="space-y-3">
        {funnelSteps.map((step, idx) => {
          const widthPercent = (step.count / maxCount) * 100;
          const dropOff = idx > 0 && funnelSteps[idx - 1].count > 0
            ? ((funnelSteps[idx - 1].count - step.count) / funnelSteps[idx - 1].count * 100).toFixed(1)
            : null;

          return (
            <div key={step.key} className="relative">
              <div className="flex items-center gap-2 mb-1">
                <span>{step.icon}</span>
                <span className={`text-sm font-medium ${isDark ? 'text-white/90' : 'text-gray-700'}`}>
                  {step.label}
                </span>
                <span className={`text-sm font-bold ml-auto ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatNumber(step.count)}
                </span>
                {dropOff && parseFloat(dropOff) > 0 && (
                  <span className="text-xs text-red-500">
                    -{dropOff}%
                  </span>
                )}
              </div>
              <div className={`h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Conversion Rates */}
      <div className={`mt-6 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
          Dönüşüm Oranları
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sepet → Ödeme</p>
            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {data.conversionRates.cartToCheckout}%
            </p>
          </div>
          <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ödeme → Satın Alma</p>
            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {data.conversionRates.paymentToPurchase}%
            </p>
          </div>
          <div className={`p-3 rounded-lg col-span-2 ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
            <p className={`text-xs ${isDark ? 'text-green-300' : 'text-green-600'}`}>Genel Dönüşüm</p>
            <p className={`text-xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              {data.conversionRates.overall}%
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      {data.paymentMethods.length > 0 && (
        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
            Ödeme Yöntemi Tercihleri
          </h4>
          <div className="space-y-2">
            {data.paymentMethods.map((pm) => (
              <div 
                key={pm.method}
                className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
              >
                <span className={`text-sm ${isDark ? 'text-white/90' : 'text-gray-700'}`}>
                  {pm.method === 'credit_card' ? '💳 Kredi Kartı' : 
                   pm.method === 'bank_transfer' ? '🏦 Havale/EFT' : pm.method}
                </span>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {pm.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cart Actions Summary */}
      <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
          Sepet İşlemleri
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <div className={`p-2 rounded-lg text-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <p className="text-lg">➕</p>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ekleme</p>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.cartActions.adds}</p>
          </div>
          <div className={`p-2 rounded-lg text-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <p className="text-lg">➖</p>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Çıkarma</p>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.cartActions.removes}</p>
          </div>
          <div className={`p-2 rounded-lg text-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <p className="text-lg">🔄</p>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Miktar</p>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.cartActions.quantityChanges}</p>
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}

// ============================================
// Scroll Depth Chart
// ============================================

function ScrollDepthChart({ data, isDark }: { data: InsightsData['scrollDepth'] | undefined; isDark: boolean }) {
  if (!data || data.totalMeasurements === 0) return null;

  const milestones = [
    { depth: 25, color: 'from-blue-500 to-blue-400', label: '25%' },
    { depth: 50, color: 'from-cyan-500 to-cyan-400', label: '50%' },
    { depth: 75, color: 'from-green-500 to-green-400', label: '75%' },
    { depth: 90, color: 'from-yellow-500 to-yellow-400', label: '90%' },
    { depth: 100, color: 'from-purple-500 to-purple-400', label: '100%' },
  ];

  const maxCount = Math.max(...Object.values(data.milestones), 1);

  return (
    <SpotlightCard className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <HiOutlineViewList className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Scroll Derinliği
        </h3>
      </div>
      <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Ziyaretçilerin sayfada ne kadar aşağı kaydırdığını gösterir
      </p>
      
      <div className="space-y-3">
        {milestones.map(milestone => {
          const count = data.milestones[milestone.depth] || 0;
          const percent = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={milestone.depth}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {milestone.label}
                </span>
                <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatNumber(count)}
                </span>
              </div>
              <div className={`h-2.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full bg-gradient-to-r ${milestone.color}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Low Engagement Pages */}
      {data.lowEngagementPages.length > 0 && (
        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
            ⚠️ Düşük Etkileşimli Sayfalar
          </h4>
          <div className="space-y-2">
            {data.lowEngagementPages.slice(0, 5).map((page) => (
              <div 
                key={page.path}
                className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
              >
                <span className={`text-xs truncate flex-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {page.path}
                </span>
                <span className={`text-xs font-medium ml-2 ${
                  page.avg < 30 ? 'text-red-500' : page.avg < 50 ? 'text-yellow-500' : 'text-green-500'
                }`}>
                  {page.avg}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SpotlightCard>
  );
}

// ============================================
// Error Tracking Panel
// ============================================

function ErrorsPanel({ data, isDark }: { data: InsightsData['errors'] | undefined; isDark: boolean }) {
  if (!data || data.total === 0) {
    return (
      <SpotlightCard className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineExclamationCircle className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            JavaScript Hataları
          </h3>
        </div>
        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="text-3xl mb-2">✅</div>
          <p className="text-sm">Hiçbir hata yok! Harika!</p>
        </div>
      </SpotlightCard>
    );
  }

  const errorTypeLabels: Record<string, { label: string; color: string }> = {
    js_error: { label: 'JS Hatası', color: 'text-red-500' },
    unhandled_rejection: { label: 'Promise Hatası', color: 'text-orange-500' },
    api_error: { label: 'API Hatası', color: 'text-yellow-500' },
    network_error: { label: 'Ağ Hatası', color: 'text-purple-500' },
  };

  return (
    <SpotlightCard className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HiOutlineExclamationCircle className={`w-5 h-5 text-red-500`} />
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            JavaScript Hataları
          </h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
        }`}>
          {data.total} hata
        </span>
      </div>

      {/* Error Types */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {Object.entries(data.byType).map(([type, count]) => (
          <div 
            key={type}
            className={`p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
          >
            <p className={`text-xs ${errorTypeLabels[type]?.color || 'text-gray-500'}`}>
              {errorTypeLabels[type]?.label || type}
            </p>
            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {count}
            </p>
          </div>
        ))}
      </div>

      {/* Errors by Page */}
      {Object.keys(data.byPage).length > 0 && (
        <div className={`border-t pt-4 mb-4 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
            📍 Sayfalara Göre Hatalar
          </h4>
          <div className="space-y-2">
            {Object.entries(data.byPage).slice(0, 8).map(([page, count]) => {
              const maxCount = Math.max(...Object.values(data.byPage));
              const percent = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={page}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs truncate flex-1 ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                      {page}
                    </span>
                    <span className={`text-xs font-medium ml-2 ${
                      count > 10 ? 'text-red-500' : count > 5 ? 'text-yellow-500' : isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {count}
                    </span>
                  </div>
                  <div className={`h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                    <div 
                      className={`h-full rounded-full ${
                        count > 10 ? 'bg-red-500' : count > 5 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Errors */}
      {data.recent.length > 0 && (
        <div className={`border-t pt-4 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
            Son Hatalar
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {data.recent.slice(0, 10).map((error, idx) => (
              <div 
                key={idx}
                className={`p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs ${errorTypeLabels[error.type]?.color || 'text-gray-500'}`}>
                    {errorTypeLabels[error.type]?.label || error.type}
                  </span>
                  {error.count && error.count > 1 && (
                    <span className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                      x{error.count}
                    </span>
                  )}
                </div>
                <p className={`text-xs truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {error.message}
                </p>
                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
                  {error.page}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </SpotlightCard>
  );
}

// ============================================
// Cart Abandonment Panel
// ============================================

function CartAbandonmentPanel({ data, isDark }: { data: InsightsData['cartAbandonment'] | undefined; isDark: boolean }) {
  if (!data || data.totalAbandons === 0) {
    return (
      <SpotlightCard className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineXCircle className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Sepet Terk
          </h3>
        </div>
        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <p className="text-sm">Henüz sepet terk verisi yok</p>
        </div>
      </SpotlightCard>
    );
  }

  return (
    <SpotlightCard className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <HiOutlineXCircle className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Sepet Terk Analizi
        </h3>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`p-3 rounded-lg ${isDark ? 'bg-orange-500/20' : 'bg-orange-50'}`}>
          <p className={`text-xs ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>Sepet Terk</p>
          <p className={`text-xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
            {data.cartAbandons}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${isDark ? 'bg-red-500/20' : 'bg-red-50'}`}>
          <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-600'}`}>Ödeme Terk</p>
          <p className={`text-xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            {data.checkoutAbandons}
          </p>
        </div>
        <div className={`p-3 rounded-lg col-span-2 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Kaybedilen Potansiyel Gelir</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(data.totalLostRevenue)}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Ort. Sepet</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(data.avgCartValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Abandoned Products */}
      {data.topAbandonedProducts.length > 0 && (
        <div className={`border-t pt-4 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
            En Çok Terk Edilen Ürünler
          </h4>
          <div className="space-y-2">
            {data.topAbandonedProducts.slice(0, 5).map((product) => (
              <div 
                key={product.id}
                className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
              >
                <span className={`text-xs truncate flex-1 ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                  {product.name}
                </span>
                <span className={`text-xs font-medium ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {product.count}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly Distribution */}
      <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
          Saatlik Dağılım
        </h4>
        <div className="flex items-end gap-0.5 h-16">
          {data.byHour.map((hour) => {
            const maxHourly = Math.max(...data.byHour.map(h => h.count), 1);
            const height = maxHourly > 0 ? (hour.count / maxHourly) * 100 : 0;
            return (
              <div 
                key={hour.hour}
                className="flex-1 group relative"
              >
                <div 
                  className={`w-full rounded-t ${isDark ? 'bg-orange-500/60' : 'bg-orange-400'} transition-all hover:opacity-80`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block">
                  <div className={`px-2 py-1 rounded text-xs whitespace-nowrap ${isDark ? 'bg-white/20 text-white' : 'bg-gray-800 text-white'}`}>
                    {hour.hour}: {hour.count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-400'}`}>00:00</span>
          <span className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-400'}`}>12:00</span>
          <span className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-400'}`}>23:00</span>
        </div>
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
  const [clickData, setClickData] = useState<ClickData | null>(null);
  const [checkoutFlow, setCheckoutFlow] = useState<CheckoutFlowData | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
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

  const fetchClickData = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/clicks?period=${period}&page=all`);
      if (res.ok) {
        const data = await res.json();
        setClickData(data);
      }
    } catch (error) {
      console.error('Failed to fetch click data:', error);
    }
  }, [period]);

  const fetchCheckoutFlow = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/checkout-flow?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setCheckoutFlow(data);
      }
    } catch (error) {
      console.error('Failed to fetch checkout flow:', error);
    }
  }, [period]);

  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/insights?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  }, [period]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchRealtime(), fetchClickData(), fetchCheckoutFlow(), fetchInsights()]);
      setLoading(false);
    };

    loadData();
  }, [fetchStats, fetchRealtime, fetchClickData, fetchCheckoutFlow, fetchInsights]);

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
                fetchClickData();
                fetchCheckoutFlow();
                fetchInsights();
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
                <DetailedSourcesChart data={stats?.topSources || []} isDark={isDark} />
                <EventBreakdown events={stats?.eventBreakdown || {}} isDark={isDark} />
              </div>

              {/* Right Column - Top Content */}
              <div className="space-y-6">
                <TopPagesTable pages={stats?.topPages || []} isDark={isDark} />
                <TopProductsTable products={stats?.topProducts || []} isDark={isDark} />
              </div>
            </div>

            {/* Detaylı Trafik Analizi - Full Width */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrafficDetailsPanel 
                campaigns={stats?.topCampaigns || []}
                referrers={stats?.topReferrers || []}
                landingPages={stats?.topLandingPages || []}
                mediums={stats?.topMediums || []}
                isDark={isDark}
              />
              
              {/* Browser & OS Stats */}
              <SpotlightCard className="p-4 sm:p-6">
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                    🌐
                  </span>
                  Tarayıcı & İşletim Sistemi
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Browsers */}
                  <div>
                    <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                      🌐 Tarayıcılar
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(stats?.browsers || {}).map(([browser, count]) => (
                        <div 
                          key={browser}
                          className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
                        >
                          <span className={`text-sm ${isDark ? 'text-white/90' : 'text-gray-700'}`}>
                            {browser}
                          </span>
                          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* OS */}
                  <div>
                    <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                      💻 İşletim Sistemleri
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(stats?.operatingSystems || {}).map(([os, count]) => (
                        <div 
                          key={os}
                          className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
                        >
                          <span className={`text-sm ${isDark ? 'text-white/90' : 'text-gray-700'}`}>
                            {os}
                          </span>
                          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </div>

            {/* Click & Checkout Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Checkout Funnel - Takes 2 columns */}
              <div className="lg:col-span-2">
                <CheckoutFunnel data={checkoutFlow} isDark={isDark} />
              </div>

              {/* Click Analytics */}
              <div className="space-y-6">
                <ClickAnalytics data={clickData} isDark={isDark} />
                <CartClickDetails data={clickData} isDark={isDark} />
              </div>
            </div>

            {/* Insights Section - Scroll Depth, Errors, Cart Abandonment */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ScrollDepthChart data={insights?.scrollDepth} isDark={isDark} />
              <ErrorsPanel data={insights?.errors} isDark={isDark} />
              <CartAbandonmentPanel data={insights?.cartAbandonment} isDark={isDark} />
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
