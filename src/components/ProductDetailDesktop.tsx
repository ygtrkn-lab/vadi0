"use client";

import { motion } from "framer-motion";
import { Truck, Package, Check } from "lucide-react";
import type { Product } from "@/data/products";
import ProductGalleryDesktop from "@/components/ProductGalleryDesktop";
import ProductSidebarDesktop from "@/components/ProductSidebarDesktop";

interface ProductDetailDesktopProps {
  product: Product;
  images: string[];
  categoryName: string;
  selectedImage: number;
  onImageSelect: (index: number) => void;
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
  onImageModalOpen: () => void;
}

export default function ProductDetailDesktop({
  product,
  images,
  categoryName,
  selectedImage,
  onImageSelect,
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
  onImageModalOpen,
}: ProductDetailDesktopProps) {
  return (
    <div className="hidden lg:block">
      {/* Desktop Layout - lg breakpoint - Amazon premium spacing */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-[1.4fr_1fr] gap-12 items-start xl:gap-16"
      >
        {/* Left: Gallery */}
        <ProductGalleryDesktop
          images={images}
          productName={product.name}
          selectedImage={selectedImage}
          onImageSelect={onImageSelect}
          onFullscreenOpen={onImageModalOpen}
          discount={product.discount}
        />

        {/* Right: Sidebar - max-width constraint */}
        <div className="w-full max-w-sm">
          <ProductSidebarDesktop
          product={product}
          quantity={quantity}
          onQuantityChange={onQuantityChange}
          isWishlisted={isWishlisted}
          onWishlistToggle={onWishlistToggle}
          onAddToCart={onAddToCart}
          isAddedToCart={isAddedToCart}
          canAddToCart={canAddToCart}
          deliveryInfo={deliveryInfo}
          onDeliveryComplete={onDeliveryComplete}
          onDeliveryOpenSignal={onDeliveryOpenSignal}
          showDeliveryWarning={showDeliveryWarning}
          onShare={onShare}
          onDeliverySignalChange={onDeliverySignalChange}
        />
        </div>
      </motion.div>

      {/* Desktop trust signals banner - Premium Amazon style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-16 grid grid-cols-3 gap-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.2)]"
      >
        {[
          {
            title: "Aynı Gün Teslim",
            desc: "İstanbul içi seçili ilçelerde 2-4 saat",
            icon: Truck,
          },
          {
            title: "Özenli Paket",
            desc: "Darbelere dayanıklı, şık sunum",
            icon: Package,
          },
          {
            title: "Memnuniyet Garantisi",
            desc: "Fotoğraf onayı ve hızlı destek",
            icon: Check,
          },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.05, y: -8 }}
            className="flex items-center gap-4 rounded-2xl bg-white/10 border border-white/20 px-6 py-5 cursor-pointer transition-all backdrop-blur-sm hover:bg-white/15"
          >
            <div className="p-3 bg-white/10 rounded-full">
              <item.icon size={28} className="text-white" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-lg">{item.title}</p>
              <p className="text-sm text-white/70">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
