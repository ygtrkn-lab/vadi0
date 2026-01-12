'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SpotlightCard, AnimatedCounter, FadeContent } from '@/components/admin';
import { useTheme } from '../ThemeContext';
import {
  HiOutlineRefresh,
  HiOutlineGlobe,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
} from 'react-icons/hi';
import {
  FaFacebook,
  FaInstagram,
  FaGoogle,
  FaTiktok,
} from 'react-icons/fa';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ============================================
// Types
// ============================================

interface KPIData {
  activeUsers: number;
  activeUsersTrend: number;
  newUsers: number;
  newUsersTrend: number;
  avgEngagementTime: number;
  avgEngagementTimeTrend: number;
  totalEvents: number;
  totalEventsTrend: number;
  sessions: number;
  sessionsTrend: number;
  pageViews: number;
  pageViewsTrend: number;
  bounceRate: number;
  bounceRateTrend: number;
  conversions: number;
  conversionsTrend: number;
  revenue: number;
  revenueTrend: number;
}

interface TimeSeriesPoint {
  date: string;
  activeUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
}

interface AcquisitionSource {
  source: string;
  sessions: number;
  sessionsTrend: number;
  users: number;
  newUsers: number;
}

interface TopPage {
  path: string;
  title: string;
  views: number;
  viewsTrend: number;
  users: number;
  events: number;
  bounceRate: number;
}

interface RealtimeVisitor {
  sessionId: string;
  visitorId: string;
  device: string;
  country: string;
  city: string;
  currentPage: string;
  pageTitle: string;
  source: string;
  duration: number;
}

interface RealtimeData {
  count: number;
  visitors: RealtimeVisitor[];
  byCountry: Array<{ country: string; count: number }>;
  byPage: Array<{ page: string; count: number }>;
}

interface ChannelData {
  channel: string;
  sessions: number;
  sessionsTrend: number;
  users: number;
}

interface CohortData {
  week: string;
  dateRange: string;
  retention: number;
}

// ============================================
// Chart Colors
// ============================================

const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
};

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4'];

// ============================================
// Helper Functions
// ============================================

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString('tr-TR');
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} sn`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins < 60) return `${mins} dk ${secs} sn`;
  const hours = Math.floor(mins / 60);
  return `${hours} sa ${mins % 60} dk`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function formatPercent(value: number): string {
  return `%${value.toFixed(1)}`;
}

function getSourceIcon(source: string) {
  const s = source.toLowerCase();
  if (s.includes('instagram') || s === 'ig') return <FaInstagram className="w-4 h-4 text-pink-500" />;
  if (s.includes('facebook') || s === 'fb') return <FaFacebook className="w-4 h-4 text-blue-600" />;
  if (s.includes('google')) return <FaGoogle className="w-4 h-4 text-red-500" />;
  if (s.includes('tiktok')) return <FaTiktok className="w-4 h-4" />;
  return <HiOutlineGlobe className="w-4 h-4 text-gray-400" />;
}

// ============================================
// Components
// ============================================

// KPI Card - Google Analytics Style
function KPICard({
  title,
  value,
  trend,
  format = 'number',
  isDark,
  loading = false,
}: {
  title: string;
  value: number;
  trend?: number;
  format?: 'number' | 'duration' | 'currency' | 'percent';
  isDark: boolean;
  loading?: boolean;
}) {
  const formattedValue = useMemo(() => {
    if (loading) return '—';
    switch (format) {
      case 'duration': return formatDuration(value);
      case 'currency': return formatCurrency(value);
      case 'percent': return formatPercent(value);
      default: return formatNumber(value);
    }
  }, [value, format, loading]);

  const trendColor = trend === undefined ? 'text-gray-400' :
    trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-400';

  const TrendIcon = trend && trend > 0 ? HiOutlineArrowUp : trend && trend < 0 ? HiOutlineArrowDown : null;

  return (
    <div className={`p-4 rounded-xl border transition-all hover:shadow-lg ${
      isDark ? 'bg-neutral-900/50 border-white/10 hover:bg-neutral-900' : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {title}
      </p>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {loading ? (
            <span className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-8 w-16 inline-block" />
          ) : (
            formattedValue
          )}
        </span>
        {trend !== undefined && !loading && (
          <span className={`flex items-center text-sm font-medium ${trendColor}`}>
            {TrendIcon && <TrendIcon className="w-4 h-4" />}
            {formatPercent(Math.abs(trend))}
          </span>
        )}
      </div>
    </div>
  );
}

// Realtime Card - Left side
function RealtimeCard({
  count,
  byCountry,
  isDark,
  loading,
}: {
  count: number;
  byCountry: Array<{ country: string; count: number }>;
  isDark: boolean;
  loading: boolean;
}) {
  return (
    <SpotlightCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Son 30 dakika içinde etkin olan kullanıcı sayısı
          </h3>
        </div>
      </div>
      
      <div className={`text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {loading ? (
          <span className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-12 w-20 inline-block" />
        ) : (
          <AnimatedCounter value={count} />
        )}
      </div>

      <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Dakika başına etkin kullanıcı sayısı
      </p>

      {/* Country breakdown */}
      <div className="space-y-2">
        {byCountry.slice(0, 5).map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {item.country}
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

// Main Trend Chart
function TrendChart({
  data,
  isDark,
  loading,
  metric,
}: {
  data: TimeSeriesPoint[];
  isDark: boolean;
  loading: boolean;
  metric: 'activeUsers' | 'newUsers' | 'sessions' | 'pageViews';
}) {
  const metricLabels: Record<string, string> = {
    activeUsers: 'Aktif Kullanıcılar',
    newUsers: 'Yeni Kullanıcılar',
    sessions: 'Oturumlar',
    pageViews: 'Sayfa Görüntüleme',
  };

  if (loading || data.length === 0) {
    return (
      <div className={`h-64 flex items-center justify-center rounded-xl ${isDark ? 'bg-neutral-900/50' : 'bg-gray-50'}`}>
        <div className="animate-pulse text-gray-400">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#eee'} />
          <XAxis
            dataKey="date"
            tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
            tickFormatter={(value) => {
              const d = new Date(value);
              return `${d.getDate()} ${d.toLocaleString('tr-TR', { month: 'short' })}`;
            }}
          />
          <YAxis tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1F2937' : '#fff',
              border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
              borderRadius: '8px',
            }}
            labelFormatter={(value) => new Date(value).toLocaleDateString('tr-TR')}
            formatter={(value: number) => [formatNumber(value), metricLabels[metric]]}
          />
          <Area
            type="monotone"
            dataKey={metric}
            stroke={CHART_COLORS.primary}
            fill="url(#colorMetric)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Top Pages Table - Google Analytics Style
function TopPagesTable({
  pages,
  isDark,
  loading,
}: {
  pages: TopPage[];
  isDark: boolean;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={`text-left text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <th className="pb-3 font-medium">Sayfa başlığı</th>
            <th className="pb-3 font-medium text-right">Görüntüleme</th>
            <th className="pb-3 font-medium text-right hidden sm:table-cell">Kullanıcı</th>
            <th className="pb-3 font-medium text-right hidden md:table-cell">Hemen çıkma</th>
          </tr>
        </thead>
        <tbody className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {pages.slice(0, 10).map((page, idx) => (
            <tr key={idx} className={`border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
              <td className="py-3">
                <div className="flex flex-col">
                  <span className={`font-medium truncate max-w-[250px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {page.title || page.path}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {page.path}
                  </span>
                </div>
              </td>
              <td className="py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <span>{formatNumber(page.views)}</span>
                  {page.viewsTrend !== undefined && page.viewsTrend !== 0 && (
                    <span className={`text-xs ${page.viewsTrend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {page.viewsTrend > 0 ? '+' : ''}{page.viewsTrend.toFixed(1)}%
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3 text-right hidden sm:table-cell">{formatNumber(page.users)}</td>
              <td className="py-3 text-right hidden md:table-cell">{formatPercent(page.bounceRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Acquisition Sources Table - Google Analytics Style
function AcquisitionTable({
  sources,
  isDark,
  loading,
}: {
  sources: AcquisitionSource[];
  isDark: boolean;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>
    );
  }

  const total = sources.reduce((acc, s) => acc + s.sessions, 0);

  return (
    <div className="space-y-3">
      {sources.slice(0, 8).map((source, idx) => {
        const percent = total > 0 ? (source.sessions / total) * 100 : 0;
        return (
          <div key={idx}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {getSourceIcon(source.source)}
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {source.source}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {formatNumber(source.sessions)}
                </span>
                {source.sessionsTrend !== undefined && source.sessionsTrend !== 0 && (
                  <span className={`text-xs ${source.sessionsTrend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {source.sessionsTrend > 0 ? '+' : ''}{source.sessionsTrend.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${percent}%`,
                  backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Event Breakdown Chart
function EventBreakdown({
  events,
  isDark,
  loading,
}: {
  events: Record<string, number>;
  isDark: boolean;
  loading: boolean;
}) {
  const eventLabels: Record<string, string> = {
    page_view: 'Sayfa Görüntüleme',
    session_start: 'Oturum Başlangıcı',
    first_visit: 'İlk Ziyaret',
    scroll: 'Kaydırma',
    user_engagement: 'Kullanıcı Etkileşimi',
    form_start: 'Form Başlangıcı',
    view_search_results: 'Arama Sonuçları',
    add_to_cart: 'Sepete Ekle',
    begin_checkout: 'Ödeme Başlat',
    purchase: 'Satın Alma',
  };

  const data = Object.entries(events)
    .slice(0, 7)
    .map(([name, count]) => ({
      name: eventLabels[name] || name,
      value: count,
    }));

  if (loading || data.length === 0) {
    return (
      <div className={`h-48 flex items-center justify-center rounded-xl ${isDark ? 'bg-neutral-900/50' : 'bg-gray-50'}`}>
        <div className="text-gray-400">Veri yok</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between py-2">
          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {item.name}
          </span>
          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatNumber(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Device Distribution
function DeviceDistribution({
  devices,
  isDark,
  loading,
}: {
  devices: Record<string, number>;
  isDark: boolean;
  loading: boolean;
}) {
  const data = Object.entries(devices).map(([name, value]) => ({
    name: name === 'mobile' ? 'Mobil' : name === 'desktop' ? 'Masaüstü' : 'Tablet',
    value,
  }));

  const total = data.reduce((acc, d) => acc + d.value, 0);

  if (loading || total === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-400">Veri yok</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="w-24 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={25}
              outerRadius={40}
              dataKey="value"
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        {data.map((item, idx) => {
          const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
          return (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
              />
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {item.name}
              </span>
              <span className={`text-sm font-medium ml-auto ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {percent}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// City Distribution
function CityDistribution({
  cities,
  isDark,
  loading,
}: {
  cities: Array<{ city: string; count: number }>;
  isDark: boolean;
  loading: boolean;
}) {
  if (loading || cities.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-400">Veri yok</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {cities.slice(0, 7).map((city, idx) => (
        <div key={idx} className="flex items-center justify-between py-1">
          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {city.city}
          </span>
          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatNumber(city.count)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Channel Group Distribution - Google Analytics Style
function ChannelGroupTable({
  channels,
  isDark,
  loading,
}: {
  channels: ChannelData[];
  isDark: boolean;
  loading: boolean;
}) {
  const channelColors: Record<string, string> = {
    'Paid Social': '#EC4899',
    'Paid Other': '#8B5CF6',
    'Organic Social': '#10B981',
    'Organic Search': '#3B82F6',
    'Direct': '#6B7280',
    'Referral': '#F59E0B',
    'Email': '#EF4444',
    'Unassigned': '#9CA3AF',
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>
    );
  }

  const total = channels.reduce((acc, c) => acc + c.sessions, 0);

  return (
    <div className="space-y-3">
      {channels.map((channel, idx) => {
        const percent = total > 0 ? (channel.sessions / total) * 100 : 0;
        const color = channelColors[channel.channel] || '#6B7280';
        return (
          <div key={idx}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {channel.channel}
              </span>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {formatNumber(channel.sessions)}
                </span>
                {channel.sessionsTrend !== 0 && (
                  <span className={`text-xs ${channel.sessionsTrend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {channel.sessionsTrend > 0 ? '+' : ''}{channel.sessionsTrend.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${percent}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Cohort Analysis Table
function CohortTable({
  cohorts,
  isDark,
  loading,
}: {
  cohorts: CohortData[];
  isDark: boolean;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="animate-pulse h-48 bg-gray-200 dark:bg-gray-700 rounded" />
    );
  }

  if (cohorts.length === 0) {
    return (
      <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Cohort verisi yok
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={isDark ? 'text-gray-400' : 'text-gray-500'}>
            <th className="text-left pb-2 font-medium">Hafta</th>
            <th className="text-right pb-2 font-medium">Elde Tutma</th>
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort, idx) => (
            <tr key={idx} className={`border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
              <td className="py-2">
                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {cohort.week}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {cohort.dateRange}
                </div>
              </td>
              <td className="py-2 text-right">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    cohort.retention > 5
                      ? 'bg-green-500/20 text-green-500'
                      : cohort.retention > 1
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : 'bg-gray-500/20 text-gray-500'
                  }`}
                >
                  %{cohort.retention.toFixed(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// New vs Returning Users Overview
function UserOverviewCard({
  newUsers,
  returningUsers,
  isDark,
  loading,
}: {
  newUsers: number;
  returningUsers: number;
  isDark: boolean;
  loading: boolean;
}) {
  const total = newUsers + returningUsers;
  const newPercent = total > 0 ? (newUsers / total) * 100 : 0;

  if (loading) {
    return (
      <div className="animate-pulse h-32 bg-gray-200 dark:bg-gray-700 rounded" />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Yeni kullanıcı sayısı</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatNumber(newUsers)}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Geri gelen kullanıcılar</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatNumber(returningUsers)}
          </p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>Yeni %{newPercent.toFixed(1)}</span>
          <span className={isDark ? 'text-purple-400' : 'text-purple-600'}>Geri gelen %{(100 - newPercent).toFixed(1)}</span>
        </div>
        <div className={`h-3 rounded-full overflow-hidden flex ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
          <div className="h-full bg-blue-500" style={{ width: `${newPercent}%` }} />
          <div className="h-full bg-purple-500" style={{ width: `${100 - newPercent}%` }} />
        </div>
      </div>
    </div>
  );
}

// Landing Pages Table
function LandingPagesTable({
  pages,
  isDark,
  loading,
}: {
  pages: Array<{ path: string; count: number }>;
  isDark: boolean;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Veri yok
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pages.slice(0, 7).map((page, idx) => (
        <div key={idx} className="flex items-center justify-between py-1">
          <span className={`text-sm truncate max-w-[200px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {page.path}
          </span>
          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatNumber(page.count)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function AnalizlerV2Page() {
  const { isDark } = useTheme();
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState<'activeUsers' | 'newUsers' | 'sessions' | 'pageViews'>('activeUsers');
  
  // Data states
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [acquisition, setAcquisition] = useState<AcquisitionSource[]>([]);
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [landingPages, setLandingPages] = useState<Array<{ path: string; count: number }>>([]);
  const [realtime, setRealtime] = useState<RealtimeData>({ count: 0, visitors: [], byCountry: [], byPage: [] });
  const [events, setEvents] = useState<Record<string, number>>({});
  const [devices, setDevices] = useState<Record<string, number>>({});
  const [cities, setCities] = useState<Array<{ city: string; count: number }>>([]);
  const [returningUsers, setReturningUsers] = useState(0);
  const [dataSource, setDataSource] = useState<'google-analytics' | 'supabase'>('supabase');

  const periodOptions = [
    { value: '1d', label: 'Bugün' },
    { value: '7d', label: 'Son 7 Gün' },
    { value: '30d', label: 'Son 30 Gün' },
    { value: '90d', label: 'Son 90 Gün' },
  ];

  const chartMetricOptions = [
    { value: 'activeUsers', label: 'Aktif Kullanıcılar' },
    { value: 'newUsers', label: 'Yeni Kullanıcılar' },
    { value: 'sessions', label: 'Oturumlar' },
    { value: 'pageViews', label: 'Sayfa Görüntüleme' },
  ];

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    
    try {
      // Önce Google Analytics API'yi dene
      const gaRes = await fetch(`/api/analytics/google?period=${period}`);
      
      if (gaRes.ok) {
        const gaData = await gaRes.json();
        
        if (gaData.success && gaData.source === 'google-analytics') {
          setDataSource('google-analytics');
          
          // KPIs from Google Analytics
          setKpis({
            activeUsers: gaData.kpis.activeUsers.value,
            activeUsersTrend: gaData.kpis.activeUsers.trend,
            newUsers: gaData.kpis.newUsers.value,
            newUsersTrend: gaData.kpis.newUsers.trend,
            avgEngagementTime: gaData.kpis.avgSessionDuration.value,
            avgEngagementTimeTrend: gaData.kpis.avgSessionDuration.trend,
            totalEvents: gaData.kpis.eventCount.value,
            totalEventsTrend: 0,
            sessions: gaData.kpis.sessions.value,
            sessionsTrend: gaData.kpis.sessions.trend,
            pageViews: gaData.kpis.pageViews.value,
            pageViewsTrend: gaData.kpis.pageViews.trend,
            bounceRate: gaData.kpis.bounceRate.value,
            bounceRateTrend: gaData.kpis.bounceRate.trend,
            conversions: gaData.kpis.conversions.value,
            conversionsTrend: 0,
            revenue: gaData.kpis.revenue.value * 100, // cents
            revenueTrend: 0,
          });

          // Top pages from GA
          if (gaData.topPages) {
            setTopPages(gaData.topPages.map((p: any) => ({
              path: p.path,
              title: p.title || p.path,
              views: p.views,
              viewsTrend: 0,
              users: p.users,
              events: 0,
              bounceRate: p.bounceRate,
            })));
          }

          // Acquisition sources from GA
          if (gaData.acquisitionSources) {
            setAcquisition(gaData.acquisitionSources.map((s: any) => ({
              source: `${s.source} / ${s.medium}`,
              sessions: s.sessions,
              sessionsTrend: 0,
              users: s.users,
              newUsers: Math.round(s.users * 0.7),
            })));
          }

          // Realtime from GA
          if (gaData.realtime) {
            setRealtime({
              count: gaData.realtime.activeUsers,
              visitors: [],
              byCountry: [],
              byPage: [],
            });
          }

          // Timeseries from GA
          const gaTimeseriesRes = await fetch(`/api/analytics/google/timeseries?period=${period}`);
          if (gaTimeseriesRes.ok) {
            const gaTimeseriesData = await gaTimeseriesRes.json();
            if (gaTimeseriesData.data) {
              setTimeSeries(gaTimeseriesData.data.map((d: any) => ({
                date: d.date,
                activeUsers: d.activeUsers,
                newUsers: d.newUsers,
                sessions: d.sessions,
                pageViews: d.pageViews,
              })));
            }
          }

          // GA realtime for detailed info
          const gaRealtimeRes = await fetch('/api/analytics/google/realtime');
          if (gaRealtimeRes.ok) {
            const gaRealtimeData = await gaRealtimeRes.json();
            if (gaRealtimeData.success) {
              setRealtime({
                count: gaRealtimeData.activeUsers,
                visitors: [],
                byCountry: gaRealtimeData.countries?.map((c: any) => ({ country: c.country, count: c.users })) || [],
                byPage: gaRealtimeData.activePages?.map((p: any) => ({ page: p.page, count: p.users })) || [],
              });
              
              // Devices from realtime
              const deviceMap: Record<string, number> = {};
              (gaRealtimeData.devices || []).forEach((d: any) => {
                deviceMap[d.device] = d.users;
              });
              setDevices(deviceMap);
            }
          }

          // Skip Supabase fallback, we have GA data
          setLoading(false);
          return;
        }
      }

      // Fallback to Supabase if Google Analytics not configured or failed
      setDataSource('supabase');
      
      // Yeni v2 API'leri ve eski API'leri paralel çağır
      const [kpisRes, timeseriesRes, acquisitionRes, statsRes, realtimeRes] = await Promise.all([
        fetch(`/api/analytics/v2/kpis?period=${period}`),
        fetch(`/api/analytics/v2/timeseries?period=${period}`),
        fetch(`/api/analytics/v2/acquisition?period=${period}`),
        fetch(`/api/analytics/stats?period=${period}`),
        fetch('/api/analytics/realtime?minutes=30'),
      ]);

      // KPIs
      if (kpisRes.ok) {
        const kpisData = await kpisRes.json();
        if (kpisData.kpis) {
          setKpis(kpisData.kpis);
        }
      }

      // Timeseries
      if (timeseriesRes.ok) {
        const timeseriesData = await timeseriesRes.json();
        if (timeseriesData.data) {
          setTimeSeries(timeseriesData.data);
        }
      }

      // Acquisition
      if (acquisitionRes.ok) {
        const acquisitionData = await acquisitionRes.json();
        if (acquisitionData.sources) {
          setAcquisition(acquisitionData.sources);
        }
        if (acquisitionData.channels) {
          setChannels(acquisitionData.channels);
        }
      }

      // Stats (eski API - top pages, events, devices için)
      if (statsRes.ok) {
        const stats = await statsRes.json();
        
        // Returning users (yaklaşık hesap)
        const totalUsers = stats.overview?.uniqueVisitors || 0;
        const estimatedReturning = Math.round(totalUsers * 0.1); // %10 geri gelen
        setReturningUsers(estimatedReturning);

        // Landing pages
        if (stats.topLandingPages) {
          setLandingPages(stats.topLandingPages.map((p: { page: string; count: number }) => ({
            path: p.page,
            count: p.count,
          })));
        }

        // Generate cohort data
        const days = period === '1d' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const weeks = Math.ceil(days / 7);
        const cohortData: CohortData[] = [];
        for (let i = 0; i < Math.min(weeks, 6); i++) {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
          const weekEnd = new Date();
          weekEnd.setDate(weekEnd.getDate() - i * 7);
          
          const retention = i === 0 ? 100 : Math.max(0, 100 / Math.pow(2, i + 2));
          cohortData.push({
            week: `${i}. Hafta`,
            dateRange: `${weekStart.getDate()} ${weekStart.toLocaleString('tr-TR', { month: 'short' })} - ${weekEnd.getDate()} ${weekEnd.toLocaleString('tr-TR', { month: 'short' })}`,
            retention,
          });
        }
        setCohorts(cohortData);
        
        // Fallback KPIs if v2 failed
        if (!kpis) {
          setKpis({
            activeUsers: stats.overview?.uniqueVisitors || 0,
            activeUsersTrend: 0,
            newUsers: stats.overview?.uniqueVisitors || 0,
            newUsersTrend: 0,
            avgEngagementTime: stats.overview?.avgSessionDuration || 0,
            avgEngagementTimeTrend: 0,
            totalEvents: stats.overview?.totalEvents || 0,
            totalEventsTrend: 0,
            sessions: stats.overview?.totalSessions || 0,
            sessionsTrend: 0,
            pageViews: stats.overview?.totalPageViews || 0,
            pageViewsTrend: 0,
            bounceRate: stats.overview?.bounceRate || 0,
            bounceRateTrend: 0,
            conversions: stats.conversions?.total || 0,
            conversionsTrend: 0,
            revenue: stats.conversions?.revenue || 0,
            revenueTrend: 0,
          });
        }

        // Fallback acquisition if v2 failed
        if (acquisition.length === 0) {
          const sources: AcquisitionSource[] = (stats.topSources || []).map((s: any) => ({
            source: s.source,
            sessions: s.count,
            sessionsTrend: 0,
            users: s.count,
            newUsers: Math.round(s.count * 0.8),
          }));
          setAcquisition(sources);
        }

        // Map to top pages
        const pages: TopPage[] = (stats.topPages || []).map((p: any) => ({
          path: p.path,
          title: p.title,
          views: p.count,
          viewsTrend: 0,
          users: Math.round(p.count * 0.7),
          events: Math.round(p.count * 1.5),
          bounceRate: stats.overview?.bounceRate || 45,
        }));
        setTopPages(pages);

        // Events
        setEvents(stats.eventBreakdown || {});

        // Devices
        setDevices(stats.devices || {});
      }

      if (realtimeRes.ok) {
        const realtimeData = await realtimeRes.json();
        
        // Count by country
        const countryMap: Record<string, number> = {};
        (realtimeData.visitors || []).forEach((v: any) => {
          const country = v.country || 'Türkiye';
          countryMap[country] = (countryMap[country] || 0) + 1;
        });
        const byCountry = Object.entries(countryMap)
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count);

        // Count by page
        const pageMap: Record<string, number> = {};
        (realtimeData.activePages || []).forEach((p: any) => {
          pageMap[p.path] = p.count;
        });
        const byPage = Object.entries(pageMap)
          .map(([page, count]) => ({ page, count }))
          .sort((a, b) => b.count - a.count);

        setRealtime({
          count: realtimeData.count || 0,
          visitors: realtimeData.visitors || [],
          byCountry,
          byPage,
        });

        // Extract cities from visitors
        const cityMap: Record<string, number> = {};
        (realtimeData.visitors || []).forEach((v: any) => {
          const city = v.city || 'Istanbul';
          cityMap[city] = (cityMap[city] || 0) + 1;
        });
        setCities(
          Object.entries(cityMap)
            .map(([city, count]) => ({ city, count }))
            .sort((a, b) => b.count - a.count)
        );
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  useEffect(() => {
    fetchData();
    // Realtime refresh every 30 seconds
    const interval = setInterval(() => {
      fetch('/api/analytics/realtime?minutes=30')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            const countryMap: Record<string, number> = {};
            (data.visitors || []).forEach((v: any) => {
              const country = v.country || 'Türkiye';
              countryMap[country] = (countryMap[country] || 0) + 1;
            });
            const byCountry = Object.entries(countryMap)
              .map(([country, count]) => ({ country, count }))
              .sort((a, b) => b.count - a.count);

            setRealtime({
              count: data.count || 0,
              visitors: data.visitors || [],
              byCountry,
              byPage: [],
            });
          }
        });
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <FadeContent>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Analytics
            </h1>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Raporlar anlık görüntüsü
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                dataSource === 'google-analytics' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {dataSource === 'google-analytics' ? '📊 Google Analytics' : '🗄️ Supabase'}
              </span>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className={`flex items-center gap-1 p-1 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              {periodOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    period === opt.value
                      ? isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm'
                      : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchData}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Yenile"
            >
              <HiOutlineRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Main KPI Cards - 2 Rows */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <KPICard
            title="Tekil Ziyaretçi"
            value={kpis?.activeUsers || 0}
            trend={kpis?.activeUsersTrend}
            isDark={isDark}
            loading={loading}
          />
          <KPICard
            title="Toplam Görüntüleme"
            value={kpis?.pageViews || 0}
            trend={kpis?.pageViewsTrend}
            isDark={isDark}
            loading={loading}
          />
          <KPICard
            title="Etkileşim Sayısı"
            value={kpis?.totalEvents || 0}
            trend={kpis?.totalEventsTrend}
            isDark={isDark}
            loading={loading}
          />
          <KPICard
            title="Yeni Kullanıcı"
            value={kpis?.newUsers || 0}
            trend={kpis?.newUsersTrend}
            isDark={isDark}
            loading={loading}
          />
          <KPICard
            title="Ort. Etkileşim Süresi"
            value={kpis?.avgEngagementTime || 0}
            format="duration"
            trend={kpis?.avgEngagementTimeTrend}
            isDark={isDark}
            loading={loading}
          />
          <KPICard
            title="Oturum Sayısı"
            value={kpis?.sessions || 0}
            trend={kpis?.sessionsTrend}
            isDark={isDark}
            loading={loading}
          />
        </div>

        {/* Main Content Grid - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart & Tables */}
          <div className="lg:col-span-2 space-y-6">
            {/* New vs Returning Users */}
            <SpotlightCard className="p-5">
              <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Potansiyel müşteriler elde etmeye genel bakış
              </h3>
              <UserOverviewCard
                newUsers={kpis?.newUsers || 0}
                returningUsers={returningUsers}
                isDark={isDark}
                loading={loading}
              />
            </SpotlightCard>

            {/* Trend Chart */}
            <SpotlightCard className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Kullanıcı Trendi
                </h3>
                <div className={`flex items-center gap-1 p-1 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                  {chartMetricOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setChartMetric(opt.value as typeof chartMetric)}
                      className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                        chartMetric === opt.value
                          ? isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm'
                          : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <TrendChart
                data={timeSeries}
                isDark={isDark}
                loading={loading}
                metric={chartMetric}
              />
            </SpotlightCard>

            {/* Channel Group Distribution */}
            <SpotlightCard className="p-5">
              <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Kanal grubu bazında oturumlar
              </h3>
              <ChannelGroupTable channels={channels} isDark={isDark} loading={loading} />
            </SpotlightCard>

            {/* Top Pages Table */}
            <SpotlightCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  En iyi performans gösteren sayfalar
                </h3>
              </div>
              <TopPagesTable pages={topPages} isDark={isDark} loading={loading} />
            </SpotlightCard>

            {/* Acquisition Sources */}
            <SpotlightCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Oturum kaynağı bazında oturumlar
                </h3>
              </div>
              <AcquisitionTable sources={acquisition} isDark={isDark} loading={loading} />
            </SpotlightCard>

            {/* Cohort Analysis */}
            <SpotlightCard className="p-5">
              <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Gruba göre kullanıcı etkinliği (Haftalık)
              </h3>
              <CohortTable cohorts={cohorts} isDark={isDark} loading={loading} />
            </SpotlightCard>
          </div>

          {/* Right Column - Realtime & Metrics */}
          <div className="space-y-6">
            {/* Realtime Users */}
            <RealtimeCard
              count={realtime.count}
              byCountry={realtime.byCountry}
              isDark={isDark}
              loading={loading}
            />

            {/* City Distribution */}
            <SpotlightCard className="p-5">
              <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Şehir bazında etkin kullanıcı sayısı
              </h3>
              <CityDistribution cities={cities} isDark={isDark} loading={loading} />
            </SpotlightCard>

            {/* Landing Pages */}
            <SpotlightCard className="p-5">
              <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Açılış sayfası bazında oturumlar
              </h3>
              <LandingPagesTable pages={landingPages} isDark={isDark} loading={loading} />
            </SpotlightCard>

            {/* Event Breakdown */}
            <SpotlightCard className="p-5">
              <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Etkinlik adı bazında etkinlik sayısı
              </h3>
              <EventBreakdown events={events} isDark={isDark} loading={loading} />
            </SpotlightCard>

            {/* Device Distribution */}
            <SpotlightCard className="p-5">
              <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Cihaz Dağılımı
              </h3>
              <DeviceDistribution devices={devices} isDark={isDark} loading={loading} />
            </SpotlightCard>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <KPICard
                title="Hemen çıkma"
                value={kpis?.bounceRate || 0}
                format="percent"
                isDark={isDark}
                loading={loading}
              />
              <KPICard
                title="Dönüşümler"
                value={kpis?.conversions || 0}
                trend={kpis?.conversionsTrend}
                isDark={isDark}
                loading={loading}
              />
              <KPICard
                title="Dönüşüm Oranı"
                value={kpis?.conversions && kpis?.sessions ? (kpis.conversions / kpis.sessions) * 100 : 0}
                format="percent"
                isDark={isDark}
                loading={loading}
              />
              <KPICard
                title="Gelir"
                value={kpis?.revenue || 0}
                format="currency"
                trend={kpis?.revenueTrend}
                isDark={isDark}
                loading={loading}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`text-center text-xs py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Vadiler Çiçek Analytics v2 • Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
        </div>
      </div>
    </FadeContent>
  );
}
