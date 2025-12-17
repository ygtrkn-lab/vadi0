'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Heart, Menu, X, ShoppingCart, User, Phone, MapPin, ChevronRight, Flower2 } from 'lucide-react';
import { useSetting } from '@/hooks/useSettings';
import SearchBar from './SearchBar';
import CategoryAvatar from './ui/CategoryAvatar';

export default function MobileNavBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Get phone from settings
  const phone = useSetting('site', 'phone', '0850 307 4876');
  const phoneHref = phone?.toString().replace(/\s/g, '') || '08503074876';

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        const incoming = data.categories || data.data || [];
        const filtered = incoming.filter(
          (cat: any) => cat?.slug && cat?.name && (cat.productCount || 0) > 0
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
      const currentScrollY = window.scrollY;
      
      // Show only after some scroll on the page
      if (currentScrollY <= 50) {
        setIsVisible(true);
      } else {
        // Scrolling down - hide navbar after threshold
        if (currentScrollY > lastScrollY.current) {
          setIsVisible(false);
        }
        // Scrolling up - show navbar
        if (currentScrollY < lastScrollY.current) {
          setIsVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;

      // Show navbar when scroll stops - faster response
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      scrollTimeout.current = setTimeout(() => {
        if (window.scrollY > 50) {
          setIsVisible(true);
        }
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  // Listen for open sidebar event from Header
  useEffect(() => {
    const handleOpenSidebar = () => {
      setIsSidebarOpen(true);
    };

    window.addEventListener('openMobileSidebar', handleOpenSidebar);
    return () => {
      window.removeEventListener('openMobileSidebar', handleOpenSidebar);
    };
  }, []);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const navItems = [
    { icon: Home, label: 'Ana Sayfa', href: '/', action: null },
    { icon: Search, label: 'Ara', href: null, action: 'search' as const },
    { icon: Heart, label: 'Favoriler', href: '/hesabim/favorilerim', action: null },
  ];

  // Limit category render count for faster mobile menu
  const displayedCategories = categories.slice(0, 18);

  return (
    <>
      {/* Mobile Bottom Nav Bar */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: isVisible ? 0 : 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      >
        {/* Glassmorphism background */}
        <div className="mx-4 mb-4 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.1), 0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)',
          }}
        >
          <div className="flex items-center justify-around py-2 px-2">
            {navItems.map((item) => {
              if (item.action === 'search') {
                return (
                  <button
                    key={item.label}
                    onClick={() => setIsSearchOpen(true)}
                    className="flex flex-col items-center gap-1 py-2 px-4 rounded-xl 
                      transition-all duration-300 active:scale-95 group"
                  >
                    <div className="p-2 rounded-xl transition-all duration-300 
                      group-hover:bg-primary-50 group-active:bg-primary-100">
                      <item.icon 
                        size={22} 
                        className="text-gray-600 group-hover:text-primary-500 transition-colors" 
                      />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 group-hover:text-primary-500 transition-colors">
                      {item.label}
                    </span>
                  </button>
                );
              }
              
              return (
                <Link
                  key={item.label}
                  href={item.href!}
                  className="flex flex-col items-center gap-1 py-2 px-4 rounded-xl 
                    transition-all duration-300 active:scale-95 group"
                >
                  <div className="p-2 rounded-xl transition-all duration-300 
                    group-hover:bg-primary-50 group-active:bg-primary-100">
                    <item.icon 
                      size={22} 
                      className="text-gray-600 group-hover:text-primary-500 transition-colors" 
                    />
                  </div>
                  <span className="text-[10px] font-medium text-gray-500 group-hover:text-primary-500 transition-colors">
                    {item.label}
                  </span>
                </Link>
              );
            })}
            
            {/* Menu Button */}
            <button
              onClick={() => {
                window.dispatchEvent(new Event('closeAllOverlays'));
                setIsSidebarOpen(true);
              }}
              className="flex flex-col items-center gap-1 py-2 px-4 rounded-xl 
                transition-all duration-300 active:scale-95 group"
            >
              <div className="p-2 rounded-xl transition-all duration-300 
                group-hover:bg-primary-50 group-active:bg-primary-100"
                style={{ backgroundColor: 'rgba(224, 90, 76, 0.1)' }}
              >
                <Menu 
                  size={22} 
                  style={{ color: '#e05a4c' }}
                />
              </div>
              <span className="text-[10px] font-medium" style={{ color: '#e05a4c' }}>
                Menü
              </span>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm z-[70] lg:hidden overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #faf9f7 100%)',
                boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.15)',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)',
              }}
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(224, 90, 76, 0.1)' }}>
                    <Flower2 size={20} style={{ color: '#e05a4c' }} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Vadiler Çiçek</h2>
                    <p className="text-xs text-gray-500">Hoş geldiniz</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={24} className="text-gray-500" />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="overflow-y-auto h-[calc(100%-80px)] pb-16 overscroll-contain">
                {/* Quick Actions */}
                <div className="p-4 grid grid-cols-2 gap-2.5">
                  <Link 
                    href="/sepet" 
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-3 p-3.5 rounded-2xl transition-all active:scale-95"
                    style={{ backgroundColor: 'rgba(224, 90, 76, 0.08)' }}
                  >
                    <ShoppingCart size={20} style={{ color: '#e05a4c' }} />
                    <span className="text-sm font-medium text-gray-800">Sepetim</span>
                  </Link>
                  <Link 
                    href="/hesabim" 
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 transition-all active:scale-95"
                  >
                    <User size={20} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-800">Hesabım</span>
                  </Link>
                </div>

                {/* Quick Links */}
                <div className="px-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Hızlı Erişim
                  </p>
                  <div className="space-y-1">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Link
                        href="/"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl 
                          hover:bg-gray-50 transition-all group"
                      >
                        <span className="text-gray-700 font-medium">Ana Sayfa</span>
                        <ChevronRight size={18} className="text-gray-400 group-hover:text-primary-500 
                          group-hover:translate-x-1 transition-all" />
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Link
                        href="/siparis-takip"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl 
                          hover:bg-gray-50 transition-all group"
                      >
                        <span className="text-gray-700 font-medium">Sipariş Takip</span>
                        <ChevronRight size={18} className="text-gray-400 group-hover:text-primary-500 
                          group-hover:translate-x-1 transition-all" />
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <Link
                        href="/iletisim"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl 
                          hover:bg-gray-50 transition-all group"
                      >
                        <span className="text-gray-700 font-medium">İletişim</span>
                        <ChevronRight size={18} className="text-gray-400 group-hover:text-primary-500 
                          group-hover:translate-x-1 transition-all" />
                      </Link>
                    </motion.div>
                  </div>
                </div>

                {/* Categories Accordion */}
                <div className="px-4 mt-5">
                  <button
                    onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl 
                      hover:bg-gray-50 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Flower2 size={18} style={{ color: '#e05a4c' }} />
                      <span className="text-sm font-semibold text-gray-700">
                        Kategoriler
                      </span>
                    </div>
                    <ChevronRight 
                      size={18} 
                      className={`text-gray-400 transition-transform duration-300 ${
                        isCategoriesExpanded ? 'rotate-90' : ''
                      }`} 
                    />
                  </button>

                  {/* Expandable Category List */}
                  <AnimatePresence>
                    {isCategoriesExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 mt-1.5 pl-2.5">
                          {displayedCategories.map((category, index) => (
                            <motion.div
                              key={category.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                            >
                              <Link
                                href={`/${category.slug}`}
                                onClick={() => {
                                  setIsSidebarOpen(false);
                                  setIsCategoriesExpanded(false);
                                }}
                                className="flex items-center justify-between p-2 rounded-lg 
                                  hover:bg-gray-50 transition-all group"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <CategoryAvatar
                                    name={category.name}
                                    image={category.image}
                                    size={34}
                                    className="flex-shrink-0"
                                  />
                                  <span className="text-sm text-gray-700 truncate">{category.name}</span>
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Contact Info */}
                <div className="px-4 mt-5 pb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    İletişim
                  </p>
                  <div className="space-y-2">
                    <a 
                      href={`tel:${phoneHref}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
                    >
                      <Phone size={18} className="text-gray-500" />
                      <span className="text-sm text-gray-700">{phone}</span>
                    </a>
                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50">
                      <svg className="w-[18px] h-[18px] text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-500 mb-1">Merkez Ofisimiz</span>
                        <span className="text-sm text-gray-700 leading-relaxed">Soğanlı mah Gökçe sok no:1 kat: 4<br />Bahçelievler İstanbul</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-white lg:hidden"
          >
            <SearchBar 
              isMobile={true}
              onClose={() => setIsSearchOpen(false)}
              autoFocus={true}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
