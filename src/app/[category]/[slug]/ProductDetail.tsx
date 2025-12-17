'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  ShoppingCart, 
  Shield, 
  Clock, 
  Check, 
  ChevronRight,
  Star,
  Minus,
  Plus,
  Package,
  Leaf,
  Droplets,
  Sun,
  X,
  Truck,
  Share2,
} from 'lucide-react';
import type { Product } from '@/data/products';
import { Header, Footer, MobileNavBar } from '@/components';
import { useCart } from '@/context/CartContext';
import { useCustomer } from '@/context/CustomerContext';
import DeliverySelector from '@/components/DeliverySelector';
import ProductReviews from '@/components/ProductReviews';

interface ProductDetailProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'care' | 'delivery'>('description');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<{
    location: string | null;
    district: string | null;
    date: Date | null;
    timeSlot: string | null;
  } | null>(null);
  const [showDeliveryWarning, setShowDeliveryWarning] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [isDeliverySelectorOpen, setIsDeliverySelectorOpen] = useState(false);
  
  const deliverySectionRef = useRef<HTMLDivElement>(null);
  // shareMenuRef removed with share UI
  const { addToCart, setGlobalDeliveryInfo } = useCart();
  const { state: customerState, addToFavorites, removeFromFavorites, isFavorite } = useCustomer();

  const customer = customerState.currentCustomer;
  const isWishlisted = customer ? isFavorite(customer.id, String(product.id)) : false;

  const handleWishlist = () => {
    if (!customer) {
      window.location.href = '/giris?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    if (isWishlisted) {
      removeFromFavorites(customer.id, String(product.id));
    } else {
      addToFavorites(customer.id, String(product.id));
    }
  };

  // Share functionality
  const copyToClipboardFallback = async (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      textArea.remove();
      return true;
    } catch (err) {
      textArea.remove();
      return false;
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `${product.name} - Vadiler Çiçek`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: `${product.name} ürününe göz atın!`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error occurred, try clipboard fallback
        if ((err as Error).name !== 'AbortError') {
          const success = await copyToClipboardFallback(shareUrl);
          if (success) {
            setShowShareToast(true);
            setTimeout(() => setShowShareToast(false), 3000);
          }
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const success = await copyToClipboardFallback(shareUrl);
      if (success) {
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
      }
    }
  };

  // Filter out invalid images (placeholder, undefined, empty)
  const getValidImages = () => {
    const allImages = product.gallery && product.gallery.length > 0 
      ? product.gallery 
      : [product.image, product.hoverImage];
    
    return allImages.filter(img => 
      img && 
      img !== '' && 
      !img.includes('placeholder') &&
      img !== undefined
    );
  };

  const images = getValidImages().length > 0 ? getValidImages() : [product.image];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleDeliveryComplete = useCallback((info: { location: string | null; district: string | null; date: Date | null; timeSlot: string | null }) => {
    setDeliveryInfo(info);
    // Global delivery info'yu da güncelle - sepet sayfasında kullanılacak
    if (info.location && info.district && info.date && info.timeSlot) {
      setGlobalDeliveryInfo({
        location: info.location,
        district: info.district,
        date: info.date,
        timeSlot: info.timeSlot,
      });
    }
  }, []);

  const handleAddToCart = () => {
    if (!deliveryInfo?.location || !deliveryInfo?.date || !deliveryInfo?.timeSlot) {
      // Scroll to delivery section and show warning
      if (deliverySectionRef.current) {
        deliverySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setShowDeliveryWarning(true);
        setTimeout(() => setShowDeliveryWarning(false), 3000);
      }
      return;
    }
    addToCart(product);
    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 3000);
  };

  const canAddToCart = deliveryInfo?.location && deliveryInfo?.date && deliveryInfo?.timeSlot;

  // Debug & fallback: if a click on an anchor is prevented by other handlers,
  // force navigation and log info to console to help find the root cause.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const handleCaptureClick = (e: MouseEvent) => {
      // Only run in browser
      try {
        const target = e.target as Element | null;
        if (!target) return;
        const anchor = target.closest('a') as HTMLAnchorElement | null;
        if (!anchor || !anchor.href) return;

        if (e.defaultPrevented) {
          try {
            const path = (e as any).composedPath ? (e as any).composedPath() : null;
            console.warn('[Debug] Click default prevented for anchor. Forcing navigation to:', anchor.href, { target: anchor, path });
          } catch (err) {
            console.warn('[Debug] Click default prevented for anchor. Forcing navigation to:', anchor.href);
          }
          // Force navigation as a fallback
          window.location.href = anchor.href;
        }
      } catch (err) {
        // Silence to avoid runtime errors
      }
    };

    document.addEventListener('click', handleCaptureClick, true);
    return () => document.removeEventListener('click', handleCaptureClick, true);
  }, []);

  // Dev-only overlay checker: log and outline any fixed full-screen overlays that might block clicks
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const findOverlays = () => {
      const candidates = Array.from(document.querySelectorAll('body *')) as HTMLElement[];
      const overlays = candidates.filter(el => {
        const st = window.getComputedStyle(el);
        const isFixedOrSticky = st.position === 'fixed' || st.position === 'sticky' || st.position === 'absolute';
        const coversFullViewport = (el.offsetWidth >= window.innerWidth && el.offsetHeight >= window.innerHeight) || (st.left === '0px' && st.top === '0px' && st.right === '0px' && st.bottom === '0px');
        const hasZ = st.zIndex && st.zIndex !== 'auto' && Number(st.zIndex) >= 0;
        const visible = st.display !== 'none' && st.visibility !== 'hidden' && st.opacity !== '0';
        return isFixedOrSticky && hasZ && visible && coversFullViewport;
      });

      if (overlays && overlays.length > 0) {
        console.group('[Overlay Debug] Found overlays: ' + overlays.length);
        overlays.forEach((el) => {
          console.log('%cOverlay Element', 'background: #e05a4c; color: white; padding: 2px 6px;', el, window.getComputedStyle(el));
          // visually outline
          el.style.outline = '3px solid rgba(224, 90, 76, 0.6)';
        });
        console.groupEnd();
      } else {
        console.log('[Overlay Debug] No fullscreen overlay detected');
      }
    };

    // Run a couple of times in quick succession to catch overlays created dynamically
    const t1 = setTimeout(findOverlays, 200);
    const t2 = setTimeout(findOverlays, 800);
    const t3 = setTimeout(findOverlays, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      // remove any outline we may have applied
      const candidates = Array.from(document.querySelectorAll('body *')) as HTMLElement[];
      candidates.forEach(el => { if (el.style.outline === '3px solid rgba(224, 90, 76, 0.6)') el.style.outline = ''; });
    };
  }, [isImageModalOpen, isDeliverySelectorOpen]);

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gray-50 pt-32 lg:pt-44 pb-20">
        {/* Breadcrumb */}
        <div className="container-custom mb-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary-500 transition-colors">
              Ana Sayfa
            </Link>
            <ChevronRight size={14} />
            <Link 
              href={`/${product.category}`} 
              className="hover:text-primary-500 transition-colors"
            >
              {product.categoryName || product.category.replace(/-/g, ' ')}
            </Link>
            <ChevronRight size={14} />
            <span className="text-gray-800 font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>

        {/* Product Section */}
        <div className="container-custom">
          <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              
              {/* Image Gallery */}
              <div className="relative p-4 sm:p-6 lg:p-8 bg-gray-50">
                {/* Main Image */}
                <motion.div 
                  className="relative aspect-square rounded-xl lg:rounded-2xl overflow-hidden bg-white cursor-zoom-in"
                  onClick={() => {
                    // Close any other overlays to avoid stacking
                    window.dispatchEvent(new Event('closeAllOverlays'));
                    setIsImageModalOpen(true);
                  }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src={images[selectedImage] || product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    onError={(e) => {
                      // Fallback to main product image if current image fails
                      const target = e.target as HTMLImageElement;
                      if (target.src !== product.image) {
                        target.src = product.image;
                      }
                    }}
                  />
                  
                  {/* Discount Badge */}
                  {product.discount > 0 && (
                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-white text-sm font-bold"
                      style={{ backgroundColor: '#e05a4c' }}>
                      -%{product.discount}
                    </div>
                  )}
                </motion.div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 
                          transition-all duration-300 ${
                          selectedImage === index 
                            ? 'ring-2 ring-primary-500 ring-offset-2' 
                            : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`${product.name} - ${index + 1}`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== product.image) {
                              target.src = product.image;
                            }
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4 sm:p-6 lg:p-8 flex flex-col">
                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.tags.slice(0, 4).map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title & SKU */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                {product.sku && (
                  <p className="text-sm text-gray-400 mb-4">SKU: {product.sku}</p>
                )}

                {/* Rating - Only show if product has reviews, actual stats shown in ProductReviews component below */}
                {product.reviewCount > 0 && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          className={i < Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {product.rating.toFixed(1)} ({product.reviewCount} değerlendirme)
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-end gap-3 mb-4">
                  <span className="text-3xl sm:text-4xl font-bold" style={{ color: '#e05a4c' }}>
                    {formatPrice(product.price)}
                  </span>
                  {product.oldPrice > product.price && (
                    <span className="text-xl text-gray-400 line-through mb-1">
                      {formatPrice(product.oldPrice)}
                    </span>
                  )}
                </div>

                {/* Delivery Selector - osevio style */}
                <div ref={deliverySectionRef} className="mb-6 pb-6 border-b border-gray-100 relative">
                  {/* Warning Tooltip */}
                  <AnimatePresence>
                    {showDeliveryWarning && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute -top-2 left-0 right-0 z-10"
                      >
                        <div className="bg-[#e05a4c] text-white text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="font-medium">Lütfen teslimat bölgesi ve zamanını seçin</span>
                        </div>
                        <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-[#e05a4c] rotate-45" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <DeliverySelector onDeliveryComplete={handleDeliveryComplete} onOpenChange={(open) => {
                    if (open !== isDeliverySelectorOpen) {
                      setIsDeliverySelectorOpen(open);
                    }
                    // Share UI removed
                  }} />
                </div>

                {/* Short Description */}
                <p className="text-gray-600 leading-relaxed mb-6">
                  {product.description}
                </p>

                {/* Stock Status */}
                <div className="flex items-center gap-2 mb-6">
                  {product.inStock ? (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-600 font-medium">
                        Stokta {product.stockCount && `(${product.stockCount} adet)`}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-red-600 font-medium">Stokta Yok</span>
                    </>
                  )}
                </div>

                {/* Quantity & Add to Cart */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  {/* Quantity */}
                  <div className="flex items-center border border-gray-200 rounded-full">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-gray-100 rounded-l-full transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 hover:bg-gray-100 rounded-r-full transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  {/* Add to Cart */}
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock || !canAddToCart}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-full 
                      font-semibold text-white transition-all shadow-lg
                      ${isAddedToCart 
                        ? 'bg-[#549658]' 
                        : canAddToCart
                        ? 'hover:opacity-90 hover:shadow-xl'
                        : 'opacity-50 cursor-not-allowed'
                      }
                      ${!product.inStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: isAddedToCart ? undefined : '#e05a4c' }}
                  >
                    {isAddedToCart ? (
                      <>
                        <Check size={20} />
                        <span>Sepete Eklendi</span>
                      </>
                    ) : !canAddToCart ? (
                      <>
                        <ShoppingCart size={20} />
                        <span>Teslimat Bilgisi Seçin</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={20} />
                        <span>Sepete Ekle</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-8">
                  <button
                    onClick={handleWishlist}
                    className={`flex items-center gap-2 px-5 py-3 rounded-full border transition-all
                      ${isWishlisted 
                        ? 'border-primary-500 bg-primary-50 text-primary-500' 
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                    <span className="text-sm font-medium">{isWishlisted ? 'Favorilerimde' : 'Favorilere Ekle'}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-5 py-3 rounded-full border border-gray-200 hover:border-gray-300 transition-all"
                  >
                    <Share2 size={18} />
                    <span className="text-sm font-medium">Paylaş</span>
                  </button>
                </div>

                {/* Share Toast */}
                <AnimatePresence>
                  {showShareToast && (
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 50 }}
                      className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
                    >
                      <Check size={18} className="text-green-400" />
                      <span className="font-medium">Link kopyalandı!</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Features */}
                {product.features && product.features.length > 0 && (
                  <div className="border-t border-gray-100 pt-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Ürün Özellikleri</h3>
                    <ul className="space-y-2">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-600">
                          <Check size={16} className="text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Shield size={20} className="text-gray-500" />
                    <div>
                      <p className="text-xs font-medium text-gray-900">Güvenli Ödeme</p>
                      <p className="text-xs text-gray-500">256-bit SSL</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Package size={20} className="text-gray-500" />
                    <div>
                      <p className="text-xs font-medium text-gray-900">Özel Ambalaj</p>
                      <p className="text-xs text-gray-500">Şık sunum</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Clock size={20} className="text-gray-500" />
                    <div>
                      <p className="text-xs font-medium text-gray-900">7/24 Destek</p>
                      <p className="text-xs text-gray-500">Canlı destek</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Leaf size={20} className="text-gray-500" />
                    <div>
                      <p className="text-xs font-medium text-gray-900">Taze Çiçek</p>
                      <p className="text-xs text-gray-500">Garantili</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mt-8 bg-white rounded-2xl lg:rounded-3xl shadow-soft overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab('description')}
                className={`flex-1 py-4 px-6 text-sm font-medium transition-colors relative
                  ${activeTab === 'description' ? 'text-primary-500' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Ürün Açıklaması
                {activeTab === 'description' && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: '#e05a4c' }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('care')}
                className={`flex-1 py-4 px-6 text-sm font-medium transition-colors relative
                  ${activeTab === 'care' ? 'text-primary-500' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Bakım Bilgileri
                {activeTab === 'care' && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: '#e05a4c' }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('delivery')}
                className={`flex-1 py-4 px-6 text-sm font-medium transition-colors relative
                  ${activeTab === 'delivery' ? 'text-primary-500' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Teslimat Bilgileri
                {activeTab === 'delivery' && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: '#e05a4c' }}
                  />
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 lg:p-8">
              <AnimatePresence mode="wait">
                {activeTab === 'description' && (
                  <motion.div
                    key="description"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="prose prose-gray max-w-none">
                      {product.longDescription ? (
                        product.longDescription.split('\n\n').map((paragraph, index) => (
                          <p key={index} className="text-gray-600 leading-relaxed mb-4">
                            {paragraph}
                          </p>
                        ))
                      ) : (
                        <p className="text-gray-600 leading-relaxed">{product.description}</p>
                      )}

                      {/* Dimensions */}
                      {product.dimensions && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                          <h4 className="font-semibold text-gray-900 mb-3">Ürün Boyutları</h4>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            {product.dimensions.height && (
                              <div>
                                <p className="text-2xl font-bold text-gray-900">{product.dimensions.height}</p>
                                <p className="text-xs text-gray-500">Yükseklik</p>
                              </div>
                            )}
                            {product.dimensions.width && (
                              <div>
                                <p className="text-2xl font-bold text-gray-900">{product.dimensions.width}</p>
                                <p className="text-xs text-gray-500">Genişlik</p>
                              </div>
                            )}
                            {product.dimensions.weight && (
                              <div>
                                <p className="text-2xl font-bold text-gray-900">{product.dimensions.weight}</p>
                                <p className="text-xs text-gray-500">Ağırlık</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'care' && (
                  <motion.div
                    key="care"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                      <div className="text-center p-6 bg-blue-50 rounded-2xl">
                        <Droplets size={32} className="mx-auto mb-3 text-blue-500" />
                        <h4 className="font-semibold text-gray-900 mb-1">Sulama</h4>
                        <p className="text-sm text-gray-600">Vazo suyunu her 2 günde bir değiştirin</p>
                      </div>
                      <div className="text-center p-6 bg-yellow-50 rounded-2xl">
                        <Sun size={32} className="mx-auto mb-3 text-yellow-500" />
                        <h4 className="font-semibold text-gray-900 mb-1">Işık</h4>
                        <p className="text-sm text-gray-600">Direkt güneş ışığından koruyun</p>
                      </div>
                      <div className="text-center p-6 bg-green-50 rounded-2xl">
                        <Leaf size={32} className="mx-auto mb-3 text-green-500" />
                        <h4 className="font-semibold text-gray-900 mb-1">Ortam</h4>
                        <p className="text-sm text-gray-600">Serin ve havadar ortamda tutun</p>
                      </div>
                    </div>

                    {product.careInstructions && product.careInstructions.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Bakım Talimatları</h4>
                        <ul className="space-y-3">
                          {product.careInstructions.map((instruction, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 
                                flex items-center justify-center text-sm font-medium flex-shrink-0">
                                {index + 1}
                              </span>
                              <span className="text-gray-600">{instruction}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'delivery' && (
                  <motion.div
                    key="delivery"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="space-y-6">
                      <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl">
                        <Truck size={24} className="text-green-600 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Hızlı Teslimat</h4>
                          <p className="text-gray-600 text-sm">
                            {product.deliveryInfo || 'İstanbul genelinde hızlı teslimat hizmeti sunulmaktadır.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
                        <Package size={24} className="text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Özel Paketleme</h4>
                          <p className="text-gray-600 text-sm">
                            Çiçekleriniz özel koruyucu ambalaj ile paketlenerek teslim edilir.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl">
                        <Shield size={24} className="text-purple-600 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Tazelik Garantisi</h4>
                          <p className="text-gray-600 text-sm">
                            Tüm çiçeklerimiz tazelik garantisi ile gönderilir. Memnun kalmazsanız iade garantisi.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="mt-12 border-t border-gray-100 pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Müşteri Değerlendirmeleri</h2>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Benzer Ürünler</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <Link
                    key={relatedProduct.id}
                    href={`/${relatedProduct.category}/${relatedProduct.slug}`}
                    className="group bg-white rounded-xl lg:rounded-2xl overflow-hidden shadow-soft 
                      hover:shadow-lg transition-all"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={relatedProduct.image}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {relatedProduct.discount > 0 && (
                        <span className="absolute top-2 left-2 px-2 py-1 text-white text-xs font-bold rounded-lg"
                          style={{ backgroundColor: '#e05a4c' }}>
                          -%{relatedProduct.discount}
                        </span>
                      )}
                    </div>
                    <div className="p-3 lg:p-4">
                      <h3 className="font-medium text-gray-900 text-sm lg:text-base line-clamp-2 
                        group-hover:text-primary-500 transition-colors mb-2">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: '#e05a4c' }}>
                          {formatPrice(relatedProduct.price)}
                        </span>
                        {relatedProduct.oldPrice > relatedProduct.price && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(relatedProduct.oldPrice)}
                          </span>
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

      {/* Image Modal */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white 
              hover:bg-white/20 transition-colors"
          >
            <X size={24} />
          </button>
          <div
            className="relative w-full max-w-4xl aspect-square"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selectedImage]}
              alt={product.name}
              fill
              className="object-contain"
            />
          </div>

          {/* Modal Thumbnails */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(index);
                  }}
                  className={`w-16 h-16 rounded-lg overflow-hidden transition-all
                    ${selectedImage === index ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'}`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} - ${index + 1}`}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Footer />
      <MobileNavBar />
    </>
  );
}
