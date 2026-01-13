"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Heart, Minus, Plus, ShoppingBag, Star, Share2, X, Play, Pause, Volume2, VolumeX, ChevronRight } from "lucide-react";
import type { Product } from "@/data/products";
import { Header, Footer } from "@/components";
import ProductReviews from "@/components/ProductReviews";
import ProductDetailDesktop from "@/components/ProductDetailDesktop";
import ProductGalleryDesktop from "@/components/ProductGalleryDesktop";
import { useCart } from "@/context/CartContext";
import { useCustomer } from "@/context/CustomerContext";
import { useAnalytics } from "@/context/AnalyticsContext";

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

type ProductDetailProps = {
  product: Product;
  relatedProducts: Product[];
  categoryName: string;
  breadcrumbItems: { name: string; url: string }[];
};

export default function ProductDetail({ product, relatedProducts, categoryName, breadcrumbItems }: ProductDetailProps) {
  const pathname = usePathname();
  const router = useRouter();
  const SUPPORT_WHATSAPP_NUMBER = '908503074876';
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  
  // Refs
  const heroRef = useRef<HTMLDivElement>(null);
  const productInfoRef = useRef<HTMLDivElement>(null);
  
  // Video state for mobile
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const [isMobileVideoPlaying, setIsMobileVideoPlaying] = useState(false);
  const [isMobileVideoMuted, setIsMobileVideoMuted] = useState(true);

  // Scroll tracking for floating bar
  const { scrollY } = useScroll();

  const { addToCart } = useCart();
  const { state: customerState, addToFavorites, removeFromFavorites, isFavorite } = useCustomer();
  const { trackEvent } = useAnalytics();
  const customer = customerState.currentCustomer;
  const isWishlisted = customer ? isFavorite(customer.id, String(product.id)) : false;

  const images = useMemo(() => {
    // Always start with main image, then add gallery items
    const mainImage = product.image;
    const galleryImages = product.gallery && product.gallery.length > 0 
      ? product.gallery 
      : (product.hoverImage ? [product.hoverImage] : []);
    
    // Combine: main image first, then gallery (excluding duplicates)
    const allImages = [mainImage, ...galleryImages.filter(img => img !== mainImage)];
    const valid = allImages.filter((img) => img && img !== "" && !img.includes("placeholder"));
    return valid.length ? valid : [product.image];
  }, [product.gallery, product.image, product.hoverImage]);

  // Check if current media is video
  const currentMedia = images[selectedImage] || product.image;
  const isCurrentVideo = getMediaType(currentMedia) === 'video';

  // Reset video state when changing media
  useEffect(() => {
    setIsMobileVideoPlaying(false);
    setIsMobileVideoMuted(true);
  }, [selectedImage]);

  // Track product view
  useEffect(() => {
    trackEvent('view_item', {
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      product_category: categoryName,
      product_slug: product.slug,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]); // Only track when product changes

  // Scroll-based floating bar visibility
  useMotionValueEvent(scrollY, "change", (latest) => {
    const shouldShow = latest > 400;
    setShowFloatingBar(shouldShow);
    
    if (shouldShow) {
      window.dispatchEvent(new Event('hideHeader'));
    } else {
      window.dispatchEvent(new Event('showHeader'));
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.dispatchEvent(new Event('showHeader'));
    };
  }, []);

  // Close any lingering overlays (mobile nav/search) and image modal on route change
  useEffect(() => {
    window.dispatchEvent(new Event("closeAllOverlays"));
    setIsImageModalOpen(false);
  }, [pathname]);

  // Keep modal state in sync with native Fullscreen API - close modal when fullscreen is exited
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        setIsImageModalOpen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(price);

  // canAddToCart - allow adding to cart without delivery selection; only require product to be in stock
  const canAddToCart = !!product.inStock;

  const handleAddToCart = () => {
    // Ensure overlays are closed before interaction
    window.dispatchEvent(new Event("closeAllOverlays"));
    setIsImageModalOpen(false);

    // If product is out of stock, do nothing
    if (!product.inStock) return;

    // Add to cart even if delivery info is not set; delivery can be selected in the cart
    addToCart(product);

    // Track add to cart event (delivery fields may be undefined)
    trackEvent('add_to_cart', {
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      product_category: categoryName,
      quantity: quantity,
    });

    setIsAddedToCart(true);
    // Redirect to cart after a short delay to show success state
    setTimeout(() => {
      router.push('/sepet');
    }, 600);
  };

  const handleWishlist = () => {
    if (!customer) {
      window.location.href = "/giris?redirect=" + encodeURIComponent(window.location.pathname);
      return;
    }
    if (isWishlisted) {
      removeFromFavorites(customer.id, String(product.id));
      trackEvent('favorite_remove', {
        product_id: product.id,
        product_name: product.name,
      });
    } else {
      addToFavorites(customer.id, String(product.id));
      trackEvent('favorite_add', {
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
      });
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

  const handleWhatsAppSupport = () => {
    const supportText = `Merhaba, ${product.name} hakkında destek almak istiyorum.`;
    const whatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(supportText)}`;
    trackEvent('whatsapp_support_click', {
      product_id: product.id,
      product_name: product.name,
      source: 'product_detail_primary',
    });
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Toggle accordion section
  const toggleSection = useCallback((section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  }, []);

  const WEEKLY_CAMPAIGN_SLUG = 'haftanin-cicek-kampanyalari-vadiler-com';
  const isWeeklyCampaign =
    product.category === WEEKLY_CAMPAIGN_SLUG || (product.categories || []).includes(WEEKLY_CAMPAIGN_SLUG);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-white pt-24 lg:pt-52">
        {/* Hero Section */}
        <section ref={heroRef} className="relative">
          {/* Breadcrumb */}
          <div className="px-4 lg:px-8 py-3 lg:max-w-6xl lg:mx-auto">
            <nav className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Link href="/" className="hover:text-neutral-900 transition-colors whitespace-nowrap">Ana Sayfa</Link>
              <ChevronRight size={12} className="text-neutral-300 shrink-0" />
              <Link href={`/${product.category}`} className="hover:text-neutral-900 transition-colors whitespace-nowrap">
                {categoryName}
              </Link>
              <ChevronRight size={12} className="text-neutral-300 shrink-0" />
              <span className="text-neutral-900 truncate max-w-[150px] lg:truncate-none lg:max-w-none">{product.name}</span>
            </nav>
          </div>

          {/* Main Hero Grid */}
          <div className="lg:grid lg:grid-cols-[480px_1fr] xl:grid-cols-[520px_1fr] lg:gap-10 lg:max-w-6xl lg:mx-auto lg:px-8">
            {/* Left: Gallery */}
            <div className="relative lg:sticky lg:top-20 lg:self-start">
              {/* Mobile Gallery */}
              <div className="lg:hidden">
                <div className="relative aspect-square">
                  {isCurrentVideo ? (
                    <div className="w-full h-full relative">
                      <video
                        ref={mobileVideoRef}
                        src={currentMedia}
                        className="w-full h-full object-cover"
                        loop
                        muted={isMobileVideoMuted}
                        playsInline
                        autoPlay
                        onClick={() => {
                          if (mobileVideoRef.current) {
                            if (isMobileVideoPlaying) {
                              mobileVideoRef.current.pause();
                            } else {
                              mobileVideoRef.current.play();
                            }
                            setIsMobileVideoPlaying(!isMobileVideoPlaying);
                          }
                        }}
                        onPlay={() => setIsMobileVideoPlaying(true)}
                        onPause={() => setIsMobileVideoPlaying(false)}
                      />
                      {/* Video Controls */}
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (mobileVideoRef.current) {
                              mobileVideoRef.current.muted = !isMobileVideoMuted;
                              setIsMobileVideoMuted(!isMobileVideoMuted);
                            }
                          }}
                          className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center"
                        >
                          {isMobileVideoMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Image
                        src={currentMedia}
                        alt={product.name}
                        fill
                        sizes="100vw"
                        className="object-cover"
                        priority
                      />
                      {/* Discount Badge */}
                      {product.discount > 0 && (
                        <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-medium bg-black text-white">
                          -{product.discount}%
                        </div>
                      )}
                      {/* Weekly Campaign Badge */}
                      {isWeeklyCampaign && (
                        <div className="absolute top-4 right-4">
                          <Image src="/TR/bugune-ozel.png" alt="Bugüne Özel" width={60} height={60} className="drop-shadow-lg" />
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto bg-white">
                    {images.map((url, idx) => {
                      const isVideo = getMediaType(url) === 'video';
                      return (
                        <motion.button
                          key={idx}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedImage(idx)}
                          className={`relative h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                            selectedImage === idx 
                              ? "ring-2 ring-black ring-offset-1" 
                              : "opacity-60"
                          }`}
                        >
                          {isVideo ? (
                            <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                              <Play size={14} className="text-white" />
                            </div>
                          ) : (
                            <Image src={url} alt="" fill className="object-cover" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Desktop Gallery */}
              <div className="hidden lg:block h-full">
                <ProductGalleryDesktop
                  images={images}
                  productName={product.name}
                  selectedImage={selectedImage}
                  onImageSelect={setSelectedImage}
                  onFullscreenOpen={() => setIsImageModalOpen(true)}
                  discount={product.discount}
                  showWeeklyCampaignBadge={isWeeklyCampaign}
                />
              </div>
            </div>

            {/* Right: Product Info */}
            <div ref={productInfoRef} className="relative">
              <div className="px-5 py-6 lg:px-0 lg:py-8 space-y-5">
                {/* Category Tag */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link 
                    href={`/${product.category}`}
                    className="inline-block text-[11px] font-medium tracking-widest text-neutral-400 uppercase hover:text-neutral-600 transition-colors"
                  >
                    {categoryName}
                  </Link>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-xl lg:text-2xl font-medium text-neutral-900 tracking-tight leading-tight"
                >
                  {product.name}
                </motion.h1>

                {/* Rating */}
                {product.reviewCount > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-2 group"
                  >
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={12} 
                          className={i < Math.round(product.rating) 
                            ? "text-amber-400 fill-current" 
                            : "text-neutral-200 fill-current"
                          } 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-neutral-500 group-hover:text-neutral-900 transition-colors">
                      {product.rating.toFixed(1)} ({product.reviewCount})
                    </span>
                  </motion.button>
                )}

                {/* Price Block */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-baseline gap-2"
                >
                  <span className="text-xl lg:text-2xl font-semibold text-neutral-900">
                    {formatPrice(product.price)}
                  </span>
                  {product.oldPrice > product.price && (
                    <>
                      <span className="text-sm text-neutral-400 line-through">
                        {formatPrice(product.oldPrice)}
                      </span>
                      <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        %{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}
                      </span>
                    </>
                  )}
                </motion.div>

                {/* Short Description */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-neutral-600 leading-relaxed"
                >
                  {product.description}
                </motion.p>

                {/* Divider */}
                <div className="h-px bg-neutral-100" />

                {/* Stock & Delivery Status */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex items-center gap-4 text-xs"
                >
                  <span className={product.inStock ? "text-green-600" : "text-red-500"}>
                    {product.inStock ? "● Stokta mevcut" : "● Stokta yok"}
                  </span>
                  <span className="text-neutral-400">•</span>
                  <span className="text-neutral-600">Aynı gün teslimat</span>
                </motion.div>

                {/* Seasonal Note - Only for beyaz-papatyalar */}
                {product.slug === 'beyaz-papatyalar' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.37 }}
                    className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg"
                  >
                    <span className="text-amber-500 text-sm">ℹ</span>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Mevsimlik olarak içerisindeki aksesuarlar değişebilir.
                    </p>
                  </motion.div>
                )}

                {/* Quantity Selector */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs text-neutral-500">Adet:</span>
                  <div className="inline-flex items-center border border-neutral-200 rounded-full">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-neutral-900 disabled:opacity-30 transition-colors"
                    >
                      <Minus size={14} />
                    </motion.button>
                    <span className="w-8 text-center text-sm font-medium text-neutral-900">{quantity}</span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors"
                    >
                      <Plus size={14} />
                    </motion.button>
                  </div>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex gap-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    disabled={!canAddToCart}
                    className={`flex-1 h-12 rounded-full text-sm font-medium transition-all duration-300 ${
                      canAddToCart
                        ? isAddedToCart
                          ? "bg-green-600 text-white"
                          : "bg-neutral-900 text-white hover:bg-neutral-800"
                        : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isAddedToCart ? (
                        <>
                          <Check size={16} />
                          Sepete Eklendi
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={16} />
                          {canAddToCart ? "Sepete Ekle" : "Stokta Yok"}
                        </>
                      )}
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleWishlist}
                    className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
                      isWishlisted 
                        ? "border-red-200 bg-red-50 text-red-500" 
                        : "border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-600"
                    }`}
                  >
                    <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="w-12 h-12 rounded-full border border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-600 flex items-center justify-center transition-all"
                  >
                    <Share2 size={18} />
                  </motion.button>
                </motion.div>

                {/* Trust Badges */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-400"
                >
                  <span>✓ Ücretsiz kargo</span>
                  <span>✓ Güvenli ödeme</span>
                  <span>✓ Taze kesim çiçekler</span>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Details Accordion */}
        <section className="border-t border-neutral-100">
          <div className="max-w-5xl mx-auto px-5 lg:px-8 py-8">
            {/* Desktop: Side by side layout */}
            <div className="hidden lg:grid lg:grid-cols-3 lg:gap-8">
              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">Ürün Açıklaması</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {product.longDescription || product.description}
                </p>
              </div>

              {/* Care Instructions */}
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">Bakım Bilgileri</h3>
                <div className="text-sm text-neutral-600">
                  {product.careInstructions && product.careInstructions.length > 0 ? (
                    <ul className="space-y-2">
                      {product.careInstructions.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-neutral-300 mt-0.5">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Serin ve gölgeli bir ortamda tutun. Günlük su değişimi önerilir.</p>
                  )}
                </div>
              </div>

              {/* Delivery */}
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">Teslimat Bilgileri</h3>
                <ul className="text-sm text-neutral-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-300 mt-0.5">•</span>
                    <span>İstanbul içi aynı gün teslimat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-300 mt-0.5">•</span>
                    <span>Özenli ve güvenli paketleme</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-300 mt-0.5">•</span>
                    <span>Teslimat saatini sepette belirleyebilirsiniz</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Mobile: Accordion layout */}
            <div className="lg:hidden">
            {/* Description */}
            <div className="border-b border-neutral-100">
              <button
                onClick={() => toggleSection('desc')}
                className="w-full flex items-center justify-between py-5 text-left"
              >
                <span className="text-sm font-medium text-neutral-900">Ürün Açıklaması</span>
                <motion.div animate={{ rotate: expandedSection === 'desc' ? 180 : 0 }}>
                  <ChevronDown size={16} className="text-neutral-400" />
                </motion.div>
              </button>
              <AnimatePresence>
                {expandedSection === 'desc' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pb-5 text-sm text-neutral-600 leading-relaxed">
                      {product.longDescription || product.description}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Care Instructions */}
            <div className="border-b border-neutral-100">
              <button
                onClick={() => toggleSection('care')}
                className="w-full flex items-center justify-between py-5 text-left"
              >
                <span className="text-sm font-medium text-neutral-900">Bakım Bilgileri</span>
                <motion.div animate={{ rotate: expandedSection === 'care' ? 180 : 0 }}>
                  <ChevronDown size={16} className="text-neutral-400" />
                </motion.div>
              </button>
              <AnimatePresence>
                {expandedSection === 'care' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pb-5 text-sm text-neutral-600">
                      {product.careInstructions && product.careInstructions.length > 0 ? (
                        <ul className="space-y-2">
                          {product.careInstructions.map((c, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-neutral-300 mt-0.5">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>Serin ve gölgeli bir ortamda tutun. Günlük su değişimi önerilir.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Delivery */}
            <div className="border-b border-neutral-100">
              <button
                onClick={() => toggleSection('delivery')}
                className="w-full flex items-center justify-between py-5 text-left"
              >
                <span className="text-sm font-medium text-neutral-900">Teslimat Bilgileri</span>
                <motion.div animate={{ rotate: expandedSection === 'delivery' ? 180 : 0 }}>
                  <ChevronDown size={16} className="text-neutral-400" />
                </motion.div>
              </button>
              <AnimatePresence>
                {expandedSection === 'delivery' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pb-5 text-sm text-neutral-600 space-y-2">
                      <p>• İstanbul içi aynı gün teslimat</p>
                      <p>• Özenli ve güvenli paketleme</p>
                      <p>• Teslimat saatini sepette belirleyebilirsiniz</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="py-12 lg:py-16 bg-neutral-50">
          <div className="max-w-4xl mx-auto px-5 lg:px-8">
            <h2 className="text-lg font-medium text-neutral-900 mb-6">
              Müşteri Değerlendirmeleri
            </h2>
            <ProductReviews
              productId={product.id}
              productName={product.name}
              currentCustomerId={customer?.id}
              customerOrders={customer?.orders || []}
            />
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-12 lg:py-16 border-t border-neutral-100">
            <div className="max-w-6xl mx-auto px-5 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-neutral-900">Benzer Ürünler</h2>
                <Link 
                  href={`/${product.category}`} 
                  className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors"
                >
                  Tümünü Gör <ArrowRight size={12} />
                </Link>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {relatedProducts.slice(0, 4).map((rp, idx) => (
                  <motion.div
                    key={rp.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Link href={`/${rp.category}/${rp.slug}`} className="group block">
                      <div className="relative aspect-square bg-neutral-100 rounded-xl overflow-hidden mb-3">
                        <Image 
                          src={rp.image} 
                          alt={rp.name} 
                          fill 
                          className="object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        {rp.discount > 0 && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black text-white">
                            -{rp.discount}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-800 line-clamp-2 group-hover:text-neutral-600 transition-colors">
                        {rp.name}
                      </p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm font-medium text-neutral-900">{formatPrice(rp.price)}</span>
                        {rp.oldPrice > rp.price && (
                          <span className="text-xs text-neutral-400 line-through">{formatPrice(rp.oldPrice)}</span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Floating Action Bar - iOS Style */}
      <AnimatePresence>
        {showFloatingBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[30000] pb-safe"
          >
            <div className="bg-white/95 backdrop-blur-xl border-t border-neutral-100">
              <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
                {/* Product Mini Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                    <Image src={images[0]} alt={product.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 truncate">{product.name}</p>
                    <p className="text-sm font-semibold text-neutral-900">{formatPrice(product.price)}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleWishlist}
                  className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isWishlisted 
                      ? "bg-red-50 text-red-500" 
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                  className={`h-11 px-6 rounded-full text-sm font-medium flex-shrink-0 transition-colors ${
                    canAddToCart
                      ? isAddedToCart
                        ? "bg-green-600 text-white"
                        : "bg-neutral-900 text-white"
                      : "bg-neutral-200 text-neutral-400"
                  }`}
                >
                  {isAddedToCart ? (
                    <span className="flex items-center gap-1.5">
                      <Check size={16} /> Eklendi
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag size={16} /> Sepete Ekle
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {isImageModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[200000] flex items-center justify-center"
            onClick={() => setIsImageModalOpen(false)}
          >
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center z-10"
              onClick={() => setIsImageModalOpen(false)}
            >
              <X size={20} />
            </motion.button>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((selectedImage - 1 + images.length) % images.length);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center"
                >
                  <ArrowLeft size={20} />
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((selectedImage + 1) % images.length);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center"
                >
                  <ArrowRight size={20} />
                </motion.button>
              </>
            )}

            {/* Image */}
            <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
              {getMediaType(images[selectedImage]) === 'video' ? (
                <video
                  src={images[selectedImage]}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  loop
                  playsInline
                />
              ) : (
                <Image
                  src={images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              )}
            </div>

            {/* Dots */}
            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      selectedImage === idx ? "w-6 bg-white" : "w-1.5 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200001] bg-neutral-900 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
          >
            Link kopyalandı
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
