"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Share2, Check, Minus, Plus, Star, Package, Truck, AlertCircle } from "lucide-react";
import type { Product } from "@/data/products";
import DeliverySelectorV2 from "@/components/DeliverySelectorV2";

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
      {/* Header section - Retina responsive - Amazon premium */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-[0_4px_20px_rgba(15,23,42,0.08)] p-6 space-y-4 sticky top-28 z-20">
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
            className={`h-11 w-11 lg:h-12 lg:w-12 rounded-2xl border-2 flex items-center justify-center shadow-sm transition flex-shrink-0 ${
              isWishlisted
                ? "border-[#e05a4c] text-[#e05a4c] bg-[#e05a4c]/5"
                : "border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-500"
            }`}
          >
            <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
          </motion.button>
        </div>

        {/* Rating - more prominent */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={i < Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                />
              ))}
            </div>
            <span className="text-sm text-slate-700 font-semibold">
              <span className="text-[#e05a4c]">{product.rating.toFixed(1)}</span> ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Status badges - Amazon style */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">
            <p className="text-xs text-green-700 font-bold uppercase">Stokta</p>
            <p className="text-sm text-green-900 font-semibold">Var</p>
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
            <p className="text-xs text-blue-700 font-bold uppercase">Teslimat</p>
            <p className="text-sm text-blue-900 font-semibold">Hızlı</p>
          </div>
        </div>

        {/* Price section - prominent */}
        <div className="pt-2 space-y-2 border-t border-slate-100">
          <div className="flex items-end gap-3">
            <span className="text-5xl font-black text-[#e05a4c]">{formatPrice(product.price)}</span>
            {product.oldPrice > product.price && (
              <div className="flex flex-col items-start gap-1">
                <span className="text-xl text-slate-400 line-through">{formatPrice(product.oldPrice)}</span>
                <span className="px-3 py-1 rounded-lg bg-[#e05a4c]/10 text-[#e05a4c] text-sm font-bold">
                  -{savePercentage}%
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-600 italic">Güncellenmiş fiyat</p>
        </div>
      </div>

      {/* Quantity and action buttons - Amazon style */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-[0_4px_20px_rgba(15,23,42,0.08)] p-6 space-y-4">
        {/* Quantity selector */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-900">Miktar Seç</label>
          <div className="flex items-center rounded-xl border-2 border-slate-300 bg-slate-50 w-fit">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="px-4 py-3 hover:bg-slate-200 rounded-l-lg transition font-semibold text-slate-700"
            >
              −
            </motion.button>
            <div className="w-16 text-center font-bold text-lg text-slate-900">{quantity}</div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onQuantityChange(quantity + 1)}
              className="px-4 py-3 hover:bg-slate-200 rounded-r-lg transition font-semibold text-slate-700"
            >
              +
            </motion.button>
          </div>
        </div>

        {/* Primary CTA - "Sepete Ekle" */}
        <motion.button
          whileHover={canAddToCart ? { scale: 1.02 } : {}}
          whileTap={canAddToCart ? { scale: 0.98 } : {}}
          onClick={onAddToCart}
          disabled={!canAddToCart}
          className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-bold text-white shadow-lg transition-all ${
            canAddToCart
              ? isAddedToCart
                ? "bg-emerald-600 hover:shadow-xl"
                : "bg-[#e05a4c] hover:shadow-[0_8px_24px_rgba(224,90,76,0.3)] hover:-translate-y-0.5"
              : "bg-slate-400 cursor-not-allowed"
          }`}
        >
          {isAddedToCart ? <Check size={24} /> : <ShoppingCart size={24} />}
          <span>{canAddToCart ? (isAddedToCart ? "Sepete Eklendi!" : "Sepete Ekle") : "Stokta Yok"}</span>
        </motion.button>

        {/* Secondary CTA - "Şimdi Satın Al" */}
        <motion.button
          whileHover={canAddToCart ? { scale: 1.02 } : {}}
          whileTap={canAddToCart ? { scale: 0.98 } : {}}
          disabled={!canAddToCart}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-bold text-[#e05a4c] border-2 border-[#e05a4c] hover:bg-[#e05a4c]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Şimdi Satın Al
        </motion.button>

        {/* Share button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onShare}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all"
        >
          <Share2 size={20} />
          Paylaş
        </motion.button>

        {/* Warning message */}
        <AnimatePresence>
          {showDeliveryWarning && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2 rounded-xl bg-[#e05a4c]/10 border-l-4 border-[#e05a4c] px-4 py-3"
            >
              <AlertCircle size={18} className="text-[#e05a4c] flex-shrink-0" />
              <p className="text-sm text-[#e05a4c] font-semibold">Teslimat adresini sepette seçebilirsiniz</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delivery section - Amazon style */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-[0_4px_20px_rgba(15,23,42,0.08)] p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">Teslimat Bilgisi</h3>
        <DeliverySelectorV2
          onDeliveryComplete={onDeliveryComplete}
          onOpenChange={() => {}}
          openSignal={0}
        />

        {/* Delivery status cards */}
        {deliveryInfo && deliveryInfo.location && (
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="grid gap-3">
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                <Truck size={20} className="text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-bold uppercase">Teslimat Bölgesi</p>
                  <p className="text-sm font-bold text-slate-900">{deliveryInfo.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-purple-50 border border-purple-200 px-4 py-3">
                <Package size={20} className="text-purple-600" />
                <div>
                  <p className="text-xs text-purple-600 font-bold uppercase">İlçe</p>
                  <p className="text-sm font-bold text-slate-900">{deliveryInfo.district || "Seçin"}</p>
                </div>
              </div>
              {deliveryInfo.date && (
                <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                  <Check size={20} className="text-amber-600" />
                  <div>
                    <p className="text-xs text-amber-600 font-bold uppercase">Teslimat Tarihi</p>
                    <p className="text-sm font-bold text-slate-900">{new Date(deliveryInfo.date).toLocaleDateString("tr-TR", { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              )}
              {deliveryInfo.timeSlot && (
                <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                  <Check size={20} className="text-green-600" />
                  <div>
                    <p className="text-xs text-green-600 font-bold uppercase">Saat Aralığı</p>
                    <p className="text-sm font-bold text-slate-900">{deliveryInfo.timeSlot}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Trust signals - Amazon style */}
      <div className="space-y-3">
        <motion.div whileHover={{ y: -4 }} className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 px-4 py-4 shadow-[0_4px_12px_rgba(34,197,94,0.15)]">
          <div className="p-3 bg-green-100 rounded-full">
            <Truck size={24} className="text-green-700" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 text-sm">Hızlı Teslimat</p>
            <p className="text-xs text-slate-600">Aynı gün / Ertesi gün</p>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 px-4 py-4 shadow-[0_4px_12px_rgba(59,130,246,0.15)]">
          <div className="p-3 bg-blue-100 rounded-full">
            <Package size={24} className="text-blue-700" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 text-sm">Özenli Paket</p>
            <p className="text-xs text-slate-600">Şık, sarsıntıya dayanıklı</p>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 px-4 py-4 shadow-[0_4px_12px_rgba(147,51,234,0.15)]">
          <div className="p-3 bg-purple-100 rounded-full">
            <Check size={24} className="text-purple-700" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 text-sm">Memnuniyet Garantisi</p>
            <p className="text-xs text-slate-600">Fotoğraf onayı ve destek</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
