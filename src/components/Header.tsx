'use client';

import { useState, useEffect } from 'react';
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
  ChevronDown 
} from 'lucide-react';
import { usePreloader } from '@/app/ClientRoot';
import { useCart } from '@/context/CartContext';
import { useCustomer } from '@/context/CustomerContext';
import { useSetting } from '@/hooks/useSettings';
import SearchBar from './SearchBar';
import CategoryAvatar from './ui/CategoryAvatar';

interface Category {
  id: number;
  name: string;
  slug: string;
  productCount: number;
  image?: string;
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isHidden, setIsHidden] = useState(false);
  
  // Get cart state
  const { getTotalItems } = useCart();
  const cartCount = getTotalItems();
  
  // Get customer favorites count
  const { state: customerState } = useCustomer();
  const wishlistCount = customerState.currentCustomer?.favorites?.length || 0;
  
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
  useEffect(() => {
    registerLogoPosition();
  }, [registerLogoPosition]);

  return (
    <motion.header 
      initial={false}
      animate={{ 
        y: isHidden ? -200 : 0,
        opacity: isHidden ? 0 : 1 
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-0 left-0 right-0 z-[9999]" 
      style={{ pointerEvents: isHidden ? 'none' : 'none' }}
    >
      {/* Top Bar */}
      <motion.div 
        initial={false}
        animate={{
          height: isScrolled ? 0 : 'auto',
          opacity: isScrolled ? 0 : 1,
        }}
        transition={{
          duration: 0.4,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="text-gray-600 overflow-hidden"
        style={{ backgroundColor: '#ffffff', pointerEvents: 'auto' }}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between py-2 text-sm">
            <div className="flex items-center gap-6">
              <PhoneLink />
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:inline animate-pulse-soft">🎁 %70&apos;e varan indirim fırsatları!</span>
              <Link href="/siparis-takip" className="hover:text-primary-100 transition-colors">
                Sipariş Takip
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Header */}
      <motion.div 
        initial={false}
        animate={{
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
        className="relative z-[100]" style={{ pointerEvents: 'auto' }}
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
                    src="/logo.png"
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
            <div className="hidden lg:flex flex-1 max-w-xl mx-8">
              <SearchBar onOpenChange={setIsSearchDropdownOpen} />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4 relative z-[9999]" style={{ pointerEvents: 'auto' }}>
              {/* Mobile Search Toggle */}
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Search size={22} className="text-gray-700" />
              </button>

              {/* User Account */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = '/hesabim';
                }}
                className="hidden sm:flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full transition-colors group cursor-pointer">
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
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group cursor-pointer">
                <Heart size={22} className="text-gray-700 group-hover:text-primary-500 transition-colors" />
                {wishlistCount > 0 && (
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
                style={{ backgroundColor: '#e05a4c' }}>
                <ShoppingCart size={20} className="text-white" />
                <span className="hidden sm:inline text-sm font-medium text-white">Sepet</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-xs 
                    rounded-full flex items-center justify-center font-semibold shadow-md"
                    style={{ color: '#e05a4c' }}>
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => {
                  // Close other overlays before opening the mobile sidebar to avoid stacking
                  window.dispatchEvent(new Event('closeAllOverlays'));
                  window.dispatchEvent(new CustomEvent('openMobileSidebar'));
                }}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Menu size={24} className="text-gray-700" />
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden relative z-[9999]"
              >
                <div className="pt-4 pb-2">
                  <SearchBar 
                    isMobile 
                    autoFocus 
                    onClose={() => setIsSearchOpen(false)}
                    onOpenChange={setIsSearchDropdownOpen}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Navigation - Desktop */}
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
    </motion.header>
  );
}

// Phone link component with settings
function PhoneLink() {
  const phone = useSetting('site', 'phone', '0850 307 4876');
  const phoneHref = phone?.toString().replace(/\s/g, '') || '08503074876';

  return (
    <a 
      href={`tel:${phoneHref}`} 
      className="flex items-center gap-2 hover:text-primary-100 transition-colors"
    >
      <Phone size={14} />
      <span className="hidden sm:inline">{phone}</span>
    </a>
  );
}
