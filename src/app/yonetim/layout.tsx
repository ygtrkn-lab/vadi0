'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
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
  HiOutlineUsers
} from 'react-icons/hi';
import { GradientText, ShinyText, Squares } from '@/components/ui-kit';
import { ThemeProvider, useTheme, useThemeColors } from './ThemeContext';

interface User {
  email: string;
  name: string;
  role: string;
  loginTime: number;
}

const ADMIN_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const menuItems = [
  { href: '/yonetim', label: 'Dashboard', icon: HiOutlineViewGrid },
  { href: '/yonetim/urunler', label: 'Ürünler', icon: HiOutlineCube },
  { href: '/yonetim/kategoriler', label: 'Kategoriler', icon: HiOutlineTag },
  { href: '/yonetim/siparisler', label: 'Siparişler', icon: HiOutlineClipboardList, badge: 3 },
  { href: '/yonetim/musteriler', label: 'Müşteriler', icon: HiOutlineUsers },
  { href: '/yonetim/ayarlar', label: 'Ayarlar', icon: HiOutlineCog },
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme, isDark } = useTheme();
  const colors = useThemeColors();

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
        {/* Squares Background */}
        <div className="absolute inset-0 pointer-events-none">
          <Squares
            direction="diagonal"
            speed={0.3}
            squareSize={50}
            borderColor={isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.1)'}
            hoverFillColor={isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.15)'}
            vignetteColor={isDark ? 'rgba(10, 10, 10, 0.85)' : 'transparent'}
            backgroundColor={isDark ? 'transparent' : '#ffffff'}
            className="w-full h-full"
          />
        </div>
        
        <div className="flex flex-col items-center gap-6 relative z-10">
          <GradientText 
            colors={['#a855f7', '#ec4899', '#a855f7']} 
            animationSpeed={3}
            className="font-bold text-3xl"
          >
            Vadiler
          </GradientText>
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
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Squares Background from UI-Kit */}
        <Squares
          direction="diagonal"
          speed={0.3}
          squareSize={50}
          borderColor={isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.1)'}
          hoverFillColor={isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.15)'}
          vignetteColor={isDark ? 'rgba(10, 10, 10, 0.85)' : 'transparent'}
          backgroundColor={isDark ? 'transparent' : '#ffffff'}
          className="w-full h-full"
        />
      </div>
      
      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
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
            className={`fixed top-0 left-0 z-50 h-full w-[280px] border-r flex flex-col will-change-transform backdrop-blur-xl ${
              isDark ? 'bg-neutral-950/90 border-neutral-800/50' : 'bg-white/90 border-gray-200'
            }`}
          >
            {/* Logo */}
            <div className={`h-16 flex items-center justify-between px-5 border-b ${isDark ? 'border-neutral-800/50' : 'border-gray-200'}`}>
              <Link href="/yonetim" className="flex items-center gap-3 group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
                  isDark ? 'bg-white' : 'bg-purple-600'
                }`}>
                  <span className={`font-bold ${isDark ? 'text-black' : 'text-white'}`}>V</span>
                </div>
                <div className="flex flex-col">
                  <GradientText 
                    colors={['#a855f7', '#ec4899', '#a855f7']} 
                    animationSpeed={5}
                    className="font-semibold text-sm"
                  >
                    Vadiler
                  </GradientText>
                  <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Admin Panel
                  </span>
                </div>
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
            <nav className="flex-1 p-3 overflow-y-auto">
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
            <div className={`p-3 border-t ${isDark ? 'border-neutral-800/50' : 'border-gray-200'}`}>
              <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer group ${
                isDark ? 'bg-neutral-900/50 hover:bg-neutral-900' : 'bg-gray-50 hover:bg-gray-100'
              }`}>
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
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
        <header className={`sticky top-0 z-30 h-16 backdrop-blur-xl border-b flex items-center justify-between px-4 lg:px-6 ${
          isDark ? 'bg-neutral-950/80 border-neutral-800/50' : 'bg-white/80 border-gray-200'
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
            <button className={`relative p-2.5 rounded-xl transition-colors ${
              isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}>
              <HiOutlineBell className="w-5 h-5" />
              <span className={`absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ${isDark ? 'ring-black' : 'ring-white'}`} />
            </button>

            {/* Mobile User Avatar */}
            {isMobile && (
              <button 
                onClick={() => setSidebarOpen(true)}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
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
