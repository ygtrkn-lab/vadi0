'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  Home, 
  Package, 
  Phone, 
  Heart, 
  User, 
  ShoppingCart,
  MapPin,
  Flower2,
  Truck,
  ArrowRight
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCustomer } from '@/context/CustomerContext';
import { useSetting } from '@/hooks/useSettings';

interface Category {
  id: number;
  name: string;
  slug: string;
  productCount?: number;
  image?: string;
}

export default function MobileCategoryMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const { getTotalItems } = useCart();
  const cartCount = getTotalItems();
  
  const { state: customerState } = useCustomer();
  const wishlistCount = customerState.currentCustomer?.favorites?.length || 0;
  const isLoggedIn = !!customerState.currentCustomer;
  
  const phone = useSetting('site', 'phone', '0850 307 4876');
  const phoneHref = phone?.toString().replace(/\s/g, '') || '08503074876';

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
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

  // Listen for open event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);
    
    window.addEventListener('openMobileCategoryMenu', handleOpen);
    window.addEventListener('closeMobileCategoryMenu', handleClose);
    window.addEventListener('closeAllOverlays', handleClose);
    
    return () => {
      window.removeEventListener('openMobileCategoryMenu', handleOpen);
      window.removeEventListener('closeMobileCategoryMenu', handleClose);
      window.removeEventListener('closeAllOverlays', handleClose);
    };
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Quick links - Apple style minimal
  const quickLinks = useMemo(() => [
    { icon: Home, label: 'Ana Sayfa', href: '/' },
    { icon: Package, label: 'Sipariş Takip', href: '/siparis-takip' },
    { icon: Heart, label: 'Favoriler', href: '/hesabim/favorilerim', badge: wishlistCount },
    { icon: User, label: 'Hesabım', href: '/hesabim' },
  ], [wishlistCount]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - iOS Style Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[10000] lg:hidden"
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          />

          {/* Menu Panel - Full Height Slide from Left */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ 
              type: 'spring', 
              stiffness: 400, 
              damping: 40,
              mass: 0.8 
            }}
            className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-[360px] z-[10001] lg:hidden
              flex flex-col overflow-hidden"
            style={{
              background: '#ffffff',
              boxShadow: '20px 0 60px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* ═══════════════════════════════════════════
                HEADER SECTION - Apple Style Minimal
                ═══════════════════════════════════════════ */}
            <div className="shrink-0 pt-16">
              {/* Close Handle Bar - iOS Style */}
              <div className="flex justify-end p-3 pt-2">
                <motion.button
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-9 h-9 rounded-full flex items-center justify-center
                    transition-colors duration-200"
                  style={{ background: 'rgba(0,0,0,0.05)' }}
                >
                  <X size={18} strokeWidth={2.5} className="text-gray-500" />
                </motion.button>
              </div>

              {/* Welcome Section - Personalized */}
              <div className="px-5 pb-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-[13px] text-gray-400 font-medium">
                    {isLoggedIn ? 'Hoş geldin' : 'Merhaba'}
                  </p>
                  <h2 className="text-[22px] font-bold text-gray-900 tracking-tight mt-0.5">
                    {isLoggedIn 
                      ? customerState.currentCustomer?.name?.split(' ')[0] || 'Değerli Müşterimiz'
                      : 'Vadiler Çiçek'
                    }
                  </h2>
                </motion.div>

                {/* Cart CTA - If Has Items (Shopify Style) */}
                {isHydrated && cartCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Link
                      href="/sepet"
                      onClick={() => setIsOpen(false)}
                      className="mt-4 flex items-center justify-between p-3.5 rounded-2xl
                        active:scale-[0.98] transition-transform"
                      style={{
                        background: 'linear-gradient(135deg, #e05a4c 0%, #d64a3c 100%)',
                        boxShadow: '0 4px 20px rgba(224, 90, 76, 0.3)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.2)' }}>
                          <ShoppingCart size={18} className="text-white" />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-[14px]">
                            {cartCount} ürün sepetinde
                          </p>
                          <p className="text-white/70 text-[12px]">Alışverişi tamamla</p>
                        </div>
                      </div>
                      <ArrowRight size={18} className="text-white/80" />
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>

            {/* ═══════════════════════════════════════════
                SCROLLABLE CONTENT
                ═══════════════════════════════════════════ */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              
              {/* Quick Links Grid - Apple Watch Style */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="px-5 pb-4"
              >
                <div className="grid grid-cols-4 gap-2">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-2xl
                        active:scale-95 transition-all duration-200 relative"
                      style={{ background: 'rgba(0,0,0,0.03)' }}
                    >
                      {/* Icon with notification badge */}
                      <div className="relative">
                        <link.icon size={20} strokeWidth={1.8} className="text-gray-600" />
                        {link.badge !== undefined && (
                          <span 
                            className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full 
                              text-white text-[9px] font-bold flex items-center justify-center"
                            style={{ 
                              backgroundColor: link.badge > 0 ? '#e05a4c' : '#9ca3af',
                              boxShadow: link.badge > 0 ? '0 2px 6px rgba(224, 90, 76, 0.4)' : '0 1px 3px rgba(0,0,0,0.1)',
                              border: '2px solid white'
                            }}
                          >
                            {link.badge > 99 ? '99+' : link.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-gray-600">
                        {link.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Divider */}
              <div className="h-[1px] bg-gray-100 mx-5" />

              {/* Categories Section - Premium List Style */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="px-5 py-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                    Kategoriler
                  </h3>
                </div>

                <div className="space-y-1">
                  {categories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.02 }}
                    >
                      <Link
                        href={`/${category.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-xl
                          active:bg-gray-50 transition-colors group -mx-1"
                      >
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0
                          bg-gray-100 flex items-center justify-center">
                          {category.image ? (
                            <Image
                              src={category.image}
                              alt={category.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Flower2 size={18} className="text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-gray-800 truncate
                            group-active:text-primary-600 transition-colors">
                            {category.name}
                          </p>
                          {category.productCount && (
                            <p className="text-[11px] text-gray-400">
                              {category.productCount} ürün
                            </p>
                          )}
                        </div>
                        <ChevronRight size={16} className="text-gray-300 
                          group-active:text-primary-500 group-active:translate-x-0.5 
                          transition-all shrink-0" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Divider */}
              <div className="h-[1px] bg-gray-100 mx-5" />

              {/* Delivery Promise - Minimal Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="px-5 py-4"
              >
                <div className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: 'rgba(16, 185, 129, 0.06)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(16, 185, 129, 0.12)' }}>
                    <Truck size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">Aynı Gün Teslimat</p>
                    <p className="text-[11px] text-gray-500">İstanbul içi ücretsiz kargo</p>
                  </div>
                </div>
              </motion.div>

              {/* Contact Section - Compact */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="px-5 pb-6"
              >
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  İletişim
                </h3>
                <div className="space-y-2">
                  <a
                    href={`tel:${phoneHref}`}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl -mx-1
                      active:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                      <Phone size={16} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-gray-800">{phone}</p>
                      <p className="text-[11px] text-gray-400">Hemen ara</p>
                    </div>
                  </a>

                  <Link
                    href="/iletisim"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl -mx-1
                      active:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                      <MapPin size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-gray-800">İletişim</p>
                      <p className="text-[11px] text-gray-400">Adres & bilgiler</p>
                    </div>
                  </Link>
                </div>
              </motion.div>

              {/* Safe Area Bottom Padding */}
              <div className="h-6" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
