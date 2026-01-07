'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineViewGrid, 
  HiOutlineCube, 
  HiOutlineTag, 
  HiOutlineClipboardList, 
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineExternalLink,
  HiOutlineBell,
  HiOutlineSearch,
  HiOutlineChevronDown,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineUsers,
  HiOutlineChartBar
} from 'react-icons/hi';
import { ShinyText } from '@/components/ui-kit';
import DarkVeil from '@/components/DarkVeil';
import SplashCursor from '@/components/SplashCursor';
import { ThemeProvider, useTheme, useThemeColors } from './ThemeContext';
import { useOrder } from '@/context/OrderContext';

interface User {
  email: string;
  name: string;
  role: string;
  loginTime: number;
}

const ADMIN_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme, isDark } = useTheme();
  const colors = useThemeColors();
  const { orderState } = useOrder();

  // Dinamik sipariş sayısı - bekleyen siparişler (havale dahil)
  const pendingOrdersCount = useMemo(() => {
    if (!orderState?.orders) {
      console.log('📦 Bildirimler: orderState.orders yok');
      return 0;
    }
    const pending = orderState.orders.filter(o => 
      o.status === 'pending' || 
      o.status === 'pending_payment' ||
      o.status === 'awaiting_payment' ||
      o.status === 'confirmed' || 
      o.status === 'processing'
    );
    console.log('📦 Bildirimler:', {
      toplamSiparis: orderState.orders.length,
      bekleyenSiparis: pending.length,
      statüler: orderState.orders.map(o => `${o.orderNumber}:${o.status}`)
    });
    return pending.length;
  }, [orderState?.orders]);

  // Yeni sipariş bildirimi - ses çal
  useEffect(() => {
    if (isChecking || !isAuthenticated || !orderState?.orders) {
      console.log('🔔 Ses bildirimi: Auth check veya orders bekleniyor', { isChecking, isAuthenticated, ordersLength: orderState?.orders?.length });
      return;
    }

    const currentOrderCount = orderState.orders.length;
    
    // İlk yüklemede ses çalma, sadece sayıyı kaydet
    if (previousOrderCount === 0) {
      console.log('🔔 İlk yükleme, sipariş sayısı kaydedildi:', currentOrderCount);
      setPreviousOrderCount(currentOrderCount);
      return;
    }
    
    // Yeni sipariş geldiğinde ses çal
    if (currentOrderCount > previousOrderCount) {
      console.log('🔔 YENİ SİPARİŞ! Ses çalınıyor...', { önceki: previousOrderCount, şimdi: currentOrderCount });
      const soundUrl = process.env.NEXT_PUBLIC_NOTIFICATION_SOUND_URL || '/siparis-bildirim.wav';
      const audio = new Audio(soundUrl);
      audio.play()
        .then(() => console.log('✅ Ses başarıyla çaldı'))
        .catch(err => console.error('❌ Bildirim sesi çalınamadı:', err));
      setPreviousOrderCount(currentOrderCount);
    } else if (currentOrderCount !== previousOrderCount) {
      console.log('🔔 Sipariş sayısı değişti:', { önceki: previousOrderCount, şimdi: currentOrderCount });
      // Sipariş sayısı değiştiyse sayıyı güncelle
      setPreviousOrderCount(currentOrderCount);
    }
  }, [orderState?.orders?.length, previousOrderCount, isAuthenticated, isChecking]);

  // Menu items with dynamic badge (havale siparişleri dahil)
  const menuItems = useMemo(() => [
    { href: '/yonetim', label: 'Dashboard', icon: HiOutlineViewGrid },
    { href: '/yonetim/urunler', label: 'Ürünler', icon: HiOutlineCube },
    { href: '/yonetim/kategoriler', label: 'Kategoriler', icon: HiOutlineTag },
    { href: '/yonetim/siparisler', label: 'Siparişler', icon: HiOutlineClipboardList, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined },
    { href: '/yonetim/musteriler', label: 'Müşteriler', icon: HiOutlineUsers },
    { href: '/yonetim/analizler', label: 'Analizler', icon: HiOutlineChartBar },
    { href: '/yonetim/ayarlar', label: 'Ayarlar', icon: HiOutlineCog },
  ], [pendingOrdersCount]);

  const checkAuth = useCallback(() => {
    const goLogin = () => router.replace('/giris?redirect=/yonetim');

    // Primary admin session (shared with /giris): vadiler_user
    const userData = localStorage.getItem('vadiler_user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData) as User;
        const sessionAge = Date.now() - (parsedUser.loginTime || 0);
        if (parsedUser.role === 'admin' && sessionAge < ADMIN_SESSION_DURATION) {
          setUser(parsedUser);
          setIsAuthenticated(true);
          setIsChecking(false);
          return;
        }
        // Not admin or expired
        localStorage.removeItem('vadiler_user');
      } catch {
        localStorage.removeItem('vadiler_user');
      }
    }

    // Legacy admin session (used by older admin auth context)
    const legacyAuth = localStorage.getItem('vadiler_admin_auth');
    const legacyLoginTime = localStorage.getItem('vadiler_admin_login_time');
    if (legacyAuth === 'true' && legacyLoginTime) {
      const elapsed = Date.now() - parseInt(legacyLoginTime);
      if (elapsed < ADMIN_SESSION_DURATION) {
        setUser({ email: 'bilgi@vadiler.com', name: 'Admin', role: 'admin', loginTime: parseInt(legacyLoginTime) });
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }
      localStorage.removeItem('vadiler_admin_auth');
      localStorage.removeItem('vadiler_admin_login_time');
    }

    setIsAuthenticated(false);
    setUser(null);
    setIsChecking(false);
    goLogin();
  }, [router]);

  useEffect(() => {
    checkAuth();

    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        if (isMobile) setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [checkAuth, isMobile]);

  const handleLogout = () => {
    localStorage.removeItem('vadiler_user');
    router.push('/giris');
  };

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile]);

  if (isChecking) {
    return (
      <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
        {/* DarkVeil Background */}
        <div className="absolute inset-0 pointer-events-none">
          <DarkVeil
            hueShift={0}
            noiseIntensity={0}
            scanlineIntensity={0}
            speed={0.5}
            scanlineFrequency={0}
            warpAmount={0}
            resolutionScale={1}
          />
        </div>
        
        <div className="flex flex-col items-center gap-6 relative z-10">
          <Image
            src="/logo.png"
            alt="Vadiler"
            width={150}
            height={50}
            className={`object-contain ${isDark ? 'brightness-0 invert' : ''}`}
            priority
          />
          <div className="relative w-12 h-12">
            <div className={`absolute inset-0 border-2 rounded-full ${isDark ? 'border-neutral-800' : 'border-gray-300'}`} />
            <div className="absolute inset-0 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <ShinyText text="Panel yükleniyor..." speed={3} className={`text-sm ${isDark ? '' : 'text-gray-500'}`} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-neutral-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* DarkVeil Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.5}
          scanlineFrequency={0}
          warpAmount={0}
          resolutionScale={1}
        />
      </div>
      
      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh] px-4"
            onClick={() => setSearchOpen(false)}
          >
            <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/80' : 'bg-white/80'}`} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className={`relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden ${
                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
              }`}
            >
              <div className={`flex items-center gap-3 p-4 border-b ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                <HiOutlineSearch className={`w-5 h-5 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Ürün, kategori veya sipariş ara..."
                  autoFocus
                  className={`flex-1 bg-transparent outline-none ${isDark ? 'text-white placeholder-neutral-500' : 'text-gray-900 placeholder-gray-400'}`}
                />
                <kbd className={`px-2 py-1 text-xs rounded ${isDark ? 'text-neutral-500 bg-neutral-800' : 'text-gray-500 bg-gray-100'}`}>ESC</kbd>
              </div>
              <div className="p-2 max-h-[50vh] overflow-y-auto">
                <p className={`px-3 py-6 text-center text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                  Aramak için yazmaya başlayın...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className={`fixed inset-0 backdrop-blur-sm z-40 lg:hidden ${isDark ? 'bg-black/60' : 'bg-black/30'}`}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {(sidebarOpen || !isMobile) && (
          <motion.aside
            initial={isMobile ? { x: -300 } : false}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed top-0 left-0 z-50 h-full w-[280px] border-r flex flex-col will-change-transform overflow-hidden ${
              isDark ? 'bg-transparent border-neutral-800/30' : 'bg-white/60 backdrop-blur-md border-gray-200/50'
            }`}
          >
            {/* SplashCursor Effect - Sidebar Only */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <SplashCursor
                SIM_RESOLUTION={128}
                DYE_RESOLUTION={1440}
                DENSITY_DISSIPATION={3.5}
                VELOCITY_DISSIPATION={2}
                PRESSURE={0.1}
                CURL={3}
                SPLAT_RADIUS={0.2}
                SPLAT_FORCE={6000}
                COLOR_UPDATE_SPEED={10}
              />
            </div>

            {/* Logo */}
            <div className={`relative z-10 h-16 flex items-center justify-between px-5 border-b ${isDark ? 'border-neutral-800/30' : 'border-gray-200/50'}`}>
              <Link href="/yonetim" className="flex items-center gap-3 group">
                <Image
                  src="/logo.png"
                  alt="Vadiler"
                  width={120}
                  height={40}
                  className={`object-contain transition-transform group-hover:scale-105 ${isDark ? 'brightness-0 invert' : ''}`}
                  priority
                />
              </Link>
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'}`}
                >
                  <HiOutlineX className={`w-5 h-5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`} />
                </button>
              )}
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex-1 p-3 overflow-y-auto">
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/yonetim' && pathname?.startsWith(item.href));
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive 
                          ? isDark ? 'bg-white text-black' : 'bg-purple-600 text-white'
                          : isDark ? 'text-neutral-400 hover:bg-neutral-900 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${
                        isActive 
                          ? isDark ? 'text-black' : 'text-white'
                          : isDark ? 'text-neutral-500 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-700'
                      }`} />
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                          isActive 
                            ? isDark ? 'bg-black/10 text-black' : 'bg-white/20 text-white'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* User Section */}
            <div className={`relative z-10 p-3 border-t ${isDark ? 'border-neutral-800/50' : 'border-gray-200'}`}>
              <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer group ${
                isDark ? 'bg-neutral-900/50 hover:bg-neutral-900' : 'bg-gray-50 hover:bg-gray-100'
              }`}>
                <div className="relative w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-pink-500 
                  flex items-center justify-center ring-2 transition-all ${
                    isDark ? 'ring-neutral-800 group-hover:ring-neutral-700' : 'ring-gray-200 group-hover:ring-gray-300'
                  }">
                  <span className="text-white font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                  <span className={`absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ${
                    isDark ? 'ring-neutral-950' : 'ring-white'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {user?.name || 'Admin'}
                  </p>
                  <p className={`text-xs truncate ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    {user?.email || 'admin@vadiler.com'}
                  </p>
                </div>
                <HiOutlineChevronDown className={`w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
              </div>
              
              <button
                onClick={handleLogout}
                className={`mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 
                  rounded-xl transition-all text-sm font-medium ${
                    isDark 
                      ? 'text-neutral-400 hover:text-red-400 hover:bg-red-500/10' 
                      : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                  }`}
              >
                <HiOutlineLogout className="w-4 h-4" />
                Çıkış Yap
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${!isMobile ? 'lg:pl-[280px]' : ''}`}>
        {/* Top Header */}
        <header className={`sticky top-0 z-30 h-16 border-b flex items-center justify-between px-4 lg:px-6 ${
          isDark ? 'bg-transparent border-neutral-800/30' : 'bg-white/60 backdrop-blur-md border-gray-200/50'
        }`}>
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className={`p-2.5 rounded-xl transition-colors ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'}`}
              >
                <HiOutlineMenu className={`w-5 h-5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`} />
              </button>
            )}
            
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-all group ${
                isDark 
                  ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800' 
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
            >
              <HiOutlineSearch className={`w-4 h-4 ${isDark ? 'text-neutral-500 group-hover:text-neutral-400' : 'text-gray-400 group-hover:text-gray-500'}`} />
              <span className={`text-sm hidden sm:inline ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Ara...</span>
              <kbd className={`hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded ml-2 ${
                isDark ? 'text-neutral-500 bg-neutral-800' : 'text-gray-500 bg-gray-100'
              }`}>
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-colors ${
                isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
              title={isDark ? 'Açık tema' : 'Koyu tema'}
            >
              {isDark ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
            </button>
            
            {/* View Site */}
            <Link
              href="/"
              target="_blank"
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-all ${
                isDark 
                  ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <HiOutlineExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Siteyi Gör</span>
            </Link>
            
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`relative p-2.5 rounded-xl transition-colors ${
                  isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <HiOutlineBell className="w-5 h-5" />
                {pendingOrdersCount > 0 && (
                  <span className={`absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ${isDark ? 'ring-black' : 'ring-white'} animate-pulse`} />
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setNotificationsOpen(false)}
                      className="fixed inset-0 z-[90]"
                      style={{ background: 'transparent' }}
                    />
                    
                    {/* Dropdown Panel */}
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                      className={`absolute right-0 top-full mt-2 w-80 rounded-2xl border backdrop-blur-xl shadow-2xl z-[100] overflow-hidden ${
                        isDark ? 'bg-neutral-900/95 border-white/10' : 'bg-white/95 border-gray-200 shadow-[0_16px_48px_rgba(0,0,0,0.15)]'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className={`px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                        <div className="flex items-center justify-between">
                          <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Bildirimler
                          </h3>
                          {pendingOrdersCount > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                            }`}>
                              {pendingOrdersCount} yeni
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Notifications List */}
                      <div className="max-h-[400px] overflow-y-auto">
                        {pendingOrdersCount > 0 && orderState?.orders ? (
                          <>
                            {orderState.orders
                              .filter(o => 
                                o.status === 'pending' || 
                                o.status === 'pending_payment' ||
                                o.status === 'awaiting_payment' ||
                                o.status === 'confirmed' || 
                                o.status === 'processing'
                              )
                              .slice(0, 10)
                              .map((order) => (
                                <Link
                                  key={order.id}
                                  href="/yonetim/siparisler"
                                  onClick={() => setNotificationsOpen(false)}
                                  className={`block px-4 py-3 border-b transition-colors ${
                                    isDark 
                                      ? 'border-white/5 hover:bg-white/5' 
                                      : 'border-gray-100 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                                      order.status === 'pending' ? 'bg-amber-500' :
                                      order.status === 'pending_payment' ? 'bg-orange-500' :
                                      order.status === 'awaiting_payment' ? 'bg-yellow-500' :
                                      order.status === 'confirmed' ? 'bg-blue-500' :
                                      'bg-purple-500'
                                    }`} />
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium mb-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        Yeni Sipariş #{order.orderNumber}
                                      </p>
                                      <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                                        {order.customerName || 'Misafir'} • {order.total.toFixed(2)} ₺
                                      </p>
                                      <p className={`text-[10px] mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                                        {new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </div>
                                </Link>
                              ))}
                          </>
                        ) : (
                          <div className="px-4 py-8 text-center">
                            <HiOutlineBell className={`w-12 h-12 mx-auto mb-3 ${
                              isDark ? 'text-neutral-700' : 'text-gray-300'
                            }`} />
                            <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                              Yeni bildirim yok
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      {pendingOrdersCount > 0 && (
                        <div className={`px-4 py-2 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                          <Link
                            href="/yonetim/siparisler"
                            onClick={() => setNotificationsOpen(false)}
                            className={`block text-center text-xs font-medium py-1 ${
                              isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                            }`}
                          >
                            Tüm Siparişleri Gör
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile User Avatar */}
            {isMobile && (
              <button 
                onClick={() => setSidebarOpen(true)}
                className="w-9 h-9 rounded-full bg-linear-to-br from-purple-500 to-pink-500 
                  flex items-center justify-center ring-2 ring-neutral-800"
              >
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 relative z-10">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className={`hidden lg:block px-4 lg:px-6 py-4 border-t ${isDark ? 'border-neutral-800/50' : 'border-gray-200'}`}>
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-2 text-xs ${isDark ? 'text-neutral-600' : 'text-gray-500'}`}>
            <span>© 2025 Vadiler. Tüm hakları saklıdır.</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Sistem aktif
              </span>
              <span>•</span>
              <span>v2.0.0</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t px-2 py-2 pb-safe ${
          isDark ? 'bg-neutral-950/95 border-neutral-800/50' : 'bg-white/95 border-gray-200'
        }`}>
          <div className="flex items-center justify-around">
            {menuItems.slice(0, 5).map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/yonetim' && pathname?.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                    isActive 
                      ? isDark ? 'text-white' : 'text-purple-600'
                      : isDark ? 'text-neutral-500' : 'text-gray-400'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-all ${
                    isActive 
                      ? isDark ? 'bg-white/10' : 'bg-purple-100'
                      : ''
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center 
                      text-[9px] font-bold bg-red-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export default function YonetimLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </ThemeProvider>
  );
}
