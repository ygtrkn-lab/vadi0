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

  // Teslimat bilgisi güncellendiğinde çağrılır
  const handleDeliveryComplete = (info: { location: string | null; district: string | null; date: Date | null; timeSlot: string | null }) => {
    setDeliveryInfo(info);
    if (info.location && info.district && info.date && info.timeSlot) {
      setGlobalDeliveryInfo(info);
    }
  };

  // canAddToCart - deliveryInfo tam olduğunda true (konum, tarih ve saat seçilmeli)
  const canAddToCart = !!(
    deliveryInfo && 
    deliveryInfo.location && 
    deliveryInfo.date && 
    deliveryInfo.timeSlot
  );

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

      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white pt-24 lg:pt-28 pb-16">
        <div className="container-custom space-y-4 lg:space-y-5">
          <nav className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Link href="/" className="hover:text-primary-500">Ana Sayfa</Link>
            <ChevronRight size={12} />
            <Link href={`/${product.category}`} className="hover:text-primary-500">
              {categoryName}
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-800 font-medium truncate max-w-[150px]">{product.name}</span>
          </nav>

        {/* Desktop Layout - Clean 2 Column Grid */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
          {/* Left Column: Gallery (Sticky) */}
          <div className="lg:sticky lg:top-28">
            <ProductGalleryDesktop
              images={images}
              productName={product.name}
              selectedImage={selectedImage}
              onImageSelect={setSelectedImage}
              onFullscreenOpen={() => setIsImageModalOpen(true)}
              discount={product.discount}
            />
          </div>

          {/* Right Column: Product Information */}
          <div className="space-y-6">
            {/* Title and Basic Info */}
            <div className="bg-white p-6">
              <h1 className="text-2xl lg:text-3xl font-light text-gray-900 mb-3">{product.name}</h1>
              <p className="text-base text-gray-600 mb-6">{product.description}</p>

              {/* Rating and Stock */}
              <div className="flex items-center justify-between mb-6">
                {product.reviewCount > 0 && (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-5 h-5 ${i < Math.round(product.rating) ? "text-amber-400 fill-current" : "text-gray-300"}`} />
                      ))}
                    </div>
                    <span className="text-gray-600 text-sm">({product.reviewCount} değerlendirme)</span>
                  </div>
                )}

                {/* Stock Status */}
                {product.inStock ? (
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-green-700 text-sm font-medium">Stokta Mevcut</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-red-700 text-sm font-medium">Stokta Yok</span>
                  </div>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="bg-white p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-3xl font-light text-gray-900">{formatPrice(product.price)}</span>
                    {product.oldPrice > product.price && (
                      <div className="flex items-center space-x-2">
                        <span className="text-base text-gray-500 line-through">{formatPrice(product.oldPrice)}</span>
                        <span className="bg-[#e05a4c] text-white text-xs font-medium px-2 py-1 rounded">
                          %{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)} İndirim
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Hızlı Teslimat</div>
                    <div className="text-sm font-medium text-gray-900">2-4 Saat</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Selector */}
            <div ref={deliverySectionRef} className="bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Teslimat Bilgileri</label>
                <AnimatePresence>
                  {showDeliveryWarning && (
                    <motion.span
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="text-xs font-medium text-[#e05a4c]"
                    >
                      Lütfen seçim yapın
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <DeliverySelectorV2
                onDeliveryComplete={handleDeliveryComplete}
                onOpenChange={() => {}}
                openSignal={deliveryOpenSignal}
              />
            </div>

            {/* Quantity and Add to Cart */}
            <div className="bg-white p-6 space-y-6">
              {/* Quantity Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Adet</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-16 text-center text-lg font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={!canAddToCart}
                    className={`relative overflow-hidden group py-3 px-6 rounded-full font-medium text-base transition-all duration-300 flex items-center justify-center space-x-2 ${
                      canAddToCart
                        ? isAddedToCart
                          ? "bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:-translate-y-1"
                          : "bg-[#e05a4c] text-white hover:bg-[#d43a2a] hover:shadow-lg hover:-translate-y-1"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <div className={`absolute inset-0 transform -skew-x-12 -translate-x-full transition-transform duration-700 ${canAddToCart && !isAddedToCart ? "bg-white/20 group-hover:translate-x-full" : ""}`} />
                    {isAddedToCart ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                    <span>{canAddToCart ? (isAddedToCart ? "Sepette" : "Sepete Ekle") : "Teslimat Seçin"}</span>
                  </button>

                  <a
                    href="https://wa.me/905551234567"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative overflow-hidden group bg-[#e05a4c] text-white py-3 px-6 rounded-full font-medium text-base hover:bg-[#d43a2a] transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span>WhatsApp Destek</span>
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleWishlist}
                    className={`py-3 px-4 rounded-full font-medium transition-colors flex items-center justify-center space-x-2 ${
                      isWishlisted
                        ? "bg-[#e05a4c]/10 text-[#e05a4c] border border-[#e05a4c]/30"
                        : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
                    <span>Favoriler</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="py-3 px-4 rounded-full font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Paylaş</span>
                  </button>
                </div>
              </div>
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

          {/* Product Details Tabs - Desktop */}
          <div className="hidden lg:block mt-12">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveSection("desc")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeSection === "desc"
                      ? "border-[#e05a4c] text-[#e05a4c]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Açıklama
                </button>
                <button
                  onClick={() => setActiveSection("care")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeSection === "care"
                      ? "border-[#e05a4c] text-[#e05a4c]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Bakım Bilgileri
                </button>
                <button
                  onClick={() => setActiveSection("delivery")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeSection === "delivery"
                      ? "border-[#e05a4c] text-[#e05a4c]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Teslimat
                </button>
              </nav>
            </div>

            <div className="py-8">
              {activeSection === "desc" && (
                <div className="prose max-w-none text-gray-700">
                  <p className="text-base leading-relaxed">{product.longDescription || product.description}</p>
                </div>
              )}

              {activeSection === "care" && (
                <div className="bg-white rounded-lg">
                  {product.careInstructions && product.careInstructions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {product.careInstructions.map((instruction, idx) => (
                        <div key={idx} className="bg-gray-50/50 rounded-lg p-4 hover:bg-[#e05a4c]/5 transition-colors duration-200">
                          <div className="flex items-center mb-2">
                            <div className="w-2 h-2 bg-[#e05a4c] rounded-full mr-2" />
                            <span className="text-sm text-gray-700">{instruction}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">Çiçeklerinizi serin ve güneş ışığından uzak tutun. Her gün su değiştirin.</p>
                  )}
                </div>
              )}

              {activeSection === "delivery" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-green-50/50">
                    <Truck className="w-6 h-6 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Hızlı Teslimat</h4>
                      <p className="text-sm text-gray-600 mt-1">Siparişiniz aynı gün veya seçtiğiniz tarihte teslim edilir.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50/50">
                    <Package className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Özenli Paketleme</h4>
                      <p className="text-sm text-gray-600 mt-1">Çiçekleriniz özel kutularda, zarar görmeden teslim edilir.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="rounded-2xl bg-white border border-gray-200/60 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-900">Değerlendirmeler</h2>
            </div>
            <ProductReviews
              productId={product.id}
              productName={product.name}
              currentCustomerId={customer?.id}
              customerOrders={customer?.orders || []}
            />
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Benzer Ürünler</h3>
                <Link href={`/${product.category}`} className="text-sm text-[#e05a4c] font-medium hover:underline flex items-center gap-1">
                  Tümünü Gör <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {relatedProducts.slice(0, 4).map((rp) => (
                  <Link
                    key={rp.id}
                    href={`/${rp.category}/${rp.slug}`}
                    className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all"
                  >
                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                      <Image src={rp.image} alt={rp.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" quality={75} />
                      {rp.discount > 0 && (
                        <span className="absolute top-3 left-3 px-2 py-1 rounded-full text-white text-xs font-semibold bg-[#e05a4c]">
                          -%{rp.discount}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-[#e05a4c] transition-colors">{rp.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-base font-bold text-[#e05a4c]">{formatPrice(rp.price)}</span>
                        {rp.oldPrice > rp.price && (
                          <span className="text-sm text-gray-400 line-through">{formatPrice(rp.oldPrice)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
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
