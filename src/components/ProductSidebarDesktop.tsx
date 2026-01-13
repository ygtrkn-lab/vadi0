"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, Share2, Check, Minus, Plus, Star, Truck } from "lucide-react";
import type { Product } from "@/data/products";

interface ProductSidebarDesktopProps {
  product: Product;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  isWishlisted: boolean;
  onWishlistToggle: () => void;
  onAddToCart: () => void;
  isAddedToCart: boolean;
  canAddToCart: boolean;
  deliveryInfo: any;
  onDeliveryComplete: (info: any) => void;
  onDeliveryOpenSignal: (signal: number) => void;
  showDeliveryWarning: boolean;
  onShare: () => void;
  onDeliverySignalChange: (callback: (s: number) => number) => void;
}

export default function ProductSidebarDesktop({
  product,
  quantity,
  onQuantityChange,
  isWishlisted,
  onWishlistToggle,
  onAddToCart,
  isAddedToCart,
  canAddToCart,
  onShare,
}: ProductSidebarDesktopProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(price);

  const savePercentage = product.oldPrice > product.price 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <div className="hidden lg:block sticky top-28 max-w-[380px]">
      {/* Apple-style minimalist card */}
      <div className="space-y-6">
        {/* Product title */}
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight leading-snug">
            {product.name}
          </h1>
          
          {/* Rating inline */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < Math.round(product.rating) ? "fill-gray-900 text-gray-900" : "text-gray-300"}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {product.rating.toFixed(1)} ({product.reviewCount} değerlendirme)
              </span>
            </div>
          )}
        </div>

        {/* Price section - clean */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-gray-900 tracking-tight">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice > product.price && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(product.oldPrice)}
                </span>
                <span className="text-sm font-medium text-green-600">
                  %{savePercentage} indirim
                </span>
              </>
            )}
          </div>
          {product.inStock && (
            <p className="text-sm text-green-600 font-medium">Stokta mevcut</p>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Delivery info - minimal */}
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Truck size={18} className="text-gray-400" />
          <div>
            <span className="text-gray-900 font-medium">Aynı gün teslimat</span>
            <span className="text-gray-400 mx-1.5">·</span>
            <span>Sepette adres seçin</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Quantity - inline minimal */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">Adet</span>
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-40"
              disabled={quantity <= 1}
            >
              <Minus size={16} />
            </button>
            <span className="w-10 text-center text-sm font-medium text-gray-900">{quantity}</span>
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Action buttons - clean */}
        <div className="space-y-3 pt-2">
          {/* Primary CTA */}
          <motion.button
            whileTap={canAddToCart ? { scale: 0.98 } : {}}
            onClick={onAddToCart}
            disabled={!canAddToCart}
            className={`w-full h-12 rounded-xl text-[15px] font-medium transition-all ${
              canAddToCart
                ? isAddedToCart
                  ? "bg-gray-900 text-white"
                  : "bg-[#0071e3] text-white hover:bg-[#0077ED]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {canAddToCart ? (isAddedToCart ? "Sepete Eklendi ✓" : "Sepete Ekle") : "Stokta Yok"}
          </motion.button>

          {/* Secondary actions */}
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onWishlistToggle}
              className={`flex-1 h-11 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
                isWishlisted
                  ? "border-red-200 bg-red-50 text-red-600"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
              <span>{isWishlisted ? "Favorilerde" : "Favorilere Ekle"}</span>
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onShare}
              className="h-11 w-11 rounded-xl border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all flex items-center justify-center"
            >
              <Share2 size={16} />
            </motion.button>
          </div>
        </div>

        {/* Subtle trust indicators */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Check size={12} className="text-green-500" />
              Ücretsiz kargo
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={12} className="text-green-500" />
              Güvenli ödeme
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={12} className="text-green-500" />
              Taze kesim
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
