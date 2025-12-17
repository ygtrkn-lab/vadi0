'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCustomer } from '@/context/CustomerContext';
import {
  HiOutlineHome,
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiOutlineLocationMarker,
  HiOutlineArrowLeft,
  HiOutlineLogout,
  HiOutlineChevronLeft,
  HiOutlineMenu,
  HiOutlinePhone,
  HiOutlineSparkles,
  HiOutlineCog,
} from 'react-icons/hi';
import { FadeIn, BottomSheet } from '@/components/ui-kit/premium';

// Menu items with icons
const menuItems = [
  {
    href: '/hesabim',
    label: 'Hesabım',
    icon: HiOutlineHome,
    exact: true,
  },
  {
    href: '/hesabim/siparislerim',
    label: 'Siparişlerim',
    icon: HiOutlineShoppingBag,
    exact: false,
  },
  {
    href: '/hesabim/favorilerim',
    label: 'Favorilerim',
    icon: HiOutlineHeart,
    exact: false,
  },
  {
    href: '/hesabim/adreslerim',
    label: 'Adreslerim',
    icon: HiOutlineLocationMarker,
    exact: false,
  },
  {
    href: '/hesabim/ayarlar',
    label: 'Ayarlar',
    icon: HiOutlineCog,
    exact: false,
  },
  {
    href: '/',
    label: 'Anasayfa',
    icon: HiOutlineArrowLeft,
    exact: true,
  },
];

// Page titles
const pageTitles: { [key: string]: string } = {
  '/hesabim': 'Hesap Özeti',
  '/hesabim/siparislerim': 'Siparişlerim',
  '/hesabim/favorilerim': 'Favorilerim',
  '/hesabim/adreslerim': 'Adreslerim',
  '/hesabim/ayarlar': 'Ayarlar',
};

export default function HesabimLayout({ children }: { children: React.ReactNode }) {
  const { state, logout } = useCustomer();
  const pathname = usePathname();
  const router = useRouter();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    // Avoid redirecting during the brief hydration window on hard refresh.
    if (!state.isReady) return;
    if (!state.isAuthenticated) {
      const redirectTo = pathname && pathname.startsWith('/hesabim') ? pathname : '/hesabim';
      router.replace(`/giris?redirect=${encodeURIComponent(redirectTo)}`);
    }
  }, [state.isReady, state.isAuthenticated, router, pathname]);

  if (!state.isReady || !state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-[#e05a4c] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const customer = state.currentCustomer;
  if (!customer) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const currentPage = pageTitles[pathname] || 'Hesabım';
  const isHomePage = pathname === '/hesabim';

  // Check if current menu item is active
  const isActive = (item: typeof menuItems[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - App Style */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Back Button or Menu */}
          {!isHomePage ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/hesabim')}
              className="flex items-center gap-1 text-gray-600"
            >
              <HiOutlineChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Geri</span>
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMobileMenu(true)}
              className="p-2 -ml-2"
            >
              <HiOutlineMenu className="w-6 h-6 text-gray-700" />
            </motion.button>
          )}

          {/* Page Title */}
          <h1 className="text-base font-semibold text-gray-900">{currentPage}</h1>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Favorites Button */}
            <Link href="/hesabim/favorilerim">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 relative"
              >
                <HiOutlineHeart className="w-6 h-6 text-gray-700" />
                {customer.favorites && customer.favorites.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-black rounded-full 
                    flex items-center justify-center text-white text-[10px] font-bold">
                    {customer.favorites.length}
                  </span>
                )}
              </motion.button>
            </Link>

            {/* Profile Avatar */}
            <Link href="/hesabim">
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="w-8 h-8 bg-black rounded-full 
                  flex items-center justify-center text-white text-sm font-bold"
              >
                {customer.name.charAt(0).toUpperCase()}
              </motion.div>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu Bottom Sheet */}
      <BottomSheet
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        title="Menü"
      >
        <div className="px-6 py-4 pb-8">
          {/* User Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl mb-4 border-2 border-gray-200">
            <div className="w-14 h-14 bg-black rounded-2xl 
              flex items-center justify-center text-white text-xl font-bold">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{customer.name}</p>
              <p className="text-sm text-gray-500">{customer.email}</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-1">
            {menuItems.map((item, index) => {
              const active = isActive(item);

              return (
                <Link key={item.href} href={item.href} onClick={() => setShowMobileMenu(false)}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all
                      ${active 
                        ? 'bg-black text-white shadow-lg' 
                        : 'hover:bg-gray-50'
                      }`}
                  >
                    <item.icon className={`w-6 h-6 ${active ? 'text-white' : 'text-gray-600'}`} />
                    <span className={`font-medium flex-1 ${active ? 'text-white' : 'text-gray-700'}`}>
                      {item.label}
                    </span>
                    {active && (
                      <motion.div
                        layoutId="active-indicator"
                        className="w-2 h-2 bg-white rounded-full"
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Logout Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 mt-4 rounded-2xl text-black 
              hover:bg-gray-100 transition-colors"
          >
            <HiOutlineLogout className="w-6 h-6" />
            <span className="font-medium">Çıkış Yap</span>
          </motion.button>

          {/* Help Card */}
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border-2 border-gray-200">
            <p className="text-sm text-gray-700 mb-2 flex items-center gap-2">
              <HiOutlineSparkles className="w-4 h-4 text-gray-900" />
              <span>Yardım için: <a href="tel:08503074876" className="font-semibold text-gray-900 hover:underline">0850 307 4876</a></span>
            </p>
          </div>
        </div>
      </BottomSheet>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="w-72 flex-shrink-0 p-6 border-r border-gray-200 bg-white">
          <FadeIn>
            {/* Logo & User */}
            <div className="mb-8">
              <Link href="/" className="block mb-6">
                <img src="/logo.png" alt="Vadiler" className="h-8 w-auto" />
              </Link>
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border-2 border-gray-200">
                <div className="w-12 h-12 bg-black rounded-xl 
                  flex items-center justify-center text-white text-lg font-bold">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
                  <p className="text-sm text-gray-500 truncate">{customer.email}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);

                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                        ${active 
                          ? 'bg-black text-white' 
                          : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} />
                      <span className="font-medium flex-1">{item.label}</span>
                      {active && (
                        <motion.div
                          layoutId="desktop-indicator"
                          className="w-1.5 h-1.5 bg-white rounded-full"
                        />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 mt-4 rounded-xl
                text-gray-600 hover:bg-gray-100 hover:text-black transition-all"
            >
              <HiOutlineLogout className="w-5 h-5" />
              <span className="font-medium">Çıkış Yap</span>
            </motion.button>

            {/* Help Card */}
            <div className="mt-8 p-4 bg-gray-50 rounded-2xl border-2 border-gray-200">
              <HiOutlineSparkles className="w-8 h-8 text-gray-900 mb-2" />
              <p className="font-medium text-gray-900 mb-1">Yardım mı lazım?</p>
              <p className="text-sm text-gray-600 mb-2">7/24 destek hattı</p>
              <a href="tel:08503074876" className="text-sm font-semibold text-gray-900 hover:underline flex items-center gap-1">
                <HiOutlinePhone className="w-4 h-4" />
                <span>0850 307 4876</span>
              </a>
            </div>
          </FadeIn>
        </aside>

        {/* Desktop Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-5xl mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Content */}
      <main className="lg:hidden pt-14 pb-20 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation - App Style */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl 
        border-t border-gray-100 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-col items-center py-1"
                >
                  <div className={`relative p-2 rounded-xl transition-all duration-200
                    ${active ? 'bg-black/10' : ''}`}
                  >
                    <Icon className={`w-6 h-6 transition-colors duration-200
                      ${active ? 'text-black' : 'text-gray-400'}`} 
                    />
                    {active && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 
                          bg-black rounded-full"
                      />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium mt-0.5 transition-colors duration-200
                    ${active ? 'text-black' : 'text-gray-400'}`}
                  >
                    {item.label.split(' ')[0]}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
