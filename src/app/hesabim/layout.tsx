'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCustomer } from '@/context/CustomerContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  HiOutlineHome,
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiOutlineLocationMarker,
  HiOutlineLogout,
  HiOutlineCog,
} from 'react-icons/hi';
import { FadeIn } from '@/components/ui-kit/premium';

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

  // Check if current menu item is active
  const isActive = (item: typeof menuItems[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Ana Site Header */}
      <Header hideCategories />

      {/* Main Content Area */}
      <div className="flex-1 pt-4 pb-20 lg:pb-8">
        <div className="container-custom">
          {/* Breadcrumb */}
          <nav className="mb-4 lg:mb-6">
            <ol className="flex items-center gap-2 text-sm text-gray-500">
              <li>
                <Link href="/" className="hover:text-primary-600 transition-colors">
                  Anasayfa
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900 font-medium">{currentPage}</li>
            </ol>
          </nav>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <FadeIn>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-24">
                  {/* User Info */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl 
                        flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
                        <p className="text-sm text-gray-500 truncate">{customer.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <nav className="p-3">
                    <div className="space-y-1">
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
                                  ? 'bg-primary-500 text-white shadow-md' 
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
                    </div>

                    {/* Logout */}
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <motion.button
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                          text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
                      >
                        <HiOutlineLogout className="w-5 h-5" />
                        <span className="font-medium">Çıkış Yap</span>
                      </motion.button>
                    </div>
                  </nav>
                </div>
              </FadeIn>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl 
        border-t border-gray-200 pb-safe shadow-lg">
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
                    ${active ? 'bg-primary-100' : ''}`}
                  >
                    <Icon className={`w-6 h-6 transition-colors duration-200
                      ${active ? 'text-primary-600' : 'text-gray-400'}`} 
                    />
                  </div>
                  <span className={`text-[10px] font-medium mt-0.5 transition-colors duration-200
                    ${active ? 'text-primary-600' : 'text-gray-400'}`}
                  >
                    {item.label.split(' ')[0]}
                  </span>
                </motion.div>
              </Link>
            );
          })}
          
          {/* Logout Button */}
          <button onClick={handleLogout} className="flex-1">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center py-1"
            >
              <div className="p-2 rounded-xl">
                <HiOutlineLogout className="w-6 h-6 text-gray-400" />
              </div>
              <span className="text-[10px] font-medium mt-0.5 text-gray-400">
                Çıkış
              </span>
            </motion.div>
          </button>
        </div>
      </nav>

      {/* Footer - Desktop Only */}
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}
