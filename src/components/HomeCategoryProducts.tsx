'use client';

import { useState, useRef, useEffect, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { Heart, ShoppingCart, ChevronRight, ChevronLeft, Star, Truck, Gift, Clock, Check, Play } from 'lucide-react';
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

// Optimize poster URL with Cloudinary transformations for responsive sizing
function optimizePosterUrl(url: string, width: number = 400): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  // Add responsive sizing transformation
  const transformations = `w_${width},h_${width},c_fill,f_auto,q_auto`;
  return url.replace('/upload/', `/upload/${transformations}/`);
}

interface HomeCategoryProductsProps {
  categorySlug: string;
  title: string;
  limit?: number;
  showViewAll?: boolean;
  variant?: 'default' | 'featured' | 'compact';
}

// Enhanced Product Card for Homepage - Çiçeksepeti Style
export function ProductCardEnhanced({ product, index }: { product: Product; index: number }) {
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
                poster={optimizePosterUrl(product.hoverImage || product.gallery?.[0] || '', 420)}
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
            disabled={!product.inStock || isAddedToCart}
            className={`w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-200
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300
              ${!product.inStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isAddedToCart
                  ? 'bg-gray-100 text-gray-600'
                  : 'border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
              }`}
          >
            {!product.inStock ? (
              <>
                <ShoppingCart size={16} />
                Stokta Yok
              </>
            ) : isAddedToCart ? (
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
        
        // Filter by category and shuffle for variety
        const categoryFiltered = allProducts.filter((p: Product) => p.category === categorySlug);
        const shuffled = [...categoryFiltered].sort(() => Math.random() - 0.5);
        const filtered = shuffled.slice(0, limit);
        
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

// Homepage Category Product Bands - Beautiful Product Sections by Category
export function HomeCategoryProductBands() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories?hasProducts=true')
        ]);
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();
        setProducts(productsData.products || productsData.data || []);
        setCategories(categoriesData.categories || categoriesData.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter categories that have products and limit to top 6
  const categoriesWithProducts = categories
    .filter(cat => products.some(p => p.category === cat.slug))
    .slice(0, 6);

  if (loading) {
    return (
      <section className="py-8 md:py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-10">
              <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-4" />
              <div className="flex gap-4 overflow-hidden">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="w-[200px] flex-shrink-0 bg-gray-200 rounded-2xl animate-pulse h-[320px]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (categoriesWithProducts.length === 0) return null;

  return (
    <section className="py-8 md:py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="space-y-8 md:space-y-12">
        {categoriesWithProducts.map((category, index) => (
          <div 
            key={category.slug}
            className={index % 2 === 0 ? 'bg-white' : 'bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80'}
          >
            <HomeCategoryProducts
              categorySlug={category.slug}
              title={category.name}
              limit={10}
              showViewAll={true}
            />
          </div>
        ))}
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

// Featured Large Banner Grid - Modern Minimal Style
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

  if (loading) {
    return (
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-14">
            <div className="h-10 w-56 bg-gray-100 rounded-lg animate-pulse mx-auto mb-4" />
            <div className="h-5 w-80 bg-gray-50 rounded animate-pulse mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-3xl overflow-hidden bg-gray-100 animate-pulse">
                <div className="aspect-[4/5]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-white via-gray-50/30 to-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header - Clean & Modern */}
        <div className="text-center mb-10 md:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-6"
          >
            <span className="w-2 h-2 bg-gray-900 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-700">Popüler Kategoriler</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight"
          >
            Kategoriler
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-500 text-base md:text-lg max-w-xl mx-auto"
          >
            Her anınıza özel çiçekler. <span className="text-gray-900 font-medium">Bugün keşfedin.</span>
          </motion.p>
        </div>

        {/* Modern Category Cards Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {featuredCategories.map((category, index) => {
            const coverImage = category.coverImage || category.coverMobileImage || category.image;
            const coverType = category.coverType === 'video' && category.coverVideo ? 'video' : 'image';
            
            return (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.08,
                  ease: "easeOut"
                }}
              >
                <Link 
                  href={`/${category.slug}`}
                  className="group block relative rounded-3xl overflow-hidden bg-gray-100
                    shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {/* Background Media */}
                    {coverType === 'video' && category.coverVideo ? (
                      <video
                        src={category.coverVideo}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="none"
                        poster={optimizePosterUrl(coverImage || '', 400)}
                        className="absolute inset-0 w-full h-full object-cover 
                          group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    ) : coverImage ? (
                      <Image
                        src={coverImage}
                        alt={category.name}
                        fill
                        loading="lazy"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        quality={80}
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center 
                        bg-gradient-to-br from-gray-200 to-gray-300 text-gray-400 text-6xl">
                        🌸
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent 
                      opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-4">
                      {/* Category Name */}
                      <h3 className="text-white font-bold text-base md:text-lg leading-tight mb-1.5
                        transform group-hover:translate-y-0 translate-y-1 transition-transform duration-500">
                        {category.name}
                      </h3>
                      
                      {/* CTA - Minimal text link */}
                      <span className="text-white/80 text-xs font-medium flex items-center gap-1
                        group-hover:text-white transition-colors duration-300">
                        Keşfet
                        <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* View All - Animated underline link */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-8 md:mt-10"
        >
          <Link 
            href="/kategoriler"
            className="group inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-300"
          >
            <span className="relative text-sm font-medium">
              Tüm kategoriler
              <span className="absolute left-0 -bottom-0.5 w-0 h-[1.5px] bg-gray-900 
                group-hover:w-full transition-all duration-300 ease-out" />
            </span>
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 
              group-hover:bg-gray-900 group-hover:text-white transition-all duration-300">
              <ChevronRight size={14} />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// Quick Category Pills - Modern Grid Layout
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
      <section className="py-10 md:py-14 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mx-auto mb-3" />
            <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mx-auto" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 md:py-14 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Hızlı Erişim
          </h2>
          <p className="text-gray-500 text-sm md:text-base">
            Aradığınız kategoriye hızlıca ulaşın
          </p>
        </motion.div>

        {/* Category Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
        >
          {categories.slice(0, 10).map((category, index) => (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link
                href={`/${category.slug}`}
                className="group flex items-center gap-3 p-3 md:p-4 bg-white hover:bg-gray-900 
                  rounded-2xl border border-gray-100 hover:border-gray-900
                  shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Category Image */}
                <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden flex-shrink-0 
                  bg-gradient-to-br from-gray-100 to-gray-50 group-hover:from-gray-800 group-hover:to-gray-700 
                  transition-all duration-300 shadow-sm">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="56px"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🌸
                    </div>
                  )}
                </div>

                {/* Category Name */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm md:text-base font-semibold text-gray-800 group-hover:text-white 
                    truncate transition-colors duration-300">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300 hidden sm:block">
                    Keşfet →
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Link */}
        {categories.length > 10 && (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-8"
          >
            <Link 
              href="/kategoriler"
              className="inline-flex items-center gap-2 px-6 py-3 
                bg-gray-100 hover:bg-gray-900 text-gray-700 hover:text-white 
                text-sm font-semibold rounded-full transition-all duration-300 
                hover:shadow-lg group"
            >
              <span>Tüm Kategorileri Gör</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
