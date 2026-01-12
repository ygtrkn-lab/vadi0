'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  User, 
  Menu, 
  X, 
  Phone, 
  ChevronDown,
  Truck,
  CreditCard,
  BadgeCheck,
  ShieldCheck
} from 'lucide-react';
import { usePreloader } from '@/app/ClientRoot';
import { useCart } from '@/context/CartContext';
import { useCustomer } from '@/context/CustomerContext';
import { useSetting } from '@/hooks/useSettings';
import SearchBar from './SearchBar';
import CategoryAvatar from './ui/CategoryAvatar';
import MobileCategoryMenu from './MobileCategoryMenu';

interface Category {
  id: number;
  name: string;
  slug: string;
  productCount: number;
  image?: string;
}

interface HeaderProps {
  hideCategories?: boolean;
}

export default function Header({ hideCategories = false }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isHidden, setIsHidden] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const topBandRef = useRef<HTMLDivElement | null>(null);
  
  // Get cart state
  const { getTotalItems } = useCart();
  const cartCount = getTotalItems();
  
  // Get customer favorites count
  const { state: customerState } = useCustomer();
  const wishlistCount = customerState.currentCustomer?.favorites?.length || 0;
  
  // Set hydration flag
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  // Get preloader state and logo ref
  const { showHeaderLogo, isPreloaderComplete, logoRef, registerLogoPosition } = usePreloader();

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        // Keep only categories that have products and valid slugs to avoid 404s
        const incoming = data.categories || data.data || [];
        const filtered = incoming.filter(
          (cat: Category) => cat?.slug && cat?.name && (cat.productCount || 0) > 0
        );
        setCategories(filtered);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for hide/show header events from product detail page
  useEffect(() => {
    const handleHideHeader = () => setIsHidden(true);
    const handleShowHeader = () => setIsHidden(false);
    
    window.addEventListener('hideHeader', handleHideHeader);
    window.addEventListener('showHeader', handleShowHeader);
    
    return () => {
      window.removeEventListener('hideHeader', handleHideHeader);
      window.removeEventListener('showHeader', handleShowHeader);
    };
  }, []);

  // Register logo position when component mounts
  useLayoutEffect(() => {
    registerLogoPosition();
  }, [registerLogoPosition]);

  // Expose top info band height as a CSS variable so other fixed bars can offset correctly.
  useEffect(() => {
    const el = topBandRef.current;
    if (!el) return;

    const setVar = () => {
      const height = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--top-info-band-height', `${Math.round(height)}px`);
    };

    setVar();

    const ro = new ResizeObserver(() => setVar());
    ro.observe(el);
    window.addEventListener('resize', setVar);
    window.addEventListener('orientationchange', setVar);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', setVar);
      window.removeEventListener('orientationchange', setVar);
    };
  }, []);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[20000]" style={{ pointerEvents: 'auto' }}>
        {/* ═══════════════════════════════════════════════════════════════════
            MOBILE HEADER - Ultra Modern Apple/Dribbble/Shopify/Amazon Style
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="lg:hidden">
          {/* Top Info Bar - Same as Desktop */}
          <AnimatePresence>
            {!isScrolled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between gap-3 py-2 px-4">
                  <div className="flex-1 min-w-0">
                    <div className="topbar-marquee">
                      <div className="topbar-marquee-track gap-2">
                        <div className="flex items-center gap-2 pr-3">
                          <div className="flex items-center gap-2 shrink-0 rounded-full border border-white/15 bg-primary-500 px-3 py-1">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 border border-white/15">
                              <Truck size={14} className="text-white" />
                            </span>
                            <span className="text-xs font-semibold whitespace-nowrap text-white">İstanbul içi ücretsiz kargo</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 rounded-full border border-white/15 bg-primary-500 px-3 py-1">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 border border-white/15">
                              <CreditCard size={14} className="text-white" />
                            </span>
                            <span className="text-xs font-semibold whitespace-nowrap text-white">iyzico ile güvenli ödeme</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 rounded-full border border-white/15 bg-secondary-500 px-3 py-1">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 border border-white/15">
                              <BadgeCheck size={14} className="text-white" />
                            </span>
                            <span className="text-xs font-semibold whitespace-nowrap text-white">Memnuniyet garantisi</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pr-3" aria-hidden="true">
                          <div className="flex items-center gap-2 shrink-0 rounded-full border border-white/15 bg-primary-500 px-3 py-1">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 border border-white/15">
                              <Truck size={14} className="text-white" />
                            </span>
                            <span className="text-xs font-semibold whitespace-nowrap text-white">İstanbul içi ücretsiz kargo</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 rounded-full border border-white/15 bg-primary-500 px-3 py-1">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 border border-white/15">
                              <CreditCard size={14} className="text-white" />
                            </span>
                            <span className="text-xs font-semibold whitespace-nowrap text-white">iyzico ile güvenli ödeme</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 rounded-full border border-white/15 bg-secondary-500 px-3 py-1">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 border border-white/15">
                              <BadgeCheck size={14} className="text-white" />
                            </span>
                            <span className="text-xs font-semibold whitespace-nowrap text-white">Memnuniyet garantisi</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Mobile Header - Premium Glass Card */}
          <motion.div
            initial={false}
            animate={{
              y: isHidden ? -100 : 0,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative"
            style={{
              background: isScrolled 
                ? 'rgba(255, 255, 255, 0.72)' 
                : 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'saturate(180%) blur(20px)',
              WebkitBackdropFilter: 'saturate(180%) blur(20px)',
              borderBottom: isScrolled 
                ? '0.5px solid rgba(0, 0, 0, 0.08)' 
                : '0.5px solid rgba(0, 0, 0, 0.04)',
            }}
          >
            <div className="flex items-center justify-between px-4 h-[56px]">
              {/* Left - Hamburger with Micro-interaction */}
              <motion.button
                onClick={() => {
                  window.dispatchEvent(new Event('closeAllOverlays'));
                  window.dispatchEvent(new CustomEvent('openMobileCategoryMenu'));
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                className="relative w-11 h-11 flex items-center justify-center rounded-2xl 
                  transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 100%)',
                }}
                aria-label="Menü"
              >
                <div className="flex flex-col items-center justify-center gap-[5px]">
                  <motion.span 
                    className="w-[18px] h-[2px] rounded-full bg-gray-800"
                    style={{ originX: 0 }}
                  />
                  <motion.span 
                    className="w-[14px] h-[2px] rounded-full bg-gray-600"
                    style={{ originX: 0 }}
                  />
                </div>
              </motion.button>

              {/* Center - Logo with Premium Animation */}
              <Link href="/" className="absolute left-1/2 -translate-x-1/2 z-10">
                <motion.div
                  ref={logoRef as React.RefObject<HTMLDivElement>}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ 
                    opacity: showHeaderLogo ? 1 : 0,
                    y: showHeaderLogo ? 0 : -10
                  }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  whileTap={{ scale: 0.96 }}
                  className="relative"
                >
                  <Image
                    src="/logo.webp"
                    alt="Vadiler Çiçek"
                    width={120}
                    height={38}
                    className="object-contain"
                    priority
                  />
                </motion.div>
              </Link>

              {/* Right - Action Cluster (Apple Watch Style) */}
              <div className="flex items-center gap-2">
                {/* Search Pill */}
                <motion.button
                  onClick={() => setIsSearchOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-11 h-11 flex items-center justify-center rounded-2xl
                    transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 100%)',
                  }}
                  aria-label="Ara"
                >
                  <Search size={18} strokeWidth={2.2} className="text-gray-700" />
                </motion.button>

                {/* Cart - Hero Button with Glow */}
                <motion.button
                  onClick={() => window.location.href = '/sepet'}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  className="relative w-11 h-11 flex items-center justify-center rounded-2xl
                    transition-all duration-300"
                  style={{ 
                    background: 'linear-gradient(135deg, #e05a4c 0%, #d64a3c 100%)',
                    boxShadow: '0 4px 20px rgba(224, 90, 76, 0.35), 0 0 0 1px rgba(255,255,255,0.1) inset',
                  }}
                  aria-label="Sepet"
                >
                  <ShoppingCart size={17} strokeWidth={2.2} className="text-white" />
                  <AnimatePresence>
                    {isHydrated && cartCount > 0 && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1
                          bg-white rounded-full flex items-center justify-center
                          text-[10px] font-bold"
                        style={{ 
                          color: '#e05a4c',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15), 0 0 0 2px white',
                        }}
                      >
                        {cartCount > 99 ? '99+' : cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MOBILE SEARCH MODAL - Full Screen Apple Style
            ═══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[30000] lg:hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              {/* Search Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex items-center gap-3 px-4 h-[60px] border-b border-gray-100"
              >
                <div className="flex-1 relative">
                  <SearchBar 
                    isMobile 
                    autoFocus 
                    onClose={() => setIsSearchOpen(false)} 
                    onOpenChange={setIsSearchDropdownOpen}
                  />
                </div>
                <motion.button
                  onClick={() => setIsSearchOpen(false)}
                  whileTap={{ scale: 0.9 }}
                  className="text-primary-500 font-medium text-[15px] px-2"
                >
                  İptal
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DESKTOP Top Bar */}
        <motion.div 
        ref={topBandRef}
        initial={false}
        animate={{
          height: 'auto',
          opacity: 1,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="hidden lg:block overflow-hidden border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-xl text-white"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between gap-3 py-2">
            {/* Info band */}
            <div className="flex-1 min-w-0">
              {(() => {
                const InfoItems = () => (
                  <>
                    <div className="flex items-center gap-2 shrink-0 rounded-full border border-white/15 bg-primary-500 px-3 py-1">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 border border-white/15">
                        <Truck size={14} className="text-white" />
                      </span>
                      <span className="text-xs sm:text-sm font-semibold whitespace-nowrap text-white">İstanbul içi ücretsiz kargo</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 rounded-full border border-white/15 bg-primary-500 px-3 py-1">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 border border-white/15">
                        <CreditCard size={14} className="text-white" />
                      </span>
                      <span className="text-xs sm:text-sm font-semibold whitespace-nowrap text-white">iyzico ile güvenli ödeme</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 rounded-full border border-white/15 bg-secondary-500 px-3 py-1">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 border border-white/15">
                        <BadgeCheck size={14} className="text-white" />
                      </span>
                      <span className="text-xs sm:text-sm font-semibold whitespace-nowrap text-white">Memnuniyet garantisi</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 rounded-full border border-white/15 bg-secondary-500 px-3 py-1">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 border border-white/15">
                        <ShieldCheck size={14} className="text-white" />
                      </span>
                      <span className="text-xs sm:text-sm font-semibold whitespace-nowrap text-white">Kalite &amp; uygun fiyat garantisi</span>
                    </div>
                  </>
                );

                return (
                  <div className="topbar-marquee">
                    <div className="topbar-marquee-track gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 pr-3">
                        <InfoItems />
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 pr-3" aria-hidden="true">
                        <InfoItems />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Utilities */}
            <div className="hidden md:flex items-center gap-5 text-sm text-white/90">
              <PhoneLink />
              <Link href="/siparis-takip" className="hover:text-primary-100 transition-colors">
                Sipariş Takip
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* DESKTOP Main Header */}
      <motion.div
        initial={false}
        animate={{
          y: isHidden ? -200 : 0,
          opacity: isHidden ? 0 : 1,
          backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.97)' : 'rgba(255, 255, 255, 1)',
          backdropFilter: isScrolled ? 'blur(12px)' : 'blur(0px)',
          boxShadow: isScrolled 
            ? '0 4px 30px rgba(0, 0, 0, 0.1)' 
            : '0 0px 0px rgba(0, 0, 0, 0)',
          paddingTop: isScrolled ? '8px' : '16px',
          paddingBottom: isScrolled ? '8px' : '16px',
        }}
        transition={{
          duration: 0.4,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="hidden lg:block relative z-[20001]"
      >
        <div className="container-custom">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <div
                ref={logoRef as React.RefObject<HTMLDivElement>}
                className="relative"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: showHeaderLogo ? 1 : 0,
                  }}
                  transition={{
                    duration: 0.15,
                    ease: "easeOut",
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Image
                    src="/logo.webp"
                    alt="Vadiler Çiçek"
                    width={isScrolled ? 120 : 150}
                    height={isScrolled ? 40 : 50}
                    className="transition-all duration-300 object-contain"
                    priority
                  />
                </motion.div>
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="flex flex-1 max-w-xl mx-8">
              <SearchBar onOpenChange={setIsSearchDropdownOpen} />
            </div>

            {/* Right Actions - Desktop Only */}
            <div className="flex items-center gap-4 relative z-[20002]">
              {/* User Account */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = '/hesabim';
                }}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full transition-colors group cursor-pointer"
                aria-label="Hesabım">
                <User size={22} className="text-gray-700 group-hover:text-primary-500 transition-colors" />
                <span className="hidden xl:inline text-sm text-gray-700 group-hover:text-primary-500 transition-colors">
                  Hesabım
                </span>
              </button>

              {/* Wishlist */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = '/hesabim/favorilerim';
                }}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group cursor-pointer"
                aria-label="Favorilerim">
                <Heart size={22} className="text-gray-700 group-hover:text-primary-500 transition-colors" />
                {isHydrated && wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 min-w-4 h-4 px-1 text-white text-[10px] 
                    rounded-full flex items-center justify-center font-semibold"
                    style={{ backgroundColor: '#e05a4c' }}>
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = '/sepet';
                }}
                className="relative flex items-center gap-2 p-2 px-3 rounded-full 
                hover:opacity-90 transition-all group shadow-md cursor-pointer"
                style={{ backgroundColor: '#e05a4c' }}
                aria-label={`Sepet${cartCount > 0 ? ` (${cartCount} ürün)` : ''}`}>
                <ShoppingCart size={20} className="text-white" />
                <span className="text-sm font-medium text-white">Sepet</span>
                {isHydrated && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-xs 
                    rounded-full flex items-center justify-center font-semibold shadow-md"
                    style={{ color: '#e05a4c' }}>
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation - Desktop */}
      {!hideCategories && (
        <nav className={`hidden lg:block bg-white border-t border-gray-100 transition-all duration-300 ${
          isScrolled ? 'h-0 overflow-hidden opacity-0' : 'h-auto opacity-100'
        } ${isSearchDropdownOpen ? 'relative z-0' : 'relative z-10'}`}>
          <div className="container-custom">
          <ul className="flex items-center justify-center gap-2">
            {/* Tüm Kategoriler Dropdown */}
            <li 
              className="relative"
              onMouseEnter={() => setIsCategoryMenuOpen(true)}
              onMouseLeave={() => setIsCategoryMenuOpen(false)}
            >
              <button
                className="relative flex items-center gap-1 px-3 py-4 text-sm font-semibold text-primary-600 
                  hover:text-primary-700 transition-colors group"
              >
                Tüm Kategoriler
                <ChevronDown 
                  size={14} 
                  className={`transition-transform duration-300 ${
                    isCategoryMenuOpen ? 'rotate-180' : ''
                  }`} 
                />
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 
                  bg-primary-500 transition-all duration-300 group-hover:w-full" />
              </button>

              {/* Mega Menu Dropdown */}
              <AnimatePresence>
                {isCategoryMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 top-full mt-0 w-[600px] bg-white 
                      rounded-b-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                  >
                    {/* Dropdown Content */}
                    <div className="p-6">
                      <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                        {categories.map((category) => (
                          <Link
                            key={category.id}
                            href={`/${category.slug}`}
                            className="flex items-center justify-between p-2.5 rounded-lg 
                              hover:bg-primary-50 transition-all duration-200 group"
                            onClick={() => setIsCategoryMenuOpen(false)}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <CategoryAvatar
                                name={category.name}
                                image={category.image}
                                size={36}
                                className="flex-shrink-0"
                              />
                              <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 truncate">
                                {category.name}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
            
            {/* İlk 8-9 Kategori Yan Yana */}
            {categories.slice(0, 9).map((category) => (
              <li key={category.id}>
                <Link 
                  href={`/${category.slug}`}
                  className="relative flex items-center gap-2 px-3 py-4 text-sm font-medium text-gray-700 
                    hover:text-primary-500 transition-colors group whitespace-nowrap"
                >
                  <CategoryAvatar
                    name={category.name}
                    image={category.image}
                    size={34}
                    className="flex-shrink-0"
                  />
                  <span className="truncate">{category.name}</span>
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 
                    bg-primary-500 transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
            ))}
            
            {/* İletişim Linki */}
            <li>
              <Link 
                href="/iletisim"
                className="relative flex items-center gap-1 px-3 py-4 text-sm font-medium text-gray-700 
                  hover:text-primary-500 transition-colors group whitespace-nowrap"
              >
                İletişim
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 
                  bg-primary-500 transition-all duration-300 group-hover:w-full" />
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      )}
    </div>
    
    {/* Mobile Full Screen Search Modal - Amazon/Shopify Style */}
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[30000] bg-white lg:hidden"
        >
          {/* Search Header */}
          <div className="flex items-center gap-3 px-4 h-14 border-b border-gray-100 bg-white">
            <div className="flex-1">
              <SearchBar 
                isMobile 
                autoFocus 
                onClose={() => setIsSearchOpen(false)} 
                onOpenChange={setIsSearchDropdownOpen}
              />
            </div>
            <motion.button
              onClick={() => setIsSearchOpen(false)}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 flex items-center justify-center rounded-full
                bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0"
            >
              <X size={20} className="text-gray-600" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Mobile Category Menu - Apple/Shopify Style */}
    <MobileCategoryMenu />
    </>
  );
}

// Phone link component with settings
function PhoneLink() {
  const phone = useSetting('site', 'phone', '0850 307 4876');
  const phoneHref = phone?.toString().replace(/\s/g, '') || '08503074876';

  return (
    <a 
      href={`tel:${phoneHref}`} 
      className="flex items-center gap-2 text-white/90 hover:text-primary-100 transition-colors"
    >
      <Phone size={14} />
      <span className="hidden sm:inline">{phone}</span>
    </a>
  );
}
