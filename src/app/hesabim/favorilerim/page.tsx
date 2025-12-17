'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useCustomer } from '@/context/CustomerContext';
import { useCart } from '@/context/CartContext';
import { products } from '@/data/products';
import { FadeIn, SpotlightCard, GlassCard, ShimmerButton } from '@/components/ui-kit/premium';
import {
  HiOutlineHeart,
  HiOutlineShoppingCart,
  HiOutlineTrash,
  HiHeart,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineShare,
  HiOutlineExternalLink,
  HiOutlinePhotograph,
} from 'react-icons/hi';

export default function FavorilerimPage() {
  const { state: customerState, removeFromFavorites } = useCustomer();
  const { addToCart } = useCart();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [removingId, setRemovingId] = useState<number | null>(null);

  const customer = customerState.currentCustomer;
  if (!customer) return null;

  // Favori ürünleri getir
  const favoriteProducts = products.filter(
    product => customer.favorites.includes(String(product.id))
  );

  const handleRemoveFavorite = async (productId: number) => {
    setRemovingId(productId);
    // Küçük delay ile animasyon için
    setTimeout(() => {
      removeFromFavorites(customer.id, String(productId));
      setRemovingId(null);
    }, 300);
  };

  const handleAddToCart = (product: typeof products[0]) => {
    addToCart(product);
  };

  const handleShare = async (product: typeof products[0]) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `${product.name} - Vadiler Çiçek'te ₺${product.price}`,
          url: `${window.location.origin}/${product.category}/${product.slug}`,
        });
      } catch {
        // User cancelled
      }
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header with View Toggle */}
      <FadeIn direction="down">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <HiHeart className="w-7 h-7 text-pink-500" />
              <span>Favorilerim</span>
            </h1>
            <p className="text-gray-500 mt-1">{favoriteProducts.length} ürün</p>
          </div>

          {favoriteProducts.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white shadow-sm text-black' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <HiOutlineViewGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === 'list' 
                    ? 'bg-white shadow-sm text-black' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <HiOutlineViewList className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </FadeIn>

      {/* Favorites Grid/List */}
      {favoriteProducts.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              <AnimatePresence mode="popLayout">
                {favoriteProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: removingId === product.id ? 0 : 1, 
                      scale: removingId === product.id ? 0.8 : 1 
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <SpotlightCard spotlightColor="rgba(224, 90, 76, 0.15)">
                      <div className="bg-white rounded-2xl overflow-hidden">
                        {/* Image */}
                        <div className="relative aspect-square bg-gray-100">
                          <Link href={`/${product.category}/${product.slug}`}>
                            {product.image ? (
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <HiOutlinePhotograph className="w-16 h-16 text-gray-400" />
                              </div>
                            )}
                          </Link>
                          
                          {/* Favorite Button - Animated Heart */}
                          <motion.button
                            onClick={() => handleRemoveFavorite(product.id)}
                            whileTap={{ scale: 0.8 }}
                            className="absolute top-2 right-2 w-9 h-9 bg-white/90 backdrop-blur-sm 
                              rounded-full flex items-center justify-center shadow-lg 
                              hover:bg-gray-100 transition-colors"
                          >
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              <HiHeart className="w-5 h-5 text-red-500" />
                            </motion.div>
                          </motion.button>

                          {/* Share Button */}
                          <button
                            onClick={() => handleShare(product)}
                            className="absolute top-2 left-2 w-9 h-9 bg-white/90 backdrop-blur-sm 
                              rounded-full flex items-center justify-center shadow-lg 
                              hover:bg-gray-100 transition-colors"
                          >
                            <HiOutlineShare className="w-4 h-4 text-gray-600" />
                          </button>

                          {/* Discount Badge */}
                          {product.oldPrice && (
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-gradient-to-r 
                              from-gray-800 to-gray-900 text-white text-xs font-bold rounded-lg">
                              %{Math.round((1 - product.price / product.oldPrice) * 100)}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-3">
                          <Link href={`/${product.category}/${product.slug}`}>
                            <h3 className="font-medium text-gray-800 text-sm line-clamp-2 
                              hover:text-black transition-colors mb-2 min-h-[40px]">
                              {product.name}
                            </h3>
                          </Link>

                          {/* Price */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg font-bold text-black">
                              ₺{product.price.toLocaleString('tr-TR')}
                            </span>
                            {product.oldPrice && (
                              <span className="text-xs text-gray-400 line-through">
                                ₺{product.oldPrice.toLocaleString('tr-TR')}
                              </span>
                            )}
                          </div>

                          {/* Add to Cart Button */}
                          <motion.button
                            onClick={() => handleAddToCart(product)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 
                              bg-gradient-to-r from-[#e05a4c] to-[#d54a3c] text-white text-sm 
                              font-medium rounded-xl shadow-lg shadow-[#e05a4c]/25 
                              hover:shadow-xl hover:shadow-[#e05a4c]/30 transition-all"
                          >
                            <HiOutlineShoppingCart className="w-4 h-4" />
                            Sepete Ekle
                          </motion.button>
                        </div>
                      </div>
                    </SpotlightCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            // List View
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {favoriteProducts.map((product, index) => (
                  <FadeIn key={product.id} direction="left" delay={index * 0.05}>
                    <motion.div
                      layout
                      animate={{ 
                        opacity: removingId === product.id ? 0 : 1,
                        x: removingId === product.id ? 100 : 0
                      }}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
                    >
                      <div className="flex items-center gap-3 p-3">
                        {/* Image */}
                        <Link href={`/${product.category}/${product.slug}`} className="flex-shrink-0">
                          <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-gray-100">
                            {product.image ? (
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <HiOutlinePhotograph className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                            {/* Discount Badge */}
                            {product.oldPrice && (
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black 
                                text-white text-[10px] font-bold rounded">
                                %{Math.round((1 - product.price / product.oldPrice) * 100)}
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/${product.category}/${product.slug}`}>
                            <h3 className="font-medium text-gray-800 text-sm md:text-base 
                              line-clamp-2 hover:text-black transition-colors">
                              {product.name}
                            </h3>
                          </Link>

                          {/* Price */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-bold text-black">
                              ₺{product.price.toLocaleString('tr-TR')}
                            </span>
                            {product.oldPrice && (
                              <span className="text-sm text-gray-400 line-through">
                                ₺{product.oldPrice.toLocaleString('tr-TR')}
                              </span>
                            )}
                          </div>

                          {/* Actions - Mobile */}
                          <div className="flex items-center gap-2 mt-2 md:hidden">
                            <motion.button
                              onClick={() => handleAddToCart(product)}
                              whileTap={{ scale: 0.95 }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 
                                bg-black text-white text-xs font-medium rounded-lg"
                            >
                              <HiOutlineShoppingCart className="w-4 h-4" />
                              Sepete Ekle
                            </motion.button>
                            <button
                              onClick={() => handleRemoveFavorite(product.id)}
                              className="w-9 h-9 flex items-center justify-center border border-gray-200 
                                rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors"
                            >
                              <HiOutlineTrash className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </div>

                        {/* Actions - Desktop */}
                        <div className="hidden md:flex items-center gap-2">
                          <motion.button
                            onClick={() => handleAddToCart(product)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r 
                              from-[#e05a4c] to-[#d54a3c] text-white text-sm font-medium 
                              rounded-xl shadow-lg shadow-[#e05a4c]/25"
                          >
                            <HiOutlineShoppingCart className="w-5 h-5" />
                            Sepete Ekle
                          </motion.button>
                          <Link href={`/${product.category}/${product.slug}`}>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="w-11 h-11 flex items-center justify-center border border-gray-200 
                                rounded-xl hover:bg-gray-50 transition-colors"
                            >
                              <HiOutlineExternalLink className="w-5 h-5 text-gray-500" />
                            </motion.button>
                          </Link>
                          <motion.button
                            onClick={() => handleRemoveFavorite(product.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-11 h-11 flex items-center justify-center border border-gray-200 
                              rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-colors group"
                          >
                            <HiOutlineTrash className="w-5 h-5 text-gray-400 group-hover:text-black" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  </FadeIn>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Info Card */}
          <FadeIn delay={0.3}>
            <GlassCard className="p-4 md:p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 
                  rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💡</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Favori İpucu</h3>
                  <p className="text-sm text-gray-600">
                    Favorileriniz hesabınızla senkronize edilir. Herhangi bir cihazdan 
                    giriş yaparak favorilerinize ulaşabilirsiniz.
                  </p>
                </div>
              </div>
            </GlassCard>
          </FadeIn>
        </>
      ) : (
        // Empty State
        <FadeIn>
          <GlassCard className="p-8 md:p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
              className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 
                rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <HiOutlineHeart className="w-12 h-12 text-rose-400" />
              </motion.div>
            </motion.div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Favori listeniz boş
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Beğendiğiniz ürünlerin kalp ikonuna dokunarak favorilerinize ekleyin ve 
              daha sonra kolayca ulaşın.
            </p>
            <Link href="/kategoriler">
              <ShimmerButton>
                <HiOutlineShoppingCart className="w-5 h-5" />
                <span>Ürünleri Keşfet</span>
              </ShimmerButton>
            </Link>
          </GlassCard>
        </FadeIn>
      )}
    </div>
  );
}
