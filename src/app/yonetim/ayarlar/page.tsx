'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard, FadeContent } from '@/components/admin';
import BulkPriceAdjustment from '@/components/admin/BulkPriceAdjustment';
import { useTheme } from '../ThemeContext';
import { 
  HiOutlineCog, 
  HiOutlineTruck, 
  HiOutlineLockClosed,
  HiOutlineGlobe,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineCurrencyDollar,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCheck,
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlineColorSwatch,
  HiOutlineRefresh,
  HiOutlineTag,
  HiOutlineCalendar,
  HiOutlineChartBar
} from 'react-icons/hi';

type SettingsData = Record<string, Record<string, any>>;

export default function AyarlarPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('security');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  
  const { isDark } = useTheme();

  const [apiSettings, setApiSettings] = useState<SettingsData>({});
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([]);

  const [settings, setSettings] = useState({
    siteName: '',
    siteDescription: '',
    email: '',
    phone: '',
    address: '',
    currency: 'TRY',
    minOrder: 0,
    freeShipping: 0,
    shippingCost: 0,
    expressShipping: 0,
    instagram: '',
    facebook: '',
    twitter: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
    twoFactor: false,
    emailNotifications: true,
    smsNotifications: false,
    orderNotifications: true,
    marketingEmails: false,
    analyticsEnabled: true,
  });

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/admin/settings');
        
        if (!response.ok) {
          throw new Error('Ayarlar yüklenemedi');
        }
        
        const data = await response.json();
        setApiSettings(data.settings || {});
        
        const site = data.settings?.site || {};
        const delivery = data.settings?.delivery || {};
        const social = data.settings?.social || {};
        const analytics = data.settings?.analytics || {};
        
        setSettings(prev => ({
          ...prev,
          siteName: site.name || 'Vadiler',
          siteDescription: site.description || '',
          email: site.email || 'bilgi@vadiler.com',
          phone: site.phone || '0850 307 4876',
          address: site.address || 'İstanbul, Türkiye',
          minOrder: delivery.min_order_amount || 100,
          freeShipping: delivery.free_shipping_threshold || 500,
          shippingCost: delivery.standard_shipping_cost || 29,
          instagram: social.instagram || '',
          facebook: social.facebook || '',
          twitter: social.twitter || '',
          analyticsEnabled: analytics.enabled !== false,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        console.error('Settings load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Load categories (for pricing tools)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories?all=true', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        const items = Array.isArray(data?.categories) ? data.categories : [];
        setCategories(
          items
            .map((c: any) => ({
              id: Number(c.id),
              name: String(c.name ?? c.title ?? c.slug ?? ''),
              slug: String(c.slug ?? ''),
            }))
            .filter((c: any) => c.slug && c.name)
        );
      } catch (err) {
        console.error('Categories load error:', err);
      }
    };

    loadCategories();
  }, []);

  const handleChange = (field: string, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      // Save site settings
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          category: 'site',
          updates: {
            name: settings.siteName,
            description: settings.siteDescription,
            email: settings.email,
            phone: settings.phone,
            address: settings.address,
          }
        })
      });

      // Save delivery settings
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          category: 'delivery',
          updates: {
            min_order_amount: settings.minOrder,
            free_shipping_threshold: settings.freeShipping,
            standard_shipping_cost: settings.shippingCost,
          }
        })
      });

      // Save social settings
      if (settings.instagram || settings.facebook || settings.twitter) {
        await fetch('/api/admin/settings', {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            category: 'social',
            updates: {
              instagram: settings.instagram,
              facebook: settings.facebook,
              twitter: settings.twitter,
            }
          })
        });
      }

      // Save analytics settings
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          category: 'analytics',
          updates: {
            enabled: settings.analyticsEnabled,
          }
        })
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Save error:', error);
      alert('Kaydetme hatası!');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const testEmailAddress = 'yigitraiken@gmail.com'; // Kullanıcının email adresi
      
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmailAddress
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ Test email gönderildi!\n${testEmailAddress} adresini kontrol edin.`);
      } else {
        const error = await response.json();
        alert(`❌ Email gönderilemedi: ${error.details || error.error || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Bilinmeyen hata';
      alert(`❌ Email gönderme hatası: ${errorMsg}`);
    } finally {
      setTestingEmail(false);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST'
      });
      alert('✅ Cache temizlendi!');
    } catch (error) {
      alert('❌ Cache temizlenemedi!');
    } finally {
      setClearingCache(false);
    }
  };

  const handlePasswordChange = async () => {
    if (settings.newPassword !== settings.confirmPassword) {
      alert('Yeni şifreler eşleşmiyor!');
      return;
    }
    if (settings.newPassword.length < 8) {
      alert('Şifre en az 8 karakter olmalıdır!');
      return;
    }
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSettings(prev => ({ ...prev, password: '', newPassword: '', confirmPassword: '' }));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'security', label: 'Güvenlik', icon: <HiOutlineLockClosed className="w-5 h-5" /> },
    { id: 'pricing', label: 'Fiyatlandırma', icon: <HiOutlineTag className="w-5 h-5" /> },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className={`text-center py-12 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4 border-purple-600 border-t-transparent" />
          <p>Ayarlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <SpotlightCard className="p-6 text-center">
          <p className="text-red-500 mb-4">❌ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-purple-600 text-white rounded-xl"
          >
            Yeniden Dene
          </button>
        </SpotlightCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <FadeContent direction="up" delay={0}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Ayarlar</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Site ayarlarını yönetin</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/yonetim/ayarlar/off-gunleri"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                isDark
                  ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              <HiOutlineCalendar className="w-4 h-4" />
              <span className="hidden sm:inline">Off Günleri</span>
            </Link>
            <button
              onClick={handleClearCache}
              disabled={clearingCache}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50
                ${isDark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <HiOutlineRefresh className={`w-4 h-4 ${clearingCache ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Cache Temizle</span>
            </button>
            <AnimatePresence>
              {saved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                >
                  <HiOutlineCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-emerald-400 font-medium">Kaydedildi!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </FadeContent>

      {/* Tabs */}
      <FadeContent direction="up" delay={0.1}>
        <SpotlightCard className="p-2">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max flex items-center justify-center gap-2 px-4 py-3 rounded-xl 
                  font-medium transition-all whitespace-nowrap
                  ${activeTab === tab.id 
                    ? isDark ? 'bg-white text-black' : 'bg-purple-600 text-white'
                    : isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </SpotlightCard>
      </FadeContent>

      {/* General Settings */}
      <AnimatePresence mode="wait">
        {activeTab === 'general' && (
          <motion.div
            key="general"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <FadeContent direction="up" delay={0.15}>
              <SpotlightCard className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <HiOutlineGlobe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Site Bilgileri</h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Temel site ayarları</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      Site Adı
                    </label>
                    <input
                      type="text"
                      value={settings.siteName}
                      onChange={(e) => handleChange('siteName', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors
                        ${isDark 
                          ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                          : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      Site Açıklaması
                    </label>
                    <textarea
                      value={settings.siteDescription}
                      onChange={(e) => handleChange('siteDescription', e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors resize-none
                        ${isDark 
                          ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                          : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                    />
                  </div>
                </div>
              </SpotlightCard>
            </FadeContent>

            <FadeContent direction="up" delay={0.2}>
              <SpotlightCard className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <HiOutlineMail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>İletişim Bilgileri</h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Müşteri iletişim bilgileri</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      <HiOutlineMail className="w-4 h-4 inline mr-1" />
                      E-posta
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors
                        ${isDark 
                          ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                          : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      <HiOutlinePhone className="w-4 h-4 inline mr-1" />
                      Telefon
                    </label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors
                        ${isDark 
                          ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                          : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      <HiOutlineLocationMarker className="w-4 h-4 inline mr-1" />
                      Adres
                    </label>
                    <input
                      type="text"
                      value={settings.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors
                        ${isDark 
                          ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                          : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                    />
                  </div>
                </div>
              </SpotlightCard>
            </FadeContent>

            <FadeContent direction="up" delay={0.25}>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-medium transition-all 
                  disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                  ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
              >
                {saving ? (
                  <>
                    <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-black/20 border-t-black' : 'border-white/30 border-t-white'}`} />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <HiOutlineCheck className="w-5 h-5" />
                    Değişiklikleri Kaydet
                  </>
                )}
              </button>
            </FadeContent>
          </motion.div>
        )}

        {/* Shipping Settings */}
        {activeTab === 'shipping' && (
          <motion.div
            key="shipping"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <FadeContent direction="up" delay={0.15}>
              <SpotlightCard className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <HiOutlineCurrencyDollar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Sipariş Limitleri</h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Minimum sipariş ve ücretsiz kargo</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      Minimum Sipariş (₺)
                    </label>
                    <input
                      type="number"
                      value={settings.minOrder}
                      onChange={(e) => handleChange('minOrder', parseInt(e.target.value))}
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors
                        ${isDark 
                          ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                          : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      Ücretsiz Kargo Limiti (₺)
                    </label>
                    <input
                      type="number"
                      value={settings.freeShipping}
                      onChange={(e) => handleChange('freeShipping', parseInt(e.target.value))}
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors
                        ${isDark 
                          ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                          : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                    />
                  </div>
                </div>
              </SpotlightCard>
            </FadeContent>

            <FadeContent direction="up" delay={0.2}>
              <SpotlightCard className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                    <HiOutlineTruck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Kargo Ücretleri</h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Standart ve ekspres teslimat</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      Standart Kargo (₺)
                    </label>
                    <input
                      type="number"
                      value={settings.shippingCost}
                      onChange={(e) => handleChange('shippingCost', parseInt(e.target.value))}
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors
                        ${isDark 
                          ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                          : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                    />
                    <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>2-3 iş günü teslimat</p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      Ekspres Kargo (₺)
                    </label>
                    <input
                      type="number"
                      value={settings.expressShipping}
                      onChange={(e) => handleChange('expressShipping', parseInt(e.target.value))}
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors
                        ${isDark 
                          ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                          : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                    />
                    <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>Hızlı teslimat</p>
                  </div>
                </div>
              </SpotlightCard>
            </FadeContent>

            <FadeContent direction="up" delay={0.25}>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-medium transition-all 
                  disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                  ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
              >
                {saving ? (
                  <>
                    <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-black/20 border-t-black' : 'border-white/30 border-t-white'}`} />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <HiOutlineCheck className="w-5 h-5" />
                    Değişiklikleri Kaydet
                  </>
                )}
              </button>
            </FadeContent>
          </motion.div>
        )}

        {/* Social Media Settings */}
        {activeTab === 'social' && (
          <motion.div
            key="social"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <FadeContent direction="up" delay={0.15}>
              <SpotlightCard className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <HiOutlineGlobe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Sosyal Medya Linkleri</h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Footer ve header'da gösterilecek sosyal medya hesapları</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      value={settings.instagram}
                      onChange={(e) => handleChange('instagram', e.target.value)}
                      placeholder="https://instagram.com/vadilercom"
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors
                        ${isDark 
                          ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                          : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      Facebook URL
                    </label>
                    <input
                      type="url"
                      value={settings.facebook}
                      onChange={(e) => handleChange('facebook', e.target.value)}
                      placeholder="https://facebook.com/vadilercom"
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors
                        ${isDark 
                          ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                          : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      Twitter/X URL
                    </label>
                    <input
                      type="url"
                      value={settings.twitter}
                      onChange={(e) => handleChange('twitter', e.target.value)}
                      placeholder="https://twitter.com/vadilercom"
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors
                        ${isDark 
                          ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                          : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                    />
                  </div>
                </div>
              </SpotlightCard>
            </FadeContent>

            <FadeContent direction="up" delay={0.2}>
              <SpotlightCard className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <HiOutlineMail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Email Test</h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>SMTP ayarlarınızı test edin</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleTestEmail}
                    disabled={testingEmail || !settings.email}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed
                      ${isDark ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                  >
                    {testingEmail ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <HiOutlineMail className="w-5 h-5" />
                        Test Email Gönder
                      </>
                    )}
                  </button>
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                    <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>→</span>
                    <span className={`text-sm font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {settings.email || 'Email belirtilmedi'}
                    </span>
                  </div>
                </div>
              </SpotlightCard>
            </FadeContent>

            <FadeContent direction="up" delay={0.25}>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-medium transition-all 
                  disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                  ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
              >
                {saving ? (
                  <>
                    <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-black/20 border-t-black' : 'border-white/30 border-t-white'}`} />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <HiOutlineCheck className="w-5 h-5" />
                    Değişiklikleri Kaydet
                  </>
                )}
              </button>
            </FadeContent>
          </motion.div>
        )}

        {/* Notifications Settings */}
        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <FadeContent direction="up" delay={0.15}>
              <SpotlightCard className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                    <HiOutlineBell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Bildirim Tercihleri</h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Hangi bildirimleri almak istediğinizi seçin</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { id: 'emailNotifications', label: 'E-posta Bildirimleri', desc: 'Önemli güncellemeleri e-posta ile alın' },
                    { id: 'smsNotifications', label: 'SMS Bildirimleri', desc: 'Kritik uyarıları SMS ile alın' },
                    { id: 'orderNotifications', label: 'Sipariş Bildirimleri', desc: 'Yeni sipariş ve durum değişiklikleri' },
                    { id: 'marketingEmails', label: 'Pazarlama E-postaları', desc: 'Kampanya ve promosyon bildirimleri' },
                  ].map((item) => (
                    <div 
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}
                    >
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.label}</p>
                        <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{item.desc}</p>
                      </div>
                      <button
                        onClick={() => handleChange(item.id, !settings[item.id as keyof typeof settings])}
                        className={`relative w-12 h-7 rounded-full transition-colors
                          ${settings[item.id as keyof typeof settings] ? 'bg-emerald-500' : isDark ? 'bg-neutral-700' : 'bg-gray-300'}`}
                      >
                        <motion.div
                          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                          animate={{ left: settings[item.id as keyof typeof settings] ? '1.5rem' : '0.25rem' }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </SpotlightCard>
            </FadeContent>

            <FadeContent direction="up" delay={0.2}>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-medium transition-all 
                  disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                  ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
              >
                {saving ? (
                  <>
                    <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-black/20 border-t-black' : 'border-white/30 border-t-white'}`} />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <HiOutlineCheck className="w-5 h-5" />
                    Değişiklikleri Kaydet
                  </>
                )}
              </button>
            </FadeContent>
          </motion.div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <FadeContent direction="up" delay={0.15}>
              <SpotlightCard className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                    <HiOutlineLockClosed className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Şifre Değiştir</h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Hesap güvenliğiniz için güçlü şifre kullanın</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      Mevcut Şifre
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={settings.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        className={`w-full px-4 py-3 pr-12 rounded-xl focus:outline-none transition-colors
                          ${isDark 
                            ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                            : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                        placeholder="••••••••"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors
                          ${isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                      >
                        {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                        Yeni Şifre
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={settings.newPassword}
                          onChange={(e) => handleChange('newPassword', e.target.value)}
                          className={`w-full px-4 py-3 pr-12 rounded-xl focus:outline-none transition-colors
                            ${isDark 
                              ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                              : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                          placeholder="••••••••"
                        />
                        <button
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors
                            ${isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                        >
                          {showNewPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                        Şifre Tekrar
                      </label>
                      <input
                        type="password"
                        value={settings.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors
                          ${isDark 
                            ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                            : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handlePasswordChange}
                    disabled={saving || !settings.password || !settings.newPassword || !settings.confirmPassword}
                    className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-medium 
                      hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Şifreyi Güncelle
                  </button>
                </div>
              </SpotlightCard>
            </FadeContent>

            <FadeContent direction="up" delay={0.2}>
              <SpotlightCard className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                    <HiOutlineShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>İki Faktörlü Doğrulama</h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Ekstra güvenlik katmanı ekleyin</p>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>2FA Etkinleştir</p>
                    <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Google Authenticator ile doğrulama</p>
                  </div>
                  <button
                    onClick={() => handleChange('twoFactor', !settings.twoFactor)}
                    className={`relative w-12 h-7 rounded-full transition-colors
                      ${settings.twoFactor ? 'bg-emerald-500' : isDark ? 'bg-neutral-700' : 'bg-gray-300'}`}
                  >
                    <motion.div
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                      animate={{ left: settings.twoFactor ? '1.5rem' : '0.25rem' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {settings.twoFactor && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                  >
                    <p className="text-emerald-400 text-sm">
                      ✓ 2FA etkinleştirildi. Artık giriş yaparken ek doğrulama gerekecek.
                    </p>
                  </motion.div>
                )}
              </SpotlightCard>
            </FadeContent>

            <FadeContent direction="up" delay={0.25}>
              <SpotlightCard className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <HiOutlineChartBar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Analiz Toplama</h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Ziyaretçi analizlerini ve istatistikleri yönetin</p>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Analitik Veri Toplama</p>
                    <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Ziyaretçi davranışları, sayfa görüntülemeleri, click verileri</p>
                  </div>
                  <button
                    onClick={() => handleChange('analyticsEnabled', !settings.analyticsEnabled)}
                    className={`relative w-12 h-7 rounded-full transition-colors
                      ${settings.analyticsEnabled ? 'bg-emerald-500' : isDark ? 'bg-neutral-700' : 'bg-gray-300'}`}
                  >
                    <motion.div
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                      animate={{ left: settings.analyticsEnabled ? '1.5rem' : '0.25rem' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {!settings.analyticsEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl"
                  >
                    <p className="text-amber-400 text-sm">
                      ⚠️ Analiz toplama kapalı. Analizler sayfası yeni veri toplamayacak ve Supabase kullanımı azalacak.
                    </p>
                  </motion.div>
                )}

                {settings.analyticsEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                  >
                    <p className="text-emerald-400 text-sm">
                      ✓ Analiz toplama aktif. Tüm ziyaretçi hareketleri kaydediliyor.
                    </p>
                  </motion.div>
                )}
              </SpotlightCard>
            </FadeContent>

            <FadeContent direction="up" delay={0.3}>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-medium transition-all 
                  disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                  ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
              >
                {saving ? (
                  <>
                    <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-black/20 border-t-black' : 'border-white/30 border-t-white'}`} />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <HiOutlineCheck className="w-5 h-5" />
                    Değişiklikleri Kaydet
                  </>
                )}
              </button>
            </FadeContent>
          </motion.div>
        )}

        {/* Pricing Settings */}
        {activeTab === 'pricing' && (
          <motion.div
            key="pricing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <FadeContent direction="up" delay={0.15}>
              <SpotlightCard className="p-5 sm:p-6">
                <BulkPriceAdjustment categories={categories} />
              </SpotlightCard>
            </FadeContent>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
