"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Heart, Minus, Package, Plus, ShoppingCart, Star, Truck, Share2, AlertCircle } from "lucide-react";
import type { Product } from "@/data/products";
import { Header, Footer } from "@/components";
import DeliverySelectorV2 from "@/components/DeliverySelectorV2";
import ProductReviews from "@/components/ProductReviews";
import ProductDetailDesktop from "@/components/ProductDetailDesktop";
import ProductGalleryDesktop from "@/components/ProductGalleryDesktop";
import { useCart } from "@/context/CartContext";
import { useCustomer } from "@/context/CustomerContext";

type ProductDetailProps = {
  product: Product;
  relatedProducts: Product[];
  categoryName: string;
};

export default function ProductDetail({ product, relatedProducts, categoryName }: ProductDetailProps) {
  const pathname = usePathname();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeSection, setActiveSection] = useState<"desc" | "care" | "delivery">("desc");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [showTopBar, setShowTopBar] = useState(false);
  const [deliveryOpenSignal, setDeliveryOpenSignal] = useState(0);
  const [deliveryInfo, setDeliveryInfo] = useState<{
    location: string | null;
    district: string | null;
    date: Date | null;
    timeSlot: string | null;
  } | null>(null);
  const [showDeliveryWarning, setShowDeliveryWarning] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const deliverySectionRef = useRef<HTMLDivElement>(null);

  const { addToCart, setGlobalDeliveryInfo } = useCart();
  const { state: customerState, addToFavorites, removeFromFavorites, isFavorite } = useCustomer();
  const customer = customerState.currentCustomer;
  const isWishlisted = customer ? isFavorite(customer.id, String(product.id)) : false;

  const images = useMemo(() => {
    const gallery = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image, product.hoverImage];
    const valid = (gallery || []).filter((img) => img && img !== "" && !img.includes("placeholder"));
    return valid.length ? valid : [product.image];
  }, [product.gallery, product.image, product.hoverImage]);

  useEffect(() => {
    const onScroll = () => {
      const shouldShow = window.scrollY > 320;
      setShowTopBar(shouldShow);
      
      // Hide/show header based on scroll position
      if (shouldShow) {
        window.dispatchEvent(new Event('hideHeader'));
      } else {
        window.dispatchEvent(new Event('showHeader'));
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      // Always show header when leaving this page
      window.dispatchEvent(new Event('showHeader'));
    };
  }, []);

  // Close any lingering overlays (mobile nav/search) and image modal on route change
  useEffect(() => {
    window.dispatchEvent(new Event("closeAllOverlays"));
    setIsImageModalOpen(false);
  }, [pathname]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(price);

  const handleDeliveryComplete = useCallback(
    (info: { location: string | null; district: string | null; date: Date | null; timeSlot: string | null }) => {
      setDeliveryInfo(info);
      if (info.location && info.district && info.date && info.timeSlot) {
        setGlobalDeliveryInfo(info);
      }
    },
    [setGlobalDeliveryInfo]
  );

  const canAddToCart = Boolean(deliveryInfo?.location && deliveryInfo?.date && deliveryInfo?.timeSlot && product.inStock);

  const handleAddToCart = () => {
    // Ensure any overlays are closed before interaction
    window.dispatchEvent(new Event("closeAllOverlays"));
    setIsImageModalOpen(false);

    if (!canAddToCart) {
      if (deliverySectionRef.current) {
        deliverySectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setDeliveryOpenSignal((s) => s + 1);
      setShowDeliveryWarning(true);
      setTimeout(() => setShowDeliveryWarning(false), 2200);
      return;
    }
    addToCart(product);
    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 1800);
  };

  const handleWishlist = () => {
    if (!customer) {
      window.location.href = "/giris?redirect=" + encodeURIComponent(window.location.pathname);
      return;
    }
    if (isWishlisted) {
      removeFromFavorites(customer.id, String(product.id));
    } else {
      addToFavorites(customer.id, String(product.id));
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const title = `${product.name} - Vadiler Çiçek`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: product.description, url: shareUrl });
        return;
      } catch (err) {
        /* noop */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (err) {
      /* noop */
    }
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  const sectionCard = (id: "desc" | "care" | "delivery", title: string, content: React.ReactNode) => (
    <div className="rounded-2xl border border-slate-100 bg-white/80 backdrop-blur shadow-[0_14px_40px_rgba(15,23,42,0.06)] p-4 sm:p-5">
      <button
        className="w-full flex items-center justify-between text-left"
        onClick={() => setActiveSection((prev) => (prev === id ? ("desc" as typeof id) : id))}
      >
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        <motion.div animate={{ rotate: activeSection === id ? 90 : 0 }}>
          <ChevronRight size={18} className="text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {activeSection === id && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="pt-3 text-sm text-slate-600 space-y-3"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white pt-28 lg:pt-36 pb-20">
        <div className="container-custom space-y-6">
          <nav className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-primary-500">Ana Sayfa</Link>
            <ChevronRight size={14} />
            <Link href={`/${product.category}`} className="hover:text-primary-500">
              {categoryName}
            </Link>
            <ChevronRight size={14} />
            <span className="text-slate-800 font-medium truncate max-w-[180px]">{product.name}</span>
          </nav>

        {/* Desktop Layout - Hepsiburada/Trendyol/Apple Style */}
        <div className="hidden lg:grid grid-cols-1 xl:grid-cols-[2fr_1.2fr] gap-8 xl:gap-12 auto-rows-max">
          {/* Left Column: Gallery + Description */}
          <div className="space-y-6">
            {/* Gallery - Maksimum Alan Kullan */}
            <ProductGalleryDesktop
              images={images}
              productName={product.name}
              selectedImage={selectedImage}
              onImageSelect={setSelectedImage}
              onFullscreenOpen={() => setIsImageModalOpen(true)}
              discount={product.discount}
            />

            {/* Product Description - Detaylı */}
            <div className="space-y-4">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Ürün Açıklaması</h2>
                <p className="text-slate-700 leading-relaxed text-base">{product.longDescription || product.description}</p>
              </div>

              {/* Care Instructions - Card */}
              {product.careInstructions && product.careInstructions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl bg-blue-50 border border-blue-200 p-4"
                >
                  <h3 className="font-bold text-slate-900 mb-4">Bakım Bilgileri</h3>
                  <ul className="space-y-3">
                    {product.careInstructions.map((instruction, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-700">
                        <Check size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>

            {/* Delivery Info - Detailed Cards */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">Teslimat Bilgileri</h2>
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  whileHover={{ y: -3 }}
                  className="rounded-xl border border-green-200 bg-green-50 p-4"
                >
                  <Truck size={20} className="text-green-700 mb-2" />
                  <h3 className="font-semibold text-slate-900 text-sm">Hızlı Teslimat</h3>
                  <p className="text-xs text-slate-600 mt-1">İstanbul içi seçili ilçelerde 2-4 saat</p>
                </motion.div>
                <motion.div
                  whileHover={{ y: -3 }}
                  className="rounded-xl border border-purple-200 bg-purple-50 p-4"
                >
                  <Package size={20} className="text-purple-700 mb-2" />
                  <h3 className="font-semibold text-slate-900 text-sm">Özenli Paket</h3>
                  <p className="text-xs text-slate-600 mt-1">Darbelere dayanıklı, şık sunum</p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar (Sticky) */}
          <div className="space-y-4 sticky top-24">
            {/* Main Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-white border border-slate-200 shadow-[0_2px_12px_rgba(15,23,42,0.08)] p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ürün</p>
                  <h1 className="text-2xl font-black text-slate-900 leading-snug">{product.name}</h1>
                  {product.sku && <p className="text-xs text-slate-400">SKU: {product.sku}</p>}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleWishlist}
                  className={`h-10 w-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition ${
                    isWishlisted
                      ? "border-[#e05a4c] text-[#e05a4c] bg-[#e05a4c]/10"
                      : "border-slate-300 text-slate-400 hover:border-slate-400"
                  }`}
                >
                  <Heart size={24} fill={isWishlisted ? "currentColor" : "none"} />
                </motion.button>
              </div>

              {/* Rating */}
              {product.reviewCount > 0 && (
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={i < Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                      />
                    ))}
                  </div>
                  <span className="text-base font-bold">
                    <span className="text-[#e05a4c]">{product.rating.toFixed(1)}</span>
                    <span className="text-slate-600 font-normal text-xs"> ({product.reviewCount})</span>
                  </span>
                </div>
              )}

              {/* Price Section - Giant */}
              <div className="pt-1 space-y-2">
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-black text-[#e05a4c]">{formatPrice(product.price)}</span>
                  {product.oldPrice > product.price && (
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-lg text-slate-400 line-through">{formatPrice(product.oldPrice)}</span>
                      <span className="px-3 py-1.5 rounded-lg bg-[#e05a4c]/10 text-[#e05a4c] font-black text-xs">
                        -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2.5 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                <Check size={18} className="text-green-700" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Stokta Var</p>
                  <p className="text-[11px] text-slate-600">Hemen sipariş verin</p>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-900">Miktar</label>
                <div className="flex items-center rounded-lg border border-slate-300 w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-slate-100 font-bold text-base"
                  >
                    −
                  </button>
                  <div className="w-14 text-center font-bold text-xl text-slate-900">{quantity}</div>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 hover:bg-slate-100 font-bold text-base"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <motion.button
                  whileHover={canAddToCart ? { scale: 1.02 } : {}}
                  whileTap={canAddToCart ? { scale: 0.98 } : {}}
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                  className={`w-full py-3 rounded-lg font-bold text-base flex items-center justify-center gap-3 text-white shadow-md transition ${
                    canAddToCart
                      ? isAddedToCart
                        ? "bg-emerald-600"
                        : "bg-[#e05a4c] hover:bg-[#d43a2a] hover:shadow-xl"
                      : "bg-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isAddedToCart ? (
                    <>
                      <Check size={24} />
                      Sepete Eklendi
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={24} />
                      {canAddToCart ? "Sepete Ekle" : "Teslimat Seçin"}
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={canAddToCart ? { scale: 1.02 } : {}}
                  whileTap={canAddToCart ? { scale: 0.98 } : {}}
                  disabled={!canAddToCart}
                  className="w-full py-3 rounded-lg font-bold text-base text-[#e05a4c] border border-[#e05a4c] hover:bg-[#e05a4c]/5 transition disabled:opacity-50"
                >
                  Şimdi Satın Al
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShare}
                  className="w-full py-3 rounded-lg font-bold text-slate-700 border border-slate-300 hover:bg-slate-50 transition flex items-center justify-center gap-2"
                >
                  <Share2 size={20} />
                  Paylaş
                </motion.button>
              </div>

              {/* Delivery Selector */}
              <div className="space-y-2.5 pt-4 border-t border-slate-200">
                <p className="font-bold text-slate-900">Teslimat Seçin</p>
                <DeliverySelectorV2
                  onDeliveryComplete={handleDeliveryComplete}
                  onOpenChange={() => {}}
                  openSignal={deliveryOpenSignal}
                />
              </div>

              {/* Warning */}
              <AnimatePresence>
                {showDeliveryWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2.5 rounded-lg bg-[#e05a4c]/10 border-l-4 border-[#e05a4c] px-3 py-2"
                  >
                    <AlertCircle size={20} className="text-[#e05a4c]" />
                    <p className="text-xs font-bold text-[#e05a4c]">Sepete eklemeden teslimat seçin</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Trust Signals Cards */}
            <div className="space-y-2.5">
              <motion.div whileHover={{ y: -3 }} className="rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-green-200 p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-green-100 rounded-md">
                    <Truck size={18} className="text-green-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-xs">Hızlı Teslimat</p>
                    <p className="text-[11px] text-slate-600">Aynı gün veya ertesi gün</p>
                  </div>
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -3 }} className="rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <Package size={18} className="text-blue-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-xs">Özenli Paket</p>
                    <p className="text-[11px] text-slate-600">Sarsıntıya dayanıklı</p>
                  </div>
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -3 }} className="rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-purple-100 rounded-md">
                    <Check size={18} className="text-purple-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-xs">Memnuniyet Garantisi</p>
                    <p className="text-[11px] text-slate-600">7/24 destek</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

          {/* Mobile Layout */}
          <div className="lg:hidden">
            <div className="grid gap-4 lg:gap-6 items-start">
              <div className="relative rounded-3xl overflow-hidden bg-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.10)] lg:max-h-[60vh]">
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/70 to-transparent z-10 pointer-events-none" />
              <div className="hidden lg:flex flex-col gap-2 absolute left-4 top-4 z-20 max-h-[60vh] overflow-auto pr-1">
                {images.map((img, idx) => (
                  <button
                    key={`rail-${idx}`}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-16 w-16 rounded-2xl overflow-hidden border backdrop-blur transition-all ${
                      selectedImage === idx ? "border-[#e05a4c] ring-2 ring-[#e05a4c]/40" : "border-white/40 hover:border-white/80"
                    } shadow-sm`}
                  >
                    <Image src={img} alt={`${product.name}-rail-${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
              <motion.div layout className="relative aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5] max-h-[60vh]">
                <Image
                  src={images[selectedImage] || product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover"
                  priority
                />
                {product.discount > 0 && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-white text-xs font-semibold bg-[#e05a4c] shadow-lg">
                    -%{product.discount}
                  </div>
                )}
                <button
                  onClick={() => setIsImageModalOpen(true)}
                  className="absolute bottom-4 right-4 rounded-full bg-white/90 text-slate-800 px-4 py-2 text-xs font-semibold shadow-md"
                >
                  Tam ekran
                </button>
              </motion.div>

              {images.length > 1 && (
                <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white/80 backdrop-blur border-t border-slate-100 lg:hidden">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative h-16 w-16 rounded-2xl overflow-hidden border transition-all ${
                        selectedImage === idx ? "border-[#e05a4c] ring-2 ring-[#e05a4c]/30" : "border-transparent opacity-75"
                      }`}
                    >
                      <Image src={img} alt={`${product.name}-${idx}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl bg-white/90 backdrop-blur border border-slate-100 shadow-[0_18px_50px_rgba(15,23,42,0.08)] p-5 sm:p-6 space-y-4 lg:sticky lg:top-28">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 uppercase tracking-[0.14em] font-semibold">Ürün</p>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">{product.name}</h1>
                    {product.sku && <p className="text-xs text-slate-400 font-medium">SKU: {product.sku}</p>}
                  </div>
                  <button
                    onClick={handleWishlist}
                    className={`h-11 w-11 rounded-2xl border flex items-center justify-center shadow-sm transition ${
                      isWishlisted ? "border-[#e05a4c] text-[#e05a4c] bg-[#e05a4c]/10" : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
                  </button>
                </div>

                {product.reviewCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className={i < Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                      ))}
                    </div>
                    <span>{product.rating.toFixed(1)} ({product.reviewCount})</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600">Hızlı teslimat</span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600">{product.inStock ? "Stokta" : "Stok yok"}</span>
                  {product.deliveryInfo && (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 truncate max-w-[220px]">{product.deliveryInfo}</span>
                  )}
                </div>

                <div className="flex items-end gap-3">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#e05a4c]">{formatPrice(product.price)}</span>
                  {product.oldPrice > product.price && (
                    <span className="text-lg sm:text-xl text-slate-400 line-through">{formatPrice(product.oldPrice)}</span>
                  )}
                </div>

                <p className="text-sm lg:text-base text-slate-600 leading-relaxed line-clamp-3">{product.description}</p>

                <div ref={deliverySectionRef} className="relative space-y-3">
                  <AnimatePresence>
                    {showDeliveryWarning && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute -top-8 left-0 right-0"
                      >
                        <div className="mx-auto w-fit rounded-full bg-[#e05a4c] text-white text-xs font-semibold px-3 py-1.5 shadow-lg">
                          Lütfen teslimat bilgisi seçin
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <DeliverySelectorV2
                    onDeliveryComplete={handleDeliveryComplete}
                    onOpenChange={() => {}}
                    openSignal={deliveryOpenSignal}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center rounded-full border border-slate-200">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 hover:bg-slate-100 rounded-l-full"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 hover:bg-slate-100 rounded-r-full"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    aria-disabled={!canAddToCart}
                    className={`flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all ${
                      canAddToCart
                        ? isAddedToCart
                          ? "bg-emerald-600"
                          : "bg-[#e05a4c] hover:-translate-y-0.5 hover:shadow-xl"
                        : "bg-slate-300 cursor-not-allowed"
                    }`}
                  >
                    {isAddedToCart ? <Check size={18} /> : <ShoppingCart size={18} />}
                    {canAddToCart ? (isAddedToCart ? "Sepete Eklendi" : "Sepete Ekle") : "Teslimat Seçin"}
                  </button>

                  <button
                    onClick={handleShare}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 transition"
                  >
                    Paylaş
                  </button>
                </div>

                <div className="hidden lg:grid grid-cols-3 gap-3">
                  {[{
                    title: "Teslimat Slotu",
                    value: deliveryInfo?.timeSlot ? `${deliveryInfo.timeSlot}` : "Slot seçin",
                  }, {
                    title: "İade & Değişim",
                    value: "Koşulsuz destek",
                  }, {
                    title: "Destek",
                    value: "7/24 WhatsApp",
                  }].map((item, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 flex flex-col gap-1 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{item.title}</p>
                      <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[{ title: "Güvenli ödeme", icon: Truck, desc: "Hızlı teslim" }, { title: "Özel paket", icon: Package, desc: "Şık sunum" }].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-100 bg-slate-50 flex-shrink-0 min-w-[160px]">
                      <item.icon size={16} className="text-slate-500" />
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                        <p className="text-[11px] text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                {sectionCard(
                  "desc",
                  "Ürün Açıklaması",
                  <div className="space-y-3 text-sm leading-relaxed">
                    {product.longDescription ? (
                      product.longDescription.split("\n\n").map((p, i) => (
                        <p key={i}>{p}</p>
                      ))
                    ) : (
                      <p>{product.description}</p>
                    )}
                  </div>
                )}

                {sectionCard(
                  "care",
                  "Bakım Bilgileri",
                  <div className="space-y-2 text-sm">
                    {product.careInstructions && product.careInstructions.length > 0 ? (
                      <ul className="space-y-2">
                        {product.careInstructions.map((c, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#e05a4c]" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Serin, gölgeli ortamda tutun ve düzenli su değişimi yapın.</p>
                    )}
                  </div>
                )}

                {sectionCard(
                  "delivery",
                  "Teslimat Bilgileri",
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3 rounded-xl bg-green-50 px-3 py-2">
                      <Truck size={18} className="text-green-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-900">Hızlı teslimat</p>
                        <p className="text-slate-600">İlçenize göre gün içinde teslim.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl bg-blue-50 px-3 py-2">
                      <Package size={18} className="text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-900">Özenli paketleme</p>
                        <p className="text-slate-600">Sarsıntıya dayanıklı, şık ambalaj.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-[0_4px_12px_rgba(15,23,42,0.08)] p-4 lg:p-5">
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-4">Müşteri Değerlendirmeleri</h2>
            <ProductReviews
              productId={product.id}
              productName={product.name}
              currentCustomerId={customer?.id}
              customerOrders={customer?.orders || []}
            />
          </div>

          {/* Product Features Grid */}
          <div className="hidden lg:block space-y-4 mt-12">
            <h2 className="text-2xl font-black text-slate-900">Ürün Özellikleri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[
                { icon: "🌸", title: "Taze Çiçekler", desc: "Günlük olarak bahçelerimizden toplanan en taze çiçekler" },
                { icon: "🎨", title: "Profesyonel Tasarım", desc: "Sertifikalı florist tasarımcılarımız tarafından özel olarak düzenlenmiş" },
                { icon: "📦", title: "Güvenli Paketleme", desc: "Ticari paket malzemeleriyle korunan, sarsıntıya dayanıklı kargo" },
                { icon: "⏱️", title: "Hızlı Teslimat", desc: "Siparişten 4-8 saat içinde kapınıza ulaşır" },
                { icon: "❄️", title: "Soğuk Nakliye", desc: "Çiçeklerin tazeliğini korumak için kontrollü sıcaklıkta nakliye" },
                { icon: "✨", title: "Hazırlık Rehberi", desc: "Çiçeklerinizin en uzun süre taze kalması için ipuçları sağlanır" },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(224,90,76,0.12)" }}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)] hover:border-[#e05a4c]/40 transition-all"
                >
                  <div className="space-y-2">
                    <div className="text-3xl">{feature.icon}</div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">{feature.title}</h3>
                      <p className="text-slate-600 text-xs leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <div className="hidden lg:block space-y-4 mt-12">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900">Benzer Ürünler</h3>
                <Link href={`/${product.category}`} className="text-lg text-[#e05a4c] font-bold flex items-center gap-3 hover:gap-4 transition-all">
                  Tümünü Gör <ArrowRight size={20} />
                </Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {relatedProducts.map((rp) => (
                  <motion.div
                    key={rp.id}
                    whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(15,23,42,0.12)" }}
                    className="h-full"
                  >
                    <Link
                      href={`/${rp.category}/${rp.slug}`}
                      className="group rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)] overflow-hidden hover:border-slate-300 transition-all flex flex-col h-full"
                    >
                      <div className="relative aspect-square bg-slate-100 overflow-hidden">
                        <Image
                          src={rp.image}
                          alt={rp.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          quality={85}
                        />
                        {rp.discount > 0 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-2 left-2 px-2 py-1 rounded-full text-white text-xs font-bold bg-gradient-to-r from-[#e05a4c] to-[#d43a2a] shadow-md"
                          >
                            -{rp.discount}%
                          </motion.div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col flex-1 gap-2">
                        <p className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-[#e05a4c] transition-colors">{rp.name}</p>
                        <div className="flex items-baseline gap-1 mt-auto">
                          <span className="text-lg font-black text-[#e05a4c]">{formatPrice(rp.price)}</span>
                          {rp.oldPrice > rp.price && (
                            <span className="text-xs text-slate-400 line-through">{formatPrice(rp.oldPrice)}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showTopBar && (
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-0 left-0 right-0 z-[9999]"
          >
            {/* Glassmorphism background */}
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            
            <div className="container-custom py-3 relative">
              <div className="flex items-center gap-4">
                {/* Back Button - Modern pill style */}
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.history.back()}
                  className="p-2.5 bg-gray-100/80 hover:bg-gray-200/80 rounded-2xl transition-all duration-200 flex-shrink-0 backdrop-blur-sm"
                >
                  <ArrowLeft size={20} className="text-gray-700" />
                </motion.button>
                
                {/* Product Card - Floating style */}
                <motion.div 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  {/* Product Image with glow effect */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-pink-200 via-rose-200 to-orange-200 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                    <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-xl overflow-hidden bg-white ring-1 ring-gray-100 shadow-sm">
                      <Image src={images[0]} alt={product.name} fill className="object-cover" />
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-400 truncate font-medium uppercase tracking-wide">{categoryName}</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 truncate leading-tight">{product.name}</p>
                  </div>
                </motion.div>
                
                {/* Price Badge - Floating pill */}
                <motion.div 
                  initial={{ x: 10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50/80 backdrop-blur-sm rounded-2xl"
                >
                  <span className="text-base font-bold text-gray-900">{formatPrice(product.price)}</span>
                  {product.oldPrice > product.price && (
                    <span className="text-xs text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>
                  )}
                </motion.div>
                
                {/* CTA Button - Apple style */}
                <motion.button
                  initial={{ x: 10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  aria-disabled={!canAddToCart}
                  className={`
                    relative overflow-hidden inline-flex items-center justify-center gap-2 
                    rounded-2xl px-5 py-3 text-sm font-semibold text-white 
                    shadow-lg transition-all duration-300 flex-shrink-0
                    ${canAddToCart
                      ? isAddedToCart
                        ? "bg-emerald-500 shadow-emerald-200/50"
                        : "bg-gradient-to-r from-[#e05a4c] to-[#d43a2a] shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-300/40"
                      : "bg-gray-300 shadow-none cursor-not-allowed"
                    }
                  `}
                >
                  {/* Shine effect */}
                  {canAddToCart && !isAddedToCart && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    />
                  )}
                  
                  <span className="relative flex items-center gap-2">
                    {isAddedToCart ? <Check size={18} /> : <ShoppingCart size={18} />}
                    <span className="hidden sm:inline">
                      {canAddToCart ? (isAddedToCart ? "Sepette ✓" : "Sepete Ekle") : "Teslimat Seç"}
                    </span>
                  </span>
                </motion.button>
                
                {/* Mobile Price + Cart */}
                <div className="flex sm:hidden items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{formatPrice(product.price)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />

      <AnimatePresence>
        {isImageModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsImageModalOpen(false)}
          >
            <button
              className="absolute top-6 right-6 text-white/80 hover:text-white"
              onClick={() => setIsImageModalOpen(false)}
            >
              <ArrowLeft size={24} />
            </button>
            <div className="relative w-full max-w-4xl aspect-[4/3]" onClick={(e) => e.stopPropagation()}>
              <Image src={images[selectedImage]} alt={product.name} fill className="object-contain" />
            </div>
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`h-2 w-10 rounded-full ${selectedImage === idx ? "bg-white" : "bg-white/40"}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[140] rounded-full bg-slate-900 text-white px-4 py-2 text-sm shadow-lg"
          >
            Kopyalandı
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
