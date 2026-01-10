'use client';

import { useState, useRef, useEffect, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { Heart, ShoppingCart, ChevronRight, ChevronLeft, Star, Truck, Gift, Clock, Check, Play } from 'lucide-react';
import type { Product } from '@/data/products';
import { useCustomer } from '@/context/CustomerContext';
import { useCart } from '@/context/CartContext';

// URL'den medya türünü belirle
function getMediaType(url: string): 'image' | 'video' | 'unknown' {
  if (!url) return 'unknown';
  const lowered = url.toLowerCase();
  if (lowered.includes('.mp4') || lowered.includes('.webm') || lowered.includes('.mov') || lowered.includes('/video/')) {
    return 'video';
  }
  return 'image';
}

interface HomeCategoryProductsProps {
  categorySlug: string;
  title: string;
  limit?: number;
  showViewAll?: boolean;
  variant?: 'default' | 'featured' | 'compact';
}

// Enhanced Product Card for Homepage - Çiçeksepeti Style
function ProductCardEnhanced({ product, index }: { product: Product; index: number }) {
  const { state: customerState, addToFavorites, removeFromFavorites, isFavorite } = useCustomer();
  const { addToCart } = useCart();
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  const customer = customerState.currentCustomer;
  const isWishlisted = customer ? isFavorite(customer.id, String(product.id)) : false;
  const isMainVideo = getMediaType(product.image) === 'video';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!customer) {
      window.location.href = '/giris?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    if (isWishlisted) {
      removeFromFavorites(customer.id, String(product.id));
    } else {
      addToFavorites(customer.id, String(product.id));
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.inStock) {
      addToCart(product);
      setIsAddedToCart(true);
      setTimeout(() => setIsAddedToCart(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="group flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px]"
    >
      <Link 
        href={`/${product.category}/${product.slug}`}
        className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
      >
        {/* Image Container - Video Support */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {isMainVideo ? (
            <div className="relative w-full h-full">
              <video
                src={product.image}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 cursor-pointer"
                loop
                muted
                playsInline
                preload="none"
                poster={product.hoverImage || product.gallery?.[0] || ''}
                autoPlay
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isVideoPlaying) {
                    e.currentTarget.pause();
                    setIsVideoPlaying(false);
                  } else {
                    e.currentTarget.play();
                    setIsVideoPlaying(true);
                  }
                }}
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
              />
              {/* Video pause indicator */}
              {!isVideoPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                    <Play size={18} className="text-white ml-0.5" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Image
              src={imageError ? '/placeholder-flower.jpg' : product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, (max-width: 1024px) 200px, 220px"
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              onError={() => setImageError(true)}
            />
          )}
          
          {/* Discount Badge - More prominent */}
          {product.discount > 0 && (
            <div className="absolute top-0 left-0 z-10">
              <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-3 py-1.5 rounded-br-xl shadow-lg">
                <span className="text-xs font-bold">%{product.discount}</span>
                <span className="text-[10px] ml-0.5">İNDİRİM</span>
              </div>
            </div>
          )}

          {/* Same Day Delivery Badge */}
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-green-500 text-white p-1.5 rounded-full shadow-md" title="Hızlı Teslimat">
              <Truck size={12} />
            </div>
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className={`absolute bottom-2 right-2 p-2 rounded-full shadow-lg transition-all duration-300 z-10 transform hover:scale-110
              ${isWishlisted 
                ? 'bg-red-500 text-white scale-110 animate-pulse' 
                : 'bg-white/95 text-gray-600 hover:text-red-500 hover:bg-red-50'
              }`}
          >
            <Heart 
              size={16} 
              fill={isWishlisted ? 'currentColor' : 'none'}
              className="transition-all duration-300"
            />
          </button>

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>

        {/* Product Info */}
        <div className="p-3 space-y-2">
          {/* Rating & Reviews */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 bg-yellow-50 px-1.5 py-0.5 rounded">
              <Star size={11} className="fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold text-yellow-700">{product.rating}</span>
            </div>
            <span className="text-[10px] text-gray-400">({product.reviewCount} değerlendirme)</span>
          </div>

          {/* Name */}
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[40px] leading-tight group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>

          {/* Price Section */}
          <div className="space-y-1">
            {product.oldPrice && product.oldPrice > product.price && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.oldPrice)}
                </span>
                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                  {formatPrice(product.oldPrice - product.price)} kazanç
                </span>
              </div>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-primary-600">
                {formatPrice(product.price)}
              </span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAddedToCart}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300
              ${isAddedToCart 
                ? 'bg-green-500 text-white' 
                : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-md hover:shadow-lg'
              }`}
          >
            {isAddedToCart ? (
              <>
                <Check size={16} />
                Eklendi
              </>
            ) : (
              <>
                <ShoppingCart size={16} />
                Sepete Ekle
              </>
            )}
          </button>
        </div>
      </Link>
    </motion.div>
  );
}

// Horizontal Scrollable Category Section with Navigation
export default function HomeCategoryProducts({ 
  categorySlug, 
  title, 
  limit = 12,
  showViewAll = true,
  variant = 'default'
}: HomeCategoryProductsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories')
        ]);
        
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();
        
        const allProducts = productsData.products || productsData.data || [];
        const allCategories = categoriesData.categories || categoriesData.data || [];
        
        const filtered = allProducts
          .filter((p: Product) => p.category === categorySlug)
          .slice(0, limit);
        
        setCategoryProducts(filtered);
        setCategory(allCategories.find((c: any) => c.slug === categorySlug));
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categorySlug, limit]);

  if (loading) return null;
  if (categoryProducts.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  return (
    <section className="py-6 md:py-10">
      <div className="max-w-[1400px] mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {category && category.image && (
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                <Image
                  src={category.image}
                  alt={category.name}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">{title}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Navigation Arrows */}
            <div className="hidden md:flex items-center gap-2 mr-4">
              <button
                onClick={() => scroll('left')}
                disabled={!showLeftArrow}
                className={`p-2 rounded-full border transition-all ${
                  showLeftArrow 
                    ? 'border-gray-300 hover:border-primary-500 hover:bg-primary-50 text-gray-600 hover:text-primary-600' 
                    : 'border-gray-200 text-gray-300 cursor-not-allowed'
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!showRightArrow}
                className={`p-2 rounded-full border transition-all ${
                  showRightArrow 
                    ? 'border-gray-300 hover:border-primary-500 hover:bg-primary-50 text-gray-600 hover:text-primary-600' 
                    : 'border-gray-200 text-gray-300 cursor-not-allowed'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {showViewAll && (
              <Link 
                href={`/${categorySlug}`}
                className="flex items-center gap-1 px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-600 text-sm font-semibold rounded-full transition-colors"
              >
                Tümünü Gör
                <ChevronRight size={16} />
              </Link>
            )}
          </div>
        </div>

        {/* Products Horizontal Scroll */}
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-3 md:gap-4 overflow-x-auto pb-4 px-4 sm:px-6 lg:px-8 scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categoryProducts.map((product, index) => (
              <ProductCardEnhanced 
                key={product.id} 
                product={product} 
                index={index}
              />
            ))}
          </div>

          {/* Gradient Edges */}
          <div className="hidden md:block absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-white to-transparent pointer-events-none z-10" 
            style={{ opacity: showLeftArrow ? 1 : 0, transition: 'opacity 0.3s' }} />
          <div className="hidden md:block absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-white to-transparent pointer-events-none z-10"
            style={{ opacity: showRightArrow ? 1 : 0, transition: 'opacity 0.3s' }} />
        </div>
      </div>
    </section>
  );
}

// Story-style Category Carousel (like Instagram Stories)
export function StoryBannerCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?hasProducts=true');
        const data = await response.json();
        setCategories(data.categories || data.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-6 bg-gradient-to-b from-primary-50/50 to-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Kategoriler</h2>
          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[85px] md:min-w-[100px]">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-200 animate-pulse" />
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 bg-gradient-to-b from-primary-50/50 to-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Kategoriler</h2>
        <div 
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category, index) => (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
            >
              <Link
                href={`/${category.slug}`}
                className="flex flex-col items-center gap-2 min-w-[85px] md:min-w-[100px] group"
              >
                {/* Story Ring - Animated like Instagram Stories */}
                <motion.div
                  className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center"
                  whileHover={{ scale: 1.06, transition: { duration: 0.25 } }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full will-change-transform"
                    style={{
                      background: 'conic-gradient(from 0deg, #f9a8d4, #ec4899, #ffffff, #f9a8d4)',
                    }}
                    animate={{
                      background: [
                        'conic-gradient(from 0deg, #f9a8d4, #ec4899, #ffffff, #f9a8d4)',
                        'conic-gradient(from 0deg, #1f2937, #111827, #f5f5f5, #1f2937)',
                        'conic-gradient(from 0deg, #f9a8d4, #ec4899, #ffffff, #f9a8d4)',
                      ],
                      rotate: 360,
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                  />
                  <div className="absolute inset-[3px] rounded-full bg-white flex items-center justify-center shadow-lg">
                    <div className="w-full h-full p-[2px] rounded-full bg-white">
                      <div className="w-full h-full rounded-full overflow-hidden relative bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 shadow-sm">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            loading="lazy"
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                            🌸
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Category Name */}
                <span className="text-xs md:text-sm text-center text-gray-700 group-hover:text-primary-600 transition-colors font-medium line-clamp-2 max-w-[85px] md:max-w-[100px]">
                  {category.name}
                </span>
                
                {/* Product Count Badge */}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// All Categories with Products (Portal View) - Enhanced
export function HomeAllCategoriesProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        setProducts(data.products || data.data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Define which categories to show on homepage with custom limits
  const homepageCategories = [
    { slug: 'guller', title: '🌹 Güller', limit: 12 },
    { slug: 'orkideler', title: '🌸 Orkideler', limit: 12 },
    { slug: 'buketler', title: '💐 Buketler', limit: 12 },
    { slug: 'ayicikli-cicekler', title: '🧸 Ayıcıklı Çiçekler', limit: 12 },
    { slug: 'balonlu-cicekler', title: '🎈 Balonlu Çiçekler', limit: 12 },
    { slug: 'saksi-cicekleri', title: '🪴 Saksı Çiçekleri', limit: 12 },
    { slug: 'aranjmanlar', title: '🎀 Aranjmanlar', limit: 12 },
    { slug: 'kutuda-cicekler', title: '🎁 Kutuda Çiçekler', limit: 12 },
    { slug: 'lilyumlar', title: '🌺 Lilyumlar', limit: 12 },
    { slug: 'papatyalar', title: '🌼 Papatyalar', limit: 12 },
    { slug: 'hediye', title: '🎊 Hediyeler', limit: 12 },
    { slug: 'cicek-cesitleri', title: '💮 Çiçek Çeşitleri', limit: 12 },
  ];

  return (
    <div className="bg-white">
      {/* Benefits Bar */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 py-3">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 md:gap-12 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 text-white whitespace-nowrap">
              <Truck size={18} />
              <span className="text-sm font-medium">Hızlı Teslimat</span>
            </div>
            <div className="flex items-center gap-2 text-white whitespace-nowrap">
              <Gift size={18} />
              <span className="text-sm font-medium">Ücretsiz Hediye Paketi</span>
            </div>
            <div className="flex items-center gap-2 text-white whitespace-nowrap">
              <Clock size={18} />
              <span className="text-sm font-medium">7/24 Sipariş</span>
            </div>
            <div className="flex items-center gap-2 text-white whitespace-nowrap">
              <Check size={18} />
              <span className="text-sm font-medium">Güvenli Ödeme</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Sections */}
      {homepageCategories.map((cat, index) => {
        const hasProducts = products.some(p => p.category === cat.slug);
        if (!hasProducts) return null;
        
        return (
          <div 
            key={cat.slug}
            className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
          >
            <HomeCategoryProducts
              categorySlug={cat.slug}
              title={cat.title}
              limit={cat.limit}
            />
          </div>
        );
      })}
    </div>
  );
}

// Featured Large Banner Grid - Çiçeksepeti Style
export function FeaturedBannerGrid() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?hasProducts=true');
        const data = await response.json();
        setCategories(data.categories || data.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const featuredCategories = categories.slice(0, 8);

  const resolveOverlayClass = (value?: string) => {
    if (!value) {
      return 'bg-gradient-to-t from-gray-900/60 via-gray-900/20 to-transparent';
    }
    const normalized = value.toLowerCase();
    const presets: Record<string, string> = {
      dark: 'bg-gradient-to-t from-gray-900/60 via-gray-900/20 to-transparent',
      light: 'bg-gradient-to-t from-gray-900/40 via-gray-900/10 to-transparent',
      none: 'bg-gradient-to-t from-transparent via-transparent to-transparent',
    };
    if (presets[normalized]) {
      return presets[normalized];
    }
    if (value.includes('bg-')) {
      return value;
    }
    if (value.includes('from-')) {
      return `bg-gradient-to-t ${value}`;
    }
    return presets.dark;
  };

  if (loading) {
    return (
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Kategoriler</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-gray-100 animate-pulse">
                <div className="aspect-[3/4]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 md:py-6 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header - Animated Apple Style */}
        <div className="mb-8 md:mb-12 text-center overflow-hidden">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight"
          >
            <span className="inline-block bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent pb-1">
              Kategoriler
            </span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Her anınıza özel çiçekler.{' '}
            <span className="inline-block font-semibold text-gray-900">
              Bugün keşfedin.
            </span>
          </motion.p>
        </div>

        {/* Apple-style Category Cards Grid with Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {featuredCategories.map((category, index) => {
            const coverType = category.coverType === 'video' && category.coverVideo ? 'video' : 'image';
            const coverImage = category.coverImage || category.coverMobileImage || category.image;
            const overlayClass = resolveOverlayClass(category.coverOverlay);
            const ctaText = category.coverCtaText || 'Keşfet';
            const subtitle = category.coverSubtitle || '';
            return (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
              >
                <Link 
                  href={`/${category.slug}`}
                  className="group block relative rounded-3xl overflow-hidden bg-gradient-to-br from-white to-gray-50 
                    backdrop-blur-xl border border-gray-200/60 hover:border-gray-300 
                    shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {coverType === 'video' && category.coverVideo ? (
                      <>
                        <video
                          src={category.coverVideo}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="none"
                          poster={coverImage || undefined}
                          loading="lazy"
                          onEnded={(e) => (e.target as HTMLVideoElement).play()}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        <div className={`absolute inset-0 ${overlayClass} group-hover:from-gray-900/70 transition-all duration-500`} />
                      </>
                    ) : coverImage ? (
                      <>
                        <Image
                          src={coverImage}
                          alt={category.name}
                          fill
                          loading="lazy"
                          sizes="(max-width: 768px) 50vw, 25vw"
                          quality={75}
                          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        <div className={`absolute inset-0 ${overlayClass} group-hover:from-gray-900/70 transition-all duration-500`} />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br 
                        from-gray-100 to-gray-200 text-gray-400 text-6xl">
                        🌸
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                      <h3 className="text-white font-bold text-lg md:text-xl leading-tight mb-2
                        group-hover:scale-105 transition-transform duration-300 origin-left">
                        {category.name}
                      </h3>
                      {subtitle && (
                        <p className="text-white/85 text-sm md:text-base mb-3 leading-snug line-clamp-2">
                          {subtitle}
                        </p>
                      )}
                      <div className="inline-flex items-center gap-2 px-4 py-2.5 
                        bg-white/95 backdrop-blur-md text-gray-900 text-sm font-semibold rounded-full
                        opacity-0 group-hover:opacity-100 transform translate-y-3 group-hover:translate-y-0 
                        transition-all duration-500 shadow-xl border border-white/20">
                        <span>{ctaText}</span>
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Apple-style View All Button - High Contrast */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12 md:mt-16"
        >
          <Link 
            href="/kategoriler"
            className="inline-flex items-center gap-2.5 px-8 py-4 
              bg-gray-900 hover:bg-gray-800 text-white text-base font-semibold rounded-full
              transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 group
              border border-gray-800"
          >
            <span>Tüm Kategoriler</span>
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// Quick Category Pills - Horizontal scrollable pills
export function QuickCategoryPills() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategories(data.categories || data.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-6 bg-gradient-to-r from-primary-50 to-secondary-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Hızlı Erişim</h3>
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-4 py-2.5 bg-gray-200 rounded-full animate-pulse w-32 h-10" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 bg-gradient-to-r from-primary-50 to-secondary-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Hızlı Erişim</h3>
        <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none' }}>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/${category.slug}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-primary-500 hover:text-white rounded-full text-sm font-medium text-gray-700 whitespace-nowrap transition-all shadow-sm hover:shadow-md"
            >
              {category.image && (
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100">
                  <Image
                    src={category.image}
                    alt={category.name}
                    width={28}
                    height={28}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
