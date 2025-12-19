"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Heart, Minus, Package, Plus, ShoppingCart, Star, Truck } from "lucide-react";
import type { Product } from "@/data/products";
import { Header, Footer, MobileNavBar } from "@/components";
import DeliverySelector from "@/components/DeliverySelector";
import ProductReviews from "@/components/ProductReviews";
import { useCart } from "@/context/CartContext";
import { useCustomer } from "@/context/CustomerContext";

type ProductDetailProps = {
  product: Product;
  relatedProducts: Product[];
  categoryName: string;
};

export default function ProductDetail({ product, relatedProducts, categoryName }: ProductDetailProps) {
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
      setShowTopBar(window.scrollY > 320);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const sectionCard = (id: "desc" | "care" | "delivery", title: string, content: JSX.Element) => (
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

          <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-4 lg:gap-6 items-start">
            <div className="relative rounded-3xl overflow-hidden bg-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
              <motion.div layout className="relative aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5]">
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
                <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white/80 backdrop-blur border-t border-slate-100">
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
              <div className="rounded-3xl bg-white/90 backdrop-blur border border-slate-100 shadow-[0_18px_50px_rgba(15,23,42,0.08)] p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 uppercase tracking-[0.14em]">Ürün</p>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-tight">{product.name}</h1>
                    {product.sku && <p className="text-xs text-slate-400">SKU: {product.sku}</p>}
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
                  <span className="text-3xl font-bold text-[#e05a4c]">{formatPrice(product.price)}</span>
                  {product.oldPrice > product.price && (
                    <span className="text-lg text-slate-400 line-through">{formatPrice(product.oldPrice)}</span>
                  )}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{product.description}</p>

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
                  <DeliverySelector
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

              <div className="space-y-3">
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

          <div className="rounded-3xl bg-white/90 backdrop-blur border border-slate-100 shadow-[0_18px_50px_rgba(15,23,42,0.06)] p-5 lg:p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Müşteri Değerlendirmeleri</h2>
            <ProductReviews
              productId={product.id}
              productName={product.name}
              currentCustomerId={customer?.id}
              customerOrders={customer?.orders || []}
            />
          </div>

          {relatedProducts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Benzer ürünler</h3>
                <Link href={`/${product.category}`} className="text-sm text-[#e05a4c] font-semibold flex items-center gap-1">
                  Tümünü gör <ArrowRight size={16} />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                {relatedProducts.map((rp) => (
                  <Link
                    key={rp.id}
                    href={`/${rp.category}/${rp.slug}`}
                    className="group rounded-2xl border border-slate-100 bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.06)] overflow-hidden"
                  >
                    <div className="relative aspect-square">
                      <Image src={rp.image} alt={rp.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      {rp.discount > 0 && (
                        <span className="absolute top-2 left-2 px-2 py-1 text-[11px] font-bold text-white bg-[#e05a4c] rounded-full">
                          -%{rp.discount}
                        </span>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-[#e05a4c]">{rp.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#e05a4c]">{formatPrice(rp.price)}</span>
                        {rp.oldPrice > rp.price && <span className="text-xs text-slate-400 line-through">{formatPrice(rp.oldPrice)}</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-20 left-0 right-0 z-[60] lg:hidden">
        <div className="container-custom">
          <div className="flex items-center gap-3 rounded-2xl bg-white shadow-[0_14px_40px_rgba(15,23,42,0.12)] border border-slate-100 px-4 py-3">
            <div className="flex-1">
              <p className="text-[11px] text-slate-500">{product.inStock ? "Fiyat" : "Stokta yok"}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-[#e05a4c]">{formatPrice(product.price)}</span>
                {product.oldPrice > product.price && <span className="text-sm text-slate-400 line-through">{formatPrice(product.oldPrice)}</span>}
              </div>
            </div>
            <button
              onClick={handleAddToCart}
              aria-disabled={!canAddToCart}
              className={`min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all ${
                canAddToCart
                  ? isAddedToCart
                    ? "bg-emerald-600"
                    : "bg-[#e05a4c] hover:-translate-y-0.5 hover:shadow-xl"
                  : "bg-slate-300 cursor-not-allowed"
              }`}
            >
              {isAddedToCart ? <Check size={18} /> : <ShoppingCart size={18} />}
              {canAddToCart ? (isAddedToCart ? "Eklendi" : "Ekle") : "Teslimat"}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showTopBar && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-2 left-0 right-0 z-[80]"
          >
            <div className="container-custom">
              <div className="flex items-center gap-3 rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-[0_14px_40px_rgba(15,23,42,0.12)] px-4 py-3">
                <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                  <Image src={images[0]} alt={product.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 truncate">{categoryName}</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">{product.name}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-[#e05a4c]">
                  {formatPrice(product.price)}
                  {product.oldPrice > product.price && (
                    <span className="text-xs text-slate-400 line-through">{formatPrice(product.oldPrice)}</span>
                  )}
                </div>
                <button
                  onClick={handleAddToCart}
                  aria-disabled={!canAddToCart}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-md transition-all ${
                    canAddToCart
                      ? isAddedToCart
                        ? "bg-emerald-600"
                        : "bg-[#e05a4c] hover:-translate-y-0.5 hover:shadow-lg"
                      : "bg-slate-300 cursor-not-allowed"
                  }`}
                >
                  {isAddedToCart ? <Check size={16} /> : <ShoppingCart size={16} />}
                  {canAddToCart ? (isAddedToCart ? "Eklendi" : "Sepete Ekle") : "Teslimat"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
      <MobileNavBar />

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
