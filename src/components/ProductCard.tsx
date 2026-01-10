'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Eye, Star, Check, Play } from 'lucide-react';
import type { Product } from '@/data/products';
import { useCustomer } from '@/context/CustomerContext';
import { useCart } from '@/context/CartContext';
import { useCategoryNames } from '@/hooks/useCategoryNames';
import { useVideoLazyLoad } from '@/hooks/useVideoLazyLoad';

// URL'den medya türünü belirle
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

interface ProductCardProps {
  product: Product;
  index?: number;
  priority?: boolean; // İlk görünen ürünler için priority loading
}

export default function ProductCard({ product, index = 0, priority = false }: ProductCardProps) {
  const { state: customerState, addToFavorites, removeFromFavorites, isFavorite } = useCustomer();
  const { addToCart } = useCart();
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const { getName } = useCategoryNames();
  const { ref: videoRef, shouldLoad: shouldLoadVideo } = useVideoLazyLoad();

  const customer = customerState.currentCustomer;
  const isMainVideo = getMediaType(product.image) === 'video';
  const isWishlisted = customer ? isFavorite(customer.id, String(product.id)) : false;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.inStock) {
      addToCart(product);
      setIsAddedToCart(true);
      setTimeout(() => setIsAddedToCart(false), 2000);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!customer) {
      // Giriş yapılmamışsa giriş sayfasına yönlendir
      window.location.href = '/giris?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    if (isWishlisted) {
      removeFromFavorites(customer.id, String(product.id));
    } else {
      addToFavorites(customer.id, String(product.id));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const WEEKLY_CAMPAIGN_SLUG = 'haftanin-cicek-kampanyalari-vadiler-com';
  const isWeeklyCampaign =
    product.category === WEEKLY_CAMPAIGN_SLUG || (product.categories || []).includes(WEEKLY_CAMPAIGN_SLUG);

  const categoryLabel = product.categoryName || getName(product.category, product.category.replace(/-/g, ' '));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="product-card group relative overflow-hidden rounded-2xl sm:rounded-2xl lg:rounded-3xl border border-gray-200/60 bg-white shadow-soft-lg"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-secondary-50/30" />
      <Link href={`/${product.category}/${product.slug}`} className="relative block">
        {/* Image Container */}
        <div className="relative aspect-[4/5] mx-2 mt-2 overflow-hidden rounded-xl bg-gradient-to-b from-gray-50 to-white border border-white/50 shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent z-[1]" />

          {/* Weekly campaign badge */}
          {isWeeklyCampaign && (
            <div className="absolute left-2 top-10 sm:top-12 z-20">
              <picture>
                <source srcSet="/TR/bugune-ozel.webp 1x, /TR/bugune-ozel@2x.webp 2x" type="image/webp" />
                <img
                  src="/TR/bugune-ozel.png"
                  alt="Bugüne Özel"
                  width="72"
                  height="72"
                  className="h-14 w-14 sm:h-16 sm:w-16 drop-shadow"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </div>
          )}

          {/* Main Image or Video */}
          {isMainVideo ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={shouldLoadVideo ? product.image : undefined}
                className="product-image w-full h-full object-cover rounded-xl cursor-pointer"
                loop
                muted
                playsInline
                autoPlay={shouldLoadVideo}
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
                  <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                    <Play size={20} className="text-white ml-1" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Image
                src={imageError ? '/placeholder-flower.jpg' : product.image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="product-image object-cover rounded-xl"
                onError={() => setImageError(true)}
                priority={priority} // İlk 4-6 ürün için priority
                loading={priority ? undefined : 'lazy'}
              />
              
              {/* Hover Image */}
              {product.hoverImage && !imageError && (
                <Image
                  src={product.hoverImage}
                  alt={`${product.name} - hover`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  loading="lazy"
                  className="product-image-hover object-cover rounded-xl"
                />
              )}
            </>
          )}

          {/* Badges */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1.5 z-20">
            {product.discount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/90 px-2 py-1 text-[10px] font-semibold text-primary-700 shadow-soft backdrop-blur-sm">
                <span className="h-1 w-1 rounded-full bg-primary-500" />
                -%{product.discount}
              </span>
            )}
            {!product.inStock && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-black/80 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                Tükendi
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 sm:top-3 right-2 sm:right-3 flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 active:scale-95 z-20 transform hover:scale-110
              ${isWishlisted 
                ? 'bg-red-500 text-white border-red-500 shadow-glow scale-110 animate-pulse' 
                : 'bg-white/90 text-gray-700 border-white/60 backdrop-blur-sm hover:bg-red-50 hover:text-red-500 hover:border-red-200'
              }`}
            aria-label={isWishlisted ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            <Heart 
              size={16} 
              className="sm:w-[18px] sm:h-[18px] transition-all duration-300" 
              fill={isWishlisted ? 'currentColor' : 'none'} 
            />
          </button>

          {/* Desktop Quick Actions - Hover only */}
          <div className="product-actions hidden sm:flex absolute bottom-3 left-3 right-3 items-center gap-1.5 z-20">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-all duration-200 active:scale-[0.98] backdrop-blur-md
                ${isAddedToCart 
                  ? 'bg-green-50/95 text-green-700 border-green-200 shadow-md' 
                  : 'bg-white/95 text-gray-800 border-gray-200 hover:bg-gray-50 shadow-md'
                }
                ${!product.inStock ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isAddedToCart ? (
                <>
                  <Check size={14} />
                  <span>Eklendi</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={14} />
                  <span>Sepete Ekle</span>
                </>
              )}
            </button>
            
            <button className="flex h-[36px] w-[36px] items-center justify-center rounded-lg bg-white/95 text-gray-700 border border-gray-200 backdrop-blur-md transition-all duration-200 hover:text-primary-600 hover:bg-gray-50 shadow-md">
              <Eye size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-2 p-3 sm:p-4 lg:p-5">
          {/* Category Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[10px] font-medium text-gray-600 backdrop-blur-sm">
            <span className="h-1 w-1 rounded-full bg-primary-500" />
            <span className="truncate">{categoryLabel}</span>
          </div>

          {/* Title */}
          <h3 className="line-clamp-2 text-sm sm:text-base font-semibold leading-snug text-gray-900 transition-colors duration-200 group-hover:text-primary-600">
            {product.name}
          </h3>

          {/* Rating & Stock */}
          <div className="flex items-center justify-between gap-2 flex-nowrap">
            <div className="flex items-center gap-1 text-sm flex-shrink-0">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={`${i < product.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                />
              ))}
              <span className="text-[10px] text-gray-500 ml-0.5">{product.rating}.0</span>
            </div>
            <div className={`text-[10px] font-medium whitespace-nowrap flex-shrink-0 ${product.inStock ? 'text-green-600' : 'text-gray-500'}`}>
              {product.inStock ? '✓ Stokta' : 'Stokta yok'}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">{formatPrice(product.price)}</span>
            {product.discount > 0 && product.oldPrice && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>
            )}
          </div>

          {/* Mobile Add to Cart - Minimal */}
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={`sm:hidden w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 active:scale-[0.98] border
              ${isAddedToCart 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-white text-gray-800 border-gray-200 active:bg-gray-50'
              }
              ${!product.inStock ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {isAddedToCart ? (
              <>
                <Check size={14} />
                <span>Eklendi</span>
              </>
            ) : (
              <>
                <ShoppingCart size={14} />
                <span>Sepete Ekle</span>
              </>
            )}
          </button>
        </div>
      </Link>
    </motion.div>
  );
}
