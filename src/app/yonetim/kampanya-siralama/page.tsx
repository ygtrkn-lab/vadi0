'use client';

import { useState, useEffect } from 'react';
import MediaImage from '@/components/MediaImage';
import Link from 'next/link';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { SpotlightCard, FadeContent } from '@/components/admin';
import { useTheme } from '../ThemeContext';
import { Product } from '@/data/products';
import {
  HiOutlineArrowLeft,
  HiOutlineRefresh,
  HiOutlineSave,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineEye,
  HiOutlineExternalLink,
  HiOutlinePhotograph,
} from 'react-icons/hi';
import { GripVertical, Percent, Star, ArrowUpDown } from 'lucide-react';

interface CampaignProduct extends Product {
  customOrder?: number;
}

export default function KampanyaSiralamaPage() {
  const [products, setProducts] = useState<CampaignProduct[]>([]);
  const [savedOrder, setSavedOrder] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isDark } = useTheme();

  // Load campaign products and saved order
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch both in parallel
        const [productsRes, orderRes] = await Promise.all([
          fetch('/api/products?category=haftanin-cicek-kampanyalari-vadiler-com&inStock=true&limit=48'),
          fetch('/api/admin/campaign-order')
        ]);

        const productsData = await productsRes.json();
        const orderData = await orderRes.json();

        const raw: Product[] = (productsData.products || productsData.data || []) as Product[];
        
        // Filter only discounted products (like CategoryCarousel does)
        const campaignProducts = raw.filter((p) => Number(p.discount) > 0);
        
        // Get saved order
        const savedOrderIds: number[] = orderData.order || [];
        setSavedOrder(savedOrderIds);

        // Sort products by saved order if available
        let sortedProducts: CampaignProduct[];
        if (savedOrderIds.length > 0) {
          // Create a map for quick lookup
          const orderMap = new Map(savedOrderIds.map((id, index) => [id, index]));
          
          sortedProducts = [...campaignProducts].sort((a, b) => {
            const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : Infinity;
            const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : Infinity;
            
            if (orderA === Infinity && orderB === Infinity) {
              // Both not in order, sort by discount
              return (b.discount || 0) - (a.discount || 0);
            }
            return orderA - orderB;
          });
        } else {
          // Default: sort by discount
          sortedProducts = [...campaignProducts].sort((a, b) => (b.discount || 0) - (a.discount || 0));
        }

        setProducts(sortedProducts);
      } catch (err) {
        console.error('Error loading campaign products:', err);
        setError('Kampanya ürünleri yüklenirken hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Check for changes
  useEffect(() => {
    if (products.length === 0) {
      setHasChanges(false);
      return;
    }

    const currentOrder = products.map(p => p.id);
    const orderChanged = JSON.stringify(currentOrder) !== JSON.stringify(savedOrder);
    
    // Also check if order was never saved (savedOrder is empty but we have products)
    const isNewOrder = savedOrder.length === 0 && products.length > 0;
    
    setHasChanges(orderChanged || isNewOrder);
  }, [products, savedOrder]);

  // Handle reorder with framer-motion Reorder
  const handleReorder = (newOrder: CampaignProduct[]) => {
    setProducts(newOrder);
  };

  // Save order
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const order = products.map(p => p.id);

      const res = await fetch('/api/admin/campaign-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order })
      });

      if (!res.ok) {
        throw new Error('Sıralama kaydedilemedi');
      }

      setSavedOrder(order);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving order:', err);
      setError('Sıralama kaydedilirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default (by discount)
  const handleResetToDefault = async () => {
    try {
      setIsSaving(true);
      
      // Reset in database
      await fetch('/api/admin/campaign-order', { method: 'DELETE' });
      
      // Re-sort by discount
      const sorted = [...products].sort((a, b) => (b.discount || 0) - (a.discount || 0));
      setProducts(sorted);
      setSavedOrder([]);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error resetting order:', err);
      setError('Sıralama sıfırlanırken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  // Move product to specific position
  const moveProduct = (index: number, direction: 'up' | 'down') => {
    const newProducts = [...products];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newProducts.length) return;
    
    [newProducts[index], newProducts[targetIndex]] = [newProducts[targetIndex], newProducts[index]];
    setProducts(newProducts);
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <FadeContent direction="up" delay={0}>
          <div className="flex items-center gap-4">
            <Link
              href="/yonetim/ayarlar"
              className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'}`}
            >
              <HiOutlineArrowLeft size={20} />
            </Link>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Kampanya Sıralaması
              </h1>
              <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                Yükleniyor...
              </p>
            </div>
          </div>
        </FadeContent>

        <SpotlightCard className="p-6">
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className={isDark ? 'text-neutral-400' : 'text-gray-500'}>
                Ürünler yükleniyor...
              </p>
            </div>
          </div>
        </SpotlightCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <FadeContent direction="up" delay={0}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/yonetim/ayarlar"
              className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'}`}
            >
              <HiOutlineArrowLeft size={20} />
            </Link>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Kampanya Sıralaması
              </h1>
              <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                Anasayfadaki kampanya slider ürün sıralamasını düzenleyin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className={`text-sm px-3 py-1 rounded-full ${
                isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
              }`}>
                Kaydedilmemiş değişiklikler
              </span>
            )}
            
            <button
              onClick={handleResetToDefault}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                isDark
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <HiOutlineRefresh size={18} />
              Varsayılana Sıfırla
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                hasChanges
                  ? 'bg-primary-500 hover:bg-primary-600 text-white'
                  : isDark
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Kaydediliyor...
                </>
              ) : saved ? (
                <>
                  <HiOutlineCheck size={18} />
                  Kaydedildi
                </>
              ) : (
                <>
                  <HiOutlineSave size={18} />
                  Kaydet
                </>
              )}
            </button>
          </div>
        </div>
      </FadeContent>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg flex items-center gap-3 ${
              isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'
            }`}
          >
            <HiOutlineX size={20} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info box */}
      <FadeContent direction="up" delay={0.1}>
        <SpotlightCard className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}>
              <ArrowUpDown size={20} className={isDark ? 'text-primary-400' : 'text-primary-600'} />
            </div>
            <div>
              <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Sürükle-Bırak Sıralama
              </h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                Ürünleri sürükleyerek anasayfadaki kampanya slider&apos;ında görünecek sıralamayı ayarlayın.
                İlk 16 ürün slider&apos;da gösterilecektir.
              </p>
            </div>
          </div>
        </SpotlightCard>
      </FadeContent>

      {/* Products list */}
      <FadeContent direction="up" delay={0.2}>
        <SpotlightCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-primary-500/20' : 'bg-primary-100'}`}>
                <Percent size={20} className={isDark ? 'text-primary-400' : 'text-primary-600'} />
              </div>
              <div>
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Kampanyalı Ürünler
                </h3>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  {products.length} ürün
                </p>
              </div>
            </div>

            <Link
              href="/haftanin-cicek-kampanyalari-vadiler-com"
              target="_blank"
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition ${
                isDark ? 'hover:bg-neutral-800 text-primary-400' : 'hover:bg-gray-100 text-primary-600'
              }`}
            >
              <HiOutlineExternalLink size={16} />
              Önizleme
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlinePhotograph size={48} className={`mx-auto mb-4 ${isDark ? 'text-neutral-600' : 'text-gray-300'}`} />
              <p className={isDark ? 'text-neutral-400' : 'text-gray-500'}>
                Kampanyalı ürün bulunamadı
              </p>
            </div>
          ) : (
            <Reorder.Group
              axis="y"
              values={products}
              onReorder={handleReorder}
              className="space-y-2"
            >
              {products.map((product, index) => (
                <Reorder.Item
                  key={product.id}
                  value={product}
                  className={`flex items-center gap-4 p-3 rounded-xl border transition cursor-grab active:cursor-grabbing ${
                    index < 16
                      ? isDark
                        ? 'bg-neutral-800/50 border-neutral-700 hover:border-primary-500/50'
                        : 'bg-white border-gray-200 hover:border-primary-300'
                      : isDark
                        ? 'bg-neutral-900/50 border-neutral-800 opacity-60'
                        : 'bg-gray-50 border-gray-100 opacity-60'
                  }`}
                >
                  {/* Drag handle */}
                  <div className={`flex-shrink-0 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                    <GripVertical size={20} />
                  </div>

                  {/* Order number */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    index < 16
                      ? isDark
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'bg-primary-100 text-primary-700'
                      : isDark
                        ? 'bg-neutral-800 text-neutral-500'
                        : 'bg-gray-200 text-gray-400'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Product image */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-100 relative">
                    <MediaImage
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                    {product.discount > 0 && (
                      <div className="absolute top-0.5 right-0.5 px-1 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">
                        -{product.discount}%
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        {formatPrice(product.price)}
                      </span>
                      {product.oldPrice && product.oldPrice > product.price && (
                        <span className={`text-xs line-through ${isDark ? 'text-neutral-600' : 'text-gray-400'}`}>
                          {formatPrice(product.oldPrice)}
                        </span>
                      )}
                      {product.rating > 0 && (
                        <span className={`flex items-center gap-1 text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                          <Star size={12} className="fill-yellow-400 text-yellow-400" />
                          {product.rating}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  {index < 16 && (
                    <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-full ${
                      isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                    }`}>
                      Slider&apos;da
                    </span>
                  )}

                  {/* Arrow buttons */}
                  <div className="flex-shrink-0 flex flex-col gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveProduct(index, 'up'); }}
                      disabled={index === 0}
                      className={`p-1 rounded transition ${
                        index === 0
                          ? 'opacity-30 cursor-not-allowed'
                          : isDark
                            ? 'hover:bg-neutral-700 text-neutral-400'
                            : 'hover:bg-gray-100 text-gray-500'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveProduct(index, 'down'); }}
                      disabled={index === products.length - 1}
                      className={`p-1 rounded transition ${
                        index === products.length - 1
                          ? 'opacity-30 cursor-not-allowed'
                          : isDark
                            ? 'hover:bg-neutral-700 text-neutral-400'
                            : 'hover:bg-gray-100 text-gray-500'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* View link */}
                  <Link
                    href={`/${product.category}/${product.slug}`}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                    className={`flex-shrink-0 p-2 rounded-lg transition ${
                      isDark ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <HiOutlineEye size={18} />
                  </Link>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </SpotlightCard>
      </FadeContent>
    </div>
  );
}
