'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Heart, X, Menu } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCustomer } from '@/context/CustomerContext';
import SearchBar from './SearchBar';

interface MobileHeaderProps {
  onMenuOpen?: () => void;
}

export default function MobileHeader({ onMenuOpen }: MobileHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const lastScrollY = useRef(0);
  
  const { getTotalItems } = useCart();
  const cartCount = getTotalItems();
  
  const { state: customerState } = useCustomer();
  const wishlistCount = customerState.currentCustomer?.favorites?.length || 0;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Smart scroll behavior - Apple style
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setIsScrolled(currentScrollY > 20);
      
      // Hide on scroll down, show on scroll up (like Apple.com)
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for external hide/show events
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

  const handleMenuClick = () => {
    if (onMenuOpen) {
      onMenuOpen();
    } else {
      window.dispatchEvent(new CustomEvent('openMobileCategoryMenu'));
    }
  };

  return (
    <>
      {/* Mobile Header - Apple/Shopify Style */}
      <motion.header
        initial={{ y: 0 }}
        animate={{ 
          y: isHidden ? -100 : 0,
          opacity: isHidden ? 0 : 1 
        }}
        transition={{ 
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
        className="fixed top-0 left-0 right-0 z-[9999] lg:hidden"
      >
        {/* Glass morphism background */}
        <motion.div
          initial={false}
          animate={{
            backgroundColor: isScrolled 
              ? 'rgba(255, 255, 255, 0.92)' 
              : 'rgba(255, 255, 255, 1)',
            backdropFilter: isScrolled ? 'blur(20px)' : 'blur(0px)',
            borderBottomColor: isScrolled ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
          }}
          className="border-b"
          style={{
            WebkitBackdropFilter: isScrolled ? 'blur(20px)' : 'blur(0px)',
          }}
        >
          {/* Compact top info bar - Only visible when not scrolled */}
          <AnimatePresence>
            {!isScrolled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-neutral-950 overflow-hidden"
              >
                <div className="flex items-center justify-center py-1.5 px-4">
                  <p className="text-[11px] text-white/90 font-medium tracking-wide">
                    ✨ İstanbul içi ücretsiz teslimat
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main header content */}
          <div className="flex items-center justify-between px-4 h-14">
            {/* Left - Menu Button */}
            <motion.button
              onClick={handleMenuClick}
              whileTap={{ scale: 0.92 }}
              className="relative w-10 h-10 flex items-center justify-center rounded-full 
                bg-gray-50 active:bg-gray-100 transition-colors"
              aria-label="Menüyü Aç"
            >
              <Menu size={20} className="text-gray-700" />
            </motion.button>

            {/* Center - Logo */}
            <Link href="/" className="flex-shrink-0">
              <motion.div
                whileTap={{ scale: 0.97 }}
                className="relative"
              >
                <Image
                  src="/logo.webp"
                  alt="Vadiler Çiçek"
                  width={110}
                  height={36}
                  className="object-contain"
                  priority
                />
              </motion.div>
            </Link>

            {/* Right - Actions */}
            <div className="flex items-center gap-1">
              {/* Search Button */}
              <motion.button
                onClick={() => setIsSearchOpen(true)}
                whileTap={{ scale: 0.92 }}
                className="relative w-10 h-10 flex items-center justify-center rounded-full
                  bg-gray-50 active:bg-gray-100 transition-colors"
                aria-label="Ara"
              >
                <Search size={18} className="text-gray-700" />
              </motion.button>

              {/* Cart Button - Highlighted */}
              <motion.button
                onClick={() => window.location.href = '/sepet'}
                whileTap={{ scale: 0.92 }}
                className="relative w-10 h-10 flex items-center justify-center rounded-full
                  transition-colors"
                style={{ backgroundColor: '#e05a4c' }}
                aria-label="Sepet"
              >
                <ShoppingCart size={18} className="text-white" />
                {isHydrated && cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1
                      bg-white rounded-full flex items-center justify-center
                      text-[10px] font-bold shadow-sm"
                    style={{ color: '#e05a4c' }}
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.header>

      {/* Full Screen Search Modal - Amazon/Shopify Style */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-[10001] bg-white lg:hidden"
          >
            {/* Search Header */}
            <div className="flex items-center gap-3 px-4 h-14 border-b border-gray-100">
              <div className="flex-1">
                <SearchBar 
                  isFullScreen
                  autoFocus 
                  onClose={() => setIsSearchOpen(false)} 
                />
              </div>
              <motion.button
                onClick={() => setIsSearchOpen(false)}
                whileTap={{ scale: 0.92 }}
                className="w-10 h-10 flex items-center justify-center rounded-full
                  bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-14 lg:hidden" />
    </>
  );
}
