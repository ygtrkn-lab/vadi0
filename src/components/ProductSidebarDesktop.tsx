"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Share2, Check, Minus, Plus, Star, Package, Truck, AlertCircle } from "lucide-react";
import type { Product } from "@/data/products";
import DeliverySelector from "@/components/DeliverySelector";

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
  deliveryInfo,
  onDeliveryComplete,
  onDeliveryOpenSignal,
  showDeliveryWarning,
  onShare,
  onDeliverySignalChange,
}: ProductSidebarDesktopProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "delivery" | "support">("overview");

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(price);

  const savePercentage = product.oldPrice > product.price 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="hidden lg:flex flex-col gap-6 sticky top-32 max-w-md"
    >
      {/* Header section - Retina responsive */}
      <div className="rounded-3xl bg-white/90 backdrop-blur border border-slate-100 shadow-[0_18px_50px_rgba(15,23,42,0.08)] p-5 sm:p-6 space-y-4">
        {/* Title and wishlist */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <p className="text-xs text-slate-500 uppercase tracking-[0.14em] font-semibold">Ürün</p>
            <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-slate-900 leading-tight">{product.name}</h1>
            {product.sku && <p className="text-xs text-slate-400 font-medium">SKU: {product.sku}</p>}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onWishlistToggle}
            className={`h-11 w-11 lg:h-12 lg:w-12 rounded-2xl border flex items-center justify-center shadow-sm transition flex-shrink-0 ${
              isWishlisted
                ? "border-[#e05a4c] text-[#e05a4c] bg-[#e05a4c]/10"
                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-600"
            }`}
          >
            <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
          </motion.button>
        </div>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={i < Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                />
              ))}
            </div>
            <span className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{product.rating.toFixed(1)}</span> ({product.reviewCount} değerlendirme)
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
            <Check size={14} />
            Stokta
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            Hızlı teslimat
          </span>
          {product.deliveryInfo && (
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold truncate">
              {product.deliveryInfo}
            </span>
          )}
        </div>

        {/* Price section */}
        <div className="pt-2 space-y-2">
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-[#e05a4c]">{formatPrice(product.price)}</span>
            {product.oldPrice > product.price && (
              <div className="flex items-center gap-2">
                <span className="text-lg text-slate-400 line-through">{formatPrice(product.oldPrice)}</span>
                <span className="px-2 py-1 rounded-lg bg-[#e05a4c]/10 text-[#e05a4c] text-sm font-bold">
                  -{savePercentage}%
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-600 line-clamp-2">{product.description}</p>
        </div>
      </div>

      {/* Quantity and action buttons */}
      <div className="rounded-3xl bg-white/90 backdrop-blur border border-slate-100 shadow-[0_18px_50px_rgba(15,23,42,0.08)] p-6 space-y-4">
        {/* Quantity selector */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-900">Miktar</label>
          <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 w-fit">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="px-4 py-3 hover:bg-slate-100 rounded-l-2xl transition"
            >
              <Minus size={18} className="text-slate-600" />
            </motion.button>
            <span className="w-12 text-center font-bold text-slate-900">{quantity}</span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onQuantityChange(quantity + 1)}
              className="px-4 py-3 hover:bg-slate-100 rounded-r-2xl transition"
            >
              <Plus size={18} className="text-slate-600" />
            </motion.button>
          </div>
        </div>

        {/* Add to cart buttons */}
        <div className="space-y-3">
          <motion.button
            whileHover={canAddToCart ? { scale: 1.02 } : {}}
            whileTap={canAddToCart ? { scale: 0.98 } : {}}
            onClick={onAddToCart}
            disabled={!canAddToCart}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold text-white shadow-lg transition-all ${
              canAddToCart
                ? isAddedToCart
                  ? "bg-emerald-600"
                  : "bg-[#e05a4c] hover:shadow-xl hover:-translate-y-0.5"
                : "bg-slate-300 cursor-not-allowed"
            }`}
          >
            {isAddedToCart ? <Check size={20} /> : <ShoppingCart size={20} />}
            <span>{canAddToCart ? (isAddedToCart ? "Sepete Eklendi!" : "Sepete Ekle") : "Teslimat Seçin"}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onShare}
            className="w-full flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-base font-semibold text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            <Share2 size={20} />
            Paylaş
          </motion.button>
        </div>

        {/* Warning message */}
        <AnimatePresence>
          {showDeliveryWarning && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2 rounded-xl bg-[#e05a4c]/10 border border-[#e05a4c]/30 px-4 py-3"
            >
              <AlertCircle size={18} className="text-[#e05a4c] flex-shrink-0" />
              <p className="text-sm text-[#e05a4c] font-medium">Sepete eklemeden önce teslimat bilgisi seçin</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delivery section */}
      <div className="rounded-3xl bg-white/90 backdrop-blur border border-slate-100 shadow-[0_18px_50px_rgba(15,23,42,0.08)] p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Teslimat Bilgisi</h3>
        <DeliverySelector
          onDeliveryComplete={onDeliveryComplete}
          onOpenChange={() => {}}
          openSignal={0}
        />

        {/* Delivery info cards */}
        {deliveryInfo && deliveryInfo.location && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-blue-50 px-3 py-2">
                <p className="text-xs text-blue-600 font-semibold uppercase">Bölge</p>
                <p className="text-sm font-bold text-slate-900">{deliveryInfo.location}</p>
              </div>
              <div className="rounded-xl bg-purple-50 px-3 py-2">
                <p className="text-xs text-purple-600 font-semibold uppercase">İlçe</p>
                <p className="text-sm font-bold text-slate-900">{deliveryInfo.district || "Seçin"}</p>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-2 col-span-2">
                <p className="text-xs text-amber-600 font-semibold uppercase">Tarih</p>
                <p className="text-sm font-bold text-slate-900">
                  {deliveryInfo.date ? new Date(deliveryInfo.date).toLocaleDateString("tr-TR") : "Seçin"}
                </p>
              </div>
              {deliveryInfo.timeSlot && (
                <div className="rounded-xl bg-green-50 px-3 py-2 col-span-2">
                  <p className="text-xs text-green-600 font-semibold uppercase">Zaman Dilimi</p>
                  <p className="text-sm font-bold text-slate-900">{deliveryInfo.timeSlot}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Trust signals */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-4 py-3">
          <Truck size={20} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-slate-900 text-sm">Hızlı Teslimat</p>
            <p className="text-xs text-slate-600">Aynı gün / Ertesi gün</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 px-4 py-3">
          <Package size={20} className="text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-slate-900 text-sm">Özenli Paket</p>
            <p className="text-xs text-slate-600">Şık, sarsıntıya dayanıklı</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 px-4 py-3">
          <Check size={20} className="text-purple-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-slate-900 text-sm">Memnuniyet Garantisi</p>
            <p className="text-xs text-slate-600">Fotoğraf onayı ve destek</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
