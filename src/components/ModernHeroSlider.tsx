'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, Play } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/effect-fade';

// URL'den medya türünü belirle (ProductCard ile aynı mantık)
function getMediaType(url: string): 'image' | 'video' | 'unknown' {
  if (!url) return 'unknown';
  const lowered = url.toLowerCase();
  if (lowered.includes('.mp4') || lowered.includes('.webm') || lowered.includes('.mov') || lowered.includes('/video/')) {
    return 'video';
  }
  if (lowered.includes('.jpg') || lowered.includes('.jpeg') || lowered.includes('.png') || lowered.includes('.gif') || lowered.includes('.webp') || lowered.includes('/image/')) {
    return 'image';
  }
  return 'unknown';
}

// Cloudinary poster URL optimizasyonu
function optimizePosterUrl(url: string, width: number = 200): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  const transformations = `w_${width},h_${width},c_fill,f_auto,q_auto`;
  return url.replace('/upload/', `/upload/${transformations}/`);
}

interface Product {
  id: number;
  slug: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  hoverImage?: string;
  hoverVideo?: string;
  gallery?: string[];
  discount: number;
  category: string;
}

interface ModernHeroSliderProps {
  id?: string;
}

// Background images from Cloudinary
const BACKGROUND_IMAGES = [
  'https://res.cloudinary.com/dgdl1vdao/image/upload/f_auto,q_80,w_1920/v1768212209/vadiler/hero-backgrounds/1.webp',
  'https://res.cloudinary.com/dgdl1vdao/image/upload/f_auto,q_80,w_1920/v1768212209/vadiler/hero-backgrounds/2.webp',
  'https://res.cloudinary.com/dgdl1vdao/image/upload/f_auto,q_80,w_1920/v1768212209/vadiler/hero-backgrounds/3.webp',
  'https://res.cloudinary.com/dgdl1vdao/image/upload/f_auto,q_80,w_1920/v1768212209/vadiler/hero-backgrounds/4.webp',
  'https://res.cloudinary.com/dgdl1vdao/image/upload/f_auto,q_80,w_1920/v1768212209/vadiler/hero-backgrounds/5.webp',
  'https://res.cloudinary.com/dgdl1vdao/image/upload/f_auto,q_80,w_1920/v1768212209/vadiler/hero-backgrounds/6.webp',
  'https://res.cloudinary.com/dgdl1vdao/image/upload/f_auto,q_80,w_1920/v1768212209/vadiler/hero-backgrounds/7.webp',
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export default function ModernHeroSlider({ id }: ModernHeroSliderProps) {
  const [, setBackgroundSwiper] = useState<SwiperType | null>(null);
  const productScrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch campaign products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?category=haftanin-cicek-kampanyalari-vadiler-com&inStock=true&limit=16');
        const data = await res.json();
        if (data.products) {
          // Video ürünlerini debug için logla
          const videoProducts = data.products.filter((p: Product) => getMediaType(p.image) === 'video');
          console.log('🎬 Products with video image:', videoProducts.map((p: Product) => ({ name: p.name, image: p.image })));
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Failed to fetch campaign products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Auto-rotate backgrounds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollProducts = (direction: 'left' | 'right') => {
    if (!productScrollRef.current) return;
    const scrollAmount = 300;
    productScrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section id={id} className="relative mt-[96px] lg:mt-[120px] pt-8 lg:pt-12 min-h-[480px] lg:min-h-[560px] overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background Image Slider */}
      <div className="absolute inset-0 z-0">
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          loop
          speed={1500}
          onSwiper={setBackgroundSwiper}
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          className="h-full w-full"
        >
          {BACKGROUND_IMAGES.map((img, index) => (
            <SwiperSlide key={index}>
              <div className="relative h-full w-full">
                <Image
                  src={img}
                  alt={`Vadiler Çiçek - Arka Plan ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="100vw"
                />
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Bottom Soft Fade to White - Multi-layer for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 z-[5] pointer-events-none">
        <div className="h-48 lg:h-64 bg-gradient-to-t from-white/5 to-transparent" />
        <div className="h-40 lg:h-52 -mt-40 lg:-mt-52 bg-gradient-to-t from-white/15 to-transparent" />
        <div className="h-32 lg:h-40 -mt-32 lg:-mt-40 bg-gradient-to-t from-white/30 to-transparent" />
        <div className="h-24 lg:h-32 -mt-24 lg:-mt-32 bg-gradient-to-t from-white/50 to-transparent" />
        <div className="h-16 lg:h-20 -mt-16 lg:-mt-20 bg-gradient-to-t from-white/70 to-transparent" />
        <div className="h-8 lg:h-12 -mt-8 lg:-mt-12 bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-8 lg:pb-12">
        {/* Title & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="px-4 lg:px-8 mb-6 lg:mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-white/10 backdrop-blur-sm mb-4">
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
            <span className="text-sm text-white/90 font-medium">🌸 İstanbul Çiçek Siparişi</span>
          </div>
          <h1 className="text-2xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 lg:mb-3 drop-shadow-2xl leading-tight">
            İstanbul&apos;a Çiçek Sipariş Et <br className="hidden lg:block" />
            <span className="bg-gradient-to-r from-primary-300 to-secondary-300 bg-clip-text text-transparent">Aynı Gün Teslimat</span>
          </h1>
          <p className="text-sm lg:text-lg text-white/70 max-w-xl">
            Online çiçek siparişi ile İstanbul&apos;un her semtine <strong className="text-white/90">aynı gün ücretsiz teslimat</strong>. Taze çiçekler, uygun fiyatlar.
          </p>
        </motion.div>

        {/* Product Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          {/* Navigation - Desktop */}
          <div className="hidden lg:flex items-center justify-between mb-3 px-4 lg:px-8">
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollProducts('left')}
                className="group w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all duration-300"
                aria-label="Önceki"
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => scrollProducts('right')}
                className="group w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all duration-300"
                aria-label="Sonraki"
              >
                <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <div className="ml-2 text-xs text-white/60">
                {isLoading ? '...' : `${products.length} kampanyalı ürün`}
              </div>
            </div>
            
            <Link
              href="/haftanin-cicek-kampanyalari-vadiler-com"
              className="group flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-semibold transition-all duration-300 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105"
            >
              <span>Tümünü Gör</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Products */}
          <div
            ref={productScrollRef}
            className="flex gap-4 lg:gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 lg:mx-0 lg:px-8 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="relative bg-white/5 backdrop-blur-xl rounded-xl overflow-hidden border border-white/10 h-full w-[180px] lg:w-[200px] animate-pulse"
                >
                  <div className="aspect-square bg-white/10" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-4 bg-white/10 rounded w-1/2" />
                    <div className="h-6 bg-white/10 rounded w-1/3" />
                  </div>
                </div>
              ))
            ) : products.map((product, index) => (
              <Link
                key={product.id}
                href={`/${product.category}/${product.slug}`}
                className="group snap-center"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.03 }}
                  className="relative rounded-2xl overflow-hidden h-full w-[170px] lg:w-[190px]"
                >
                  {/* Glassmorphism Card Background */}
                  <div className="absolute inset-0 bg-white/[0.08] backdrop-blur-2xl border border-white/[0.15] rounded-2xl" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-transparent to-white/[0.05] rounded-2xl" />
                  
                  {/* Hover Glow Effect */}
                  <div className="absolute -inset-px bg-gradient-to-br from-primary-400/0 via-primary-400/0 to-secondary-400/0 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:from-primary-400/20 group-hover:via-primary-400/10 group-hover:to-secondary-400/20 transition-all duration-500 blur-sm" />
                  
                  <div className="relative z-10">
                    {/* Product Image/Video */}
                    <div className="relative aspect-[4/5] overflow-hidden rounded-t-2xl">
                      {/* Ana görsel video ise */}
                      {getMediaType(product.image) === 'video' ? (
                        <>
                          <video
                            src={product.image}
                            poster={product.gallery?.[0] ? optimizePosterUrl(product.gallery[0], 200) : undefined}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="none"
                          />
                          {/* Video Badge - Modern */}
                          <div className="absolute bottom-2.5 left-2.5 z-10 px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-full flex items-center gap-1.5 border border-white/10">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-[9px] text-white/90 font-semibold uppercase tracking-wide">Video</span>
                          </div>
                        </>
                      ) : product.hoverVideo && product.hoverVideo.startsWith('http') ? (
                        <>
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 170px, 190px"
                            className="object-cover group-hover:opacity-0 transition-opacity duration-500"
                            priority={index < 3}
                          />
                          <video
                            src={product.hoverVideo}
                            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="none"
                          />
                          {/* Video Badge */}
                          <div className="absolute bottom-2.5 left-2.5 z-10 px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-full flex items-center gap-1.5 border border-white/10">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-[9px] text-white/90 font-semibold uppercase tracking-wide">Video</span>
                          </div>
                        </>
                      ) : product.hoverImage ? (
                        <>
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 170px, 190px"
                            className="object-cover group-hover:opacity-0 group-hover:scale-105 transition-all duration-500"
                            priority={index < 3}
                          />
                          <Image
                            src={product.hoverImage}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 170px, 190px"
                            className="object-cover opacity-0 group-hover:opacity-100 scale-105 group-hover:scale-100 transition-all duration-500"
                          />
                        </>
                      ) : (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 170px, 190px"
                          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          priority={index < 3}
                        />
                      )}
                      
                      {/* Discount Badge - Modern Pill */}
                      {product.discount > 0 && (
                        <div className="absolute top-2.5 right-2.5 z-10">
                          <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold shadow-lg shadow-rose-500/30 border border-white/20">
                            %{product.discount} İndirim
                          </div>
                        </div>
                      )}

                      {/* Subtle overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                    </div>

                    {/* Info Section - Modern Glass */}
                    <div className="p-3.5 relative">
                      {/* Product Name */}
                      <h3 className="text-white/95 font-medium text-[13px] leading-tight mb-2 line-clamp-2 min-h-[36px] group-hover:text-white transition-colors duration-300">
                        {product.name}
                      </h3>
                      
                      {/* Price Section */}
                      <div className="flex items-end justify-between gap-2">
                        <div className="flex flex-col">
                          {product.oldPrice && product.oldPrice > product.price && (
                            <span className="text-[10px] text-white/35 line-through mb-0.5">
                              {formatPrice(product.oldPrice)}
                            </span>
                          )}
                          <span className="text-lg font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        
                        {/* Quick View Button */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 border border-white/20 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          <ArrowRight size={14} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Mobile: Tümünü Gör Button */}
          <div className="lg:hidden mt-4 text-center px-4">
            <Link
              href="/haftanin-cicek-kampanyalari-vadiler-com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold transition-all duration-300 shadow-lg shadow-primary-500/30 active:scale-95"
            >
              <span>Tümünü Gör</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>

        {/* Progress Dots */}
        <div className="hidden lg:flex justify-center gap-1.5 mt-4">
          {BACKGROUND_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? 'w-8 bg-primary-400'
                  : 'w-1.5 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Arka plan ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: products.map((product, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'Product',
                name: product.name,
                image: product.image,
                offers: {
                  '@type': 'Offer',
                  price: product.price,
                  priceCurrency: 'TRY',
                  availability: 'https://schema.org/InStock',
                },
              },
            })),
          }),
        }}
      />
    </section>
  );
}
