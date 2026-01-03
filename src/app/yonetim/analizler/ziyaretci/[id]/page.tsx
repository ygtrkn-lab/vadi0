'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface VisitorData {
  visitorId: string;
  summary: {
    firstVisit: string;
    lastVisit: string;
    totalSessions: number;
    totalPageViews: number;
    totalEvents: number;
    totalDuration: number;
    avgSessionDuration: number;
    converted: boolean;
    totalConversionValue: number;
    customerId: string | null;
  };
  device: {
    type: string | null;
    model: string | null;
    browser: string | null;
    browserVersion: string | null;
    os: string | null;
    osVersion: string | null;
    screenWidth: number | null;
    screenHeight: number | null;
    language: string | null;
  };
  uniquePages: string[];
  eventBreakdown: Record<string, number>;
  trafficSources: Array<{
    sessionId: string;
    source: string;
    medium: string | null;
    campaign: string | null;
    referrer: string | null;
    referrerDomain: string | null;
    landingPage: string | null;
  }>;
  sessions: Array<{
    id: string;
    startedAt: string;
    endedAt: string | null;
    duration: number;
    pageViews: number;
    eventsCount: number;
    isBounce: boolean;
    converted: boolean;
    conversionValue: number;
    landingPage: string | null;
    exitPage: string | null;
    source: string;
  }>;
  journey: Array<{
    type: 'page_view' | 'event';
    timestamp: string;
    data: any;
  }>;
}

export default function VisitorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const visitorId = params.id as string;

  const [data, setData] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'journey' | 'sessions' | 'pages' | 'events'>('journey');

  useEffect(() => {
    async function fetchVisitorData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/visitor/${visitorId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Ziyaretçi bulunamadı');
          } else {
            setError('Veriler yüklenirken bir hata oluştu');
          }
          return;
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Failed to fetch visitor data:', err);
        setError('Veriler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    if (visitorId) {
      fetchVisitorData();
    }
  }, [visitorId]);

  function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}sn`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}dk ${seconds % 60}sn`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}sa ${mins}dk`;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function getDeviceIcon(type: string | null): string {
    switch (type) {
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      case 'desktop': return '💻';
      default: return '🖥️';
    }
  }

  function getEventIcon(eventName: string): string {
    switch (eventName) {
      case 'add_to_cart': return '🛒';
      case 'remove_from_cart': return '❌';
      case 'purchase': return '💳';
      case 'view_product': return '👁️';
      case 'search': return '🔍';
      case 'signup': return '✅';
      case 'login': return '🔐';
      default: return '⚡';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-lg p-6 h-32"></div>
              ))}
            </div>
            <div className="bg-white rounded-lg p-6 h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-6 text-green-600 hover:text-green-700 flex items-center gap-2"
          >
            ← Geri Dön
          </button>
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-red-500 text-lg">{error || 'Bir hata oluştu'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/yonetim/analizler')}
            className="mb-4 text-green-600 hover:text-green-700 flex items-center gap-2"
          >
            ← Analiz Paneline Dön
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ziyaretçi Detayları</h1>
              <p className="text-sm text-gray-500 mt-1 font-mono">
                ID: {data.visitorId.substring(0, 16)}...
              </p>
            </div>
            
            {data.summary.converted && (
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                ✓ Dönüşüm Sağlandı - {data.summary.totalConversionValue.toLocaleString('tr-TR')} ₺
              </span>
            )}
          </div>
        </div>

        {/* Özet Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-6 shadow-sm"
          >
            <div className="text-sm text-gray-500 mb-1">Toplam Oturum</div>
            <div className="text-3xl font-bold text-gray-900">{data.summary.totalSessions}</div>
            <div className="text-xs text-gray-400 mt-2">
              İlk ziyaret: {formatDate(data.summary.firstVisit)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg p-6 shadow-sm"
          >
            <div className="text-sm text-gray-500 mb-1">Sayfa Görüntüleme</div>
            <div className="text-3xl font-bold text-blue-600">{data.summary.totalPageViews}</div>
            <div className="text-xs text-gray-400 mt-2">
              {data.uniquePages.length} benzersiz sayfa
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-6 shadow-sm"
          >
            <div className="text-sm text-gray-500 mb-1">Toplam Süre</div>
            <div className="text-3xl font-bold text-purple-600">{formatDuration(data.summary.totalDuration)}</div>
            <div className="text-xs text-gray-400 mt-2">
              Ort. oturum: {formatDuration(data.summary.avgSessionDuration)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg p-6 shadow-sm"
          >
            <div className="text-sm text-gray-500 mb-1">Toplam Eylem</div>
            <div className="text-3xl font-bold text-orange-600">{data.summary.totalEvents}</div>
            <div className="text-xs text-gray-400 mt-2">
              {Object.keys(data.eventBreakdown).length} farklı eylem türü
            </div>
          </motion.div>
        </div>

        {/* Cihaz ve Kaynak Bilgileri */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Cihaz Bilgileri */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              {getDeviceIcon(data.device.type)} Cihaz Bilgileri
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Cihaz Tipi</span>
                <span className="font-medium capitalize">{data.device.type || 'Bilinmiyor'}</span>
              </div>
              {data.device.model && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Cihaz Modeli</span>
                  <span className="font-medium">{data.device.model}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Tarayıcı</span>
                <span className="font-medium">
                  {data.device.browser || 'Bilinmiyor'}
                  {data.device.browserVersion && ` v${data.device.browserVersion}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">İşletim Sistemi</span>
                <span className="font-medium">
                  {data.device.os || 'Bilinmiyor'}
                  {data.device.osVersion && ` ${data.device.osVersion}`}
                </span>
              </div>
              {data.device.screenWidth && data.device.screenHeight && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Ekran Çözünürlüğü</span>
                  <span className="font-medium">{data.device.screenWidth} x {data.device.screenHeight}</span>
                </div>
              )}
              {data.device.language && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Dil</span>
                  <span className="font-medium uppercase">{data.device.language}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Trafik Kaynakları */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🔗 Trafik Kaynakları</h2>
            <div className="space-y-3">
              {data.trafficSources.slice(0, 5).map((source, index) => (
                <div key={source.sessionId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium capitalize">{source.source}</span>
                    {source.medium && (
                      <span className="text-gray-500 text-sm ml-2">/ {source.medium}</span>
                    )}
                    {source.campaign && (
                      <span className="text-blue-600 text-sm ml-2">({source.campaign})</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">#{index + 1}</span>
                </div>
              ))}
              {data.trafficSources.length === 0 && (
                <p className="text-gray-400 text-center py-4">Trafik kaynağı bilgisi yok</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'journey', label: '🗺️ Yolculuk Haritası', count: data.journey.length },
                { id: 'sessions', label: '📊 Oturumlar', count: data.sessions.length },
                { id: 'pages', label: '📄 Sayfalar', count: data.uniquePages.length },
                { id: 'events', label: '⚡ Eylemler', count: data.summary.totalEvents },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Yolculuk Haritası */}
              {activeTab === 'journey' && (
                <motion.div
                  key="journey"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative"
                >
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <div className="space-y-4">
                    {data.journey.map((item, index) => (
                      <motion.div
                        key={`${item.type}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative pl-10"
                      >
                        <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                          item.type === 'page_view'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-orange-100 text-orange-600'
                        }`}>
                          {item.type === 'page_view' ? '📄' : getEventIcon(item.data.event_name)}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">
                              {formatTime(item.timestamp)}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              item.type === 'page_view'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {item.type === 'page_view' ? 'Sayfa Görüntüleme' : 'Eylem'}
                            </span>
                          </div>
                          {item.type === 'page_view' ? (
                            <div>
                              <p className="font-medium text-gray-900 truncate">
                                {item.data.page_title || item.data.page_path}
                              </p>
                              <p className="text-sm text-gray-500 truncate">{item.data.page_path}</p>
                              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                                {item.data.time_on_page_seconds > 0 && (
                                  <span>⏱️ {formatDuration(item.data.time_on_page_seconds)}</span>
                                )}
                                {item.data.scroll_depth_percent > 0 && (
                                  <span>📜 %{item.data.scroll_depth_percent} scroll</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-gray-900">
                                {item.data.event_name.replace(/_/g, ' ')}
                              </p>
                              {item.data.event_label && (
                                <p className="text-sm text-gray-500">{item.data.event_label}</p>
                              )}
                              {item.data.event_value && (
                                <p className="text-sm text-green-600 mt-1">
                                  Değer: {item.data.event_value.toLocaleString('tr-TR')} ₺
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {data.journey.length === 0 && (
                      <p className="text-gray-400 text-center py-8">Yolculuk verisi bulunamadı</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Oturumlar */}
              {activeTab === 'sessions' && (
                <motion.div
                  key="sessions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {data.sessions.map((session, index) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-gray-900">Oturum #{data.sessions.length - index}</span>
                          {session.isBounce && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Bounce</span>
                          )}
                          {session.converted && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                              Dönüşüm: {session.conversionValue.toLocaleString('tr-TR')} ₺
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(session.startedAt)}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Süre:</span>
                          <span className="ml-2 font-medium">{formatDuration(session.duration)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Sayfalar:</span>
                          <span className="ml-2 font-medium">{session.pageViews}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Eylemler:</span>
                          <span className="ml-2 font-medium">{session.eventsCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Kaynak:</span>
                          <span className="ml-2 font-medium capitalize">{session.source}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                        <div className="text-gray-500">
                          <span className="font-medium text-gray-700">Giriş:</span> {session.landingPage || '/'}
                        </div>
                        {session.exitPage && (
                          <div className="text-gray-500 mt-1">
                            <span className="font-medium text-gray-700">Çıkış:</span> {session.exitPage}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Sayfalar */}
              {activeTab === 'pages' && (
                <motion.div
                  key="pages"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Sayfa</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Görüntülenme</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.uniquePages.map((page) => {
                          const viewCount = data.journey.filter(
                            j => j.type === 'page_view' && j.data.page_path === page
                          ).length;
                          return (
                            <tr key={page} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <span className="text-sm text-gray-900">{page}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                  {viewCount}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Eylemler */}
              {activeTab === 'events' && (
                <motion.div
                  key="events"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {Object.entries(data.eventBreakdown).map(([event, count]) => (
                      <div key={event} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getEventIcon(event)}</span>
                          <span className="font-medium capitalize">{event.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                  
                  {Object.keys(data.eventBreakdown).length === 0 && (
                    <p className="text-gray-400 text-center py-8">Henüz eylem kaydedilmemiş</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
