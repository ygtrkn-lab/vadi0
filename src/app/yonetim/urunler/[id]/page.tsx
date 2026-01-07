'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Product } from '@/data/products';
import { useTheme } from '@/app/yonetim/ThemeContext';
import ImageUpload from '@/components/admin/ImageUpload';
import { resizeImageBeforeUpload } from '@/lib/image-resize';

type CategoryOption = {
  id?: string | number;
  slug?: string;
  name: string;
};

export default function UrunDuzenlePage() {
  const params = useParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const productId = parseInt(params.id as string);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    discountedPrice: 0,
    category: '',
    secondaryCategory: '',
    tertiaryCategory: '',
    description: '',
    image: '',
    hoverImage: '',
    gallery: [] as string[],
    rating: 5,
    reviewCount: 0,
    badge: '',
    inStock: true,
    stockCount: 0,
  });

  // Fetch product and categories from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product and categories in parallel
        const [productRes, categoriesRes] = await Promise.all([
          fetch(`/api/products/${productId}`),
          fetch('/api/categories')
        ]);

        const productData = await productRes.json();
        const categoriesData = await categoriesRes.json();

        console.log('📋 Categories Response:', categoriesData);
        console.log('📦 Categories count:', categoriesData.categories?.length || 0);

        // Set product
        if (productData.success && productData.data) {
          const foundProduct = productData.data;
          setProduct(foundProduct);
          
          // Calculate discounted price from existing discount
          let discountedPrice = 0;
          if (foundProduct.discount > 0 && foundProduct.price > 0) {
            // If discount exists, calculate what the discounted price would be
            // But the current price IS the discounted price, so use it
            discountedPrice = foundProduct.price;
          }
          
          const categoriesFromProduct = [
            ...(Array.isArray((foundProduct as any).categories) ? (foundProduct as any).categories : []),
            ...(Array.isArray((foundProduct as any).occasion_tags) ? (foundProduct as any).occasion_tags : []),
          ];
          const extras = categoriesFromProduct.filter(
            (c: string) => c && c !== foundProduct.category && c !== 'dogum-gunu-hediyeleri'
          );
          const secondaryCategory = extras[0] || '';
          const tertiaryCategory = extras[1] || '';

          setFormData({
            name: foundProduct.name || '',
            price: foundProduct.oldPrice || foundProduct.old_price || foundProduct.price || 0,
            discountedPrice: discountedPrice,
            category: foundProduct.category || '',
            secondaryCategory,
            tertiaryCategory,
            description: foundProduct.description || '',
            image: foundProduct.image || '',
            hoverImage: foundProduct.hoverImage || foundProduct.hover_image || '',
            gallery: foundProduct.gallery || [],
            rating: foundProduct.rating || 5,
            reviewCount: foundProduct.reviewCount || foundProduct.review_count || 0,
            badge: '',
            inStock: foundProduct.inStock !== false && foundProduct.in_stock !== false,
          });
        }

        // Set categories
        const cats = categoriesData.categories || categoriesData.data || [];
        console.log('✅ Setting categories:', cats.length, cats);
        setCategories(cats);
      } catch (error) {
        console.error('❌ Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Calculate discount percentage from prices
      let discount = 0;
      let finalPrice = formData.price;
      let oldPrice = formData.price;

      if (formData.discountedPrice > 0 && formData.discountedPrice < formData.price) {
        // User entered a discounted price
        discount = Math.round((1 - formData.discountedPrice / formData.price) * 100);
        finalPrice = formData.discountedPrice;
        oldPrice = formData.price;
      }

      // Prepare product data with calculated discount
      const productData = {
        ...formData,
        price: finalPrice,
        oldPrice: oldPrice,
        discount: discount
      };

      // Remove discountedPrice as it's not a database field
      const { discountedPrice: _discountedPrice, ...dataToSend } = productData;
      void _discountedPrice;

      // Ensure occasion_tags contains secondary and tertiary (if present)
      const occ: string[] = [];
      if (productData.secondaryCategory) occ.push(productData.secondaryCategory);
      if ((productData as any).tertiaryCategory) occ.push((productData as any).tertiaryCategory);
      if (occ.length > 0) {
        (dataToSend as any).occasion_tags = occ;
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage('Ürün başarıyla güncellendi!');
        setProduct(data.data);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.error || 'Ürün güncellenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setErrorMessage('Ürün güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        alert('Ürün başarıyla silindi!');
        router.push('/yonetim/urunler');
      } else {
        setErrorMessage(data.error || 'Ürün silinirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setErrorMessage('Ürün silinirken bir hata oluştu');
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGalleryUploading(true);
    try {
      // Client-side resize - Cloudinary kredisi tasarrufu
      const resizedFile = await resizeImageBeforeUpload(file);
      
      const formDataUpload = new FormData();
      formDataUpload.append('file', resizedFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();

      if (data.success) {
        setFormData(prev => ({ ...prev, gallery: [...prev.gallery, data.data.url] }));
      }
    } catch (error) {
      console.error('Gallery upload error:', error);
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className={isDark ? 'text-neutral-400' : 'text-slate-500'}>Ürün yükleniyor...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className={`w-16 h-16 mb-4 ${isDark ? 'text-neutral-600' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Ürün Bulunamadı</h2>
        <p className={`mb-4 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>ID: {productId} ile eşleşen ürün bulunamadı.</p>
        <Link
          href="/yonetim/urunler"
          className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
        >
          Ürünlere Dön
        </Link>
      </div>
    );
  }

  // Dynamic classes based on theme
  const cardClasses = isDark
    ? 'bg-neutral-900 border-neutral-800'
    : 'bg-white border-slate-100';
  const inputClasses = isDark
    ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:ring-primary-500/20 focus:border-primary-500'
    : 'bg-white border-slate-200 text-slate-900 focus:ring-primary-500/20 focus:border-primary-500';
  const selectClasses = isDark
    ? 'bg-neutral-800 border-neutral-700 text-white'
    : 'bg-white border-slate-200 text-slate-900';
  const labelClasses = isDark ? 'text-neutral-300' : 'text-slate-700';
  const headingClasses = isDark ? 'text-white' : 'text-slate-800';
  const textMutedClasses = isDark ? 'text-neutral-400' : 'text-slate-500';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-3 rounded-xl flex items-center gap-2 ${isDark ? 'bg-green-900/50 border border-green-800 text-green-400' : 'bg-green-50 border border-green-200 text-green-700'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </motion.div>
      )}

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-3 rounded-xl flex items-center gap-2 ${isDark ? 'bg-red-900/50 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {errorMessage}
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/yonetim/urunler"
            className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-slate-100'}`}
          >
            <svg className={`w-5 h-5 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className={`text-2xl font-bold ${headingClasses}`}>Ürün Düzenle</h1>
            <p className={`text-sm ${textMutedClasses}`}>ID: {product.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-colors ${isDark
                ? 'border-red-800 text-red-400 hover:bg-red-900/30'
                : 'border-red-200 text-red-600 hover:bg-red-50'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Sil
          </button>
          <Link
            href={`/${product.category}/${product.slug}`}
            target="_blank"
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-colors ${isDark
                ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Önizle
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-6 shadow-sm border ${cardClasses}`}
            >
              <h2 className={`text-lg font-semibold mb-4 ${headingClasses}`}>Temel Bilgiler</h2>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${labelClasses}`}>
                    Ürün Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-xl transition-all ${inputClasses}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${labelClasses}`}>
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-2.5 border rounded-xl transition-all resize-none ${inputClasses}`}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${labelClasses}`}>
                      Kategori *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl transition-all ${selectClasses}`}
                      required
                    >
                      <option value="">Kategori Seçin</option>
                      {categories.map(cat => (
                        <option key={cat.slug || cat.id} value={cat.slug || cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${labelClasses}`}>
                      2. Kategori (opsiyonel)
                    </label>
                    <select
                      value={formData.secondaryCategory}
                      onChange={(e) => handleInputChange('secondaryCategory', e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl transition-all ${selectClasses}`}
                    >
                      <option value="">Seçimsiz (sadece ana kategori)</option>
                      {categories.map(cat => (
                        <option key={cat.slug || cat.id} value={cat.slug || cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${labelClasses}`}>
                      3. Kategori (opsiyonel)
                    </label>
                    <select
                      value={(formData as any).tertiaryCategory}
                      onChange={(e) => handleInputChange('tertiaryCategory', e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl transition-all ${selectClasses}`}
                    >
                      <option value="">Seçimsiz</option>
                      {categories.map(cat => (
                        <option key={cat.slug || cat.id} value={cat.slug || cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${labelClasses}`}>
                      Rozet
                    </label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => handleInputChange('badge', e.target.value)}
                      placeholder="ör: Yeni, Çok Satan"
                      className={`w-full px-4 py-2.5 border rounded-xl transition-all ${inputClasses}`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Pricing Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-6 shadow-sm border ${cardClasses}`}
            >
              <h2 className={`text-lg font-semibold mb-4 ${headingClasses}`}>Fiyatlandırma</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${labelClasses}`}>
                    Normal Fiyat *
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMutedClasses}`}>₺</span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className={`w-full pl-8 pr-4 py-2.5 border rounded-xl transition-all ${inputClasses}`}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className={`text-xs mt-1 ${textMutedClasses}`}>Ürünün orijinal fiyatını girin</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${labelClasses}`}>
                    İndirimli Fiyat
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMutedClasses}`}>₺</span>
                    <input
                      type="number"
                      value={formData.discountedPrice}
                      onChange={(e) => handleInputChange('discountedPrice', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className={`w-full pl-8 pr-4 py-2.5 border rounded-xl transition-all ${inputClasses}`}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className={`text-xs mt-1 ${textMutedClasses}`}>İndirimli satış fiyatını girin (isteğe bağlı)</p>
                </div>
              </div>

              {/* Dynamic Price Preview */}
              {formData.price > 0 && (
                <div className={`mt-5 p-4 rounded-xl border ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${textMutedClasses}`}>Fiyat Özeti</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${textMutedClasses}`}>Normal Fiyat:</span>
                      <span className={`text-sm font-semibold ${headingClasses}`}>₺{formData.price.toFixed(2)}</span>
                    </div>
                    
                    {formData.discountedPrice > 0 && formData.discountedPrice < formData.price && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${textMutedClasses}`}>İndirimli Fiyat:</span>
                          <span className={`text-sm font-semibold ${headingClasses}`}>₺{formData.discountedPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${textMutedClasses}`}>İndirim Oranı:</span>
                          <span className="text-sm font-semibold text-red-500">
                            %{Math.round((1 - formData.discountedPrice / formData.price) * 100)}
                          </span>
                        </div>
                        <div className={`flex items-center justify-between pt-2 border-t ${isDark ? 'border-neutral-700' : 'border-gray-200'}`}>
                          <span className={`text-base font-semibold ${headingClasses}`}>Tasarruf:</span>
                          <span className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            ₺{(formData.price - formData.discountedPrice).toFixed(2)}
                          </span>
                        </div>
                        <div className={`flex items-center justify-center gap-2 mt-2 p-2 rounded-lg ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                          <span className="text-xs text-emerald-600 font-medium">
                            ✓ Müşteri %{Math.round((1 - formData.discountedPrice / formData.price) * 100)} indirim kazanıyor
                          </span>
                        </div>
                      </>
                    )}
                    
                    {(!formData.discountedPrice || formData.discountedPrice === 0 || formData.discountedPrice >= formData.price) && (
                      <div className={`flex items-center justify-between pt-2 border-t ${isDark ? 'border-neutral-700' : 'border-gray-200'}`}>
                        <span className={`text-base font-semibold ${headingClasses}`}>Satış Fiyatı:</span>
                        <span className={`text-lg font-bold ${headingClasses}`}>₺{formData.price.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {formData.discountedPrice > formData.price && (
                      <div className={`flex items-center justify-center gap-2 mt-2 p-2 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                        <span className="text-xs text-red-600 font-medium">
                          ⚠ İndirimli fiyat normal fiyattan yüksek olamaz
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Images Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-6 shadow-sm border ${cardClasses}`}
            >
              <h2 className={`text-lg font-semibold mb-4 ${headingClasses}`}>Görseller</h2>

              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <ImageUpload
                    value={formData.image}
                    onChange={(url) => handleInputChange('image', url)}
                    label="Ana Görsel"
                    required
                    isDark={isDark}
                  />

                  <ImageUpload
                    value={formData.hoverImage}
                    onChange={(url) => handleInputChange('hoverImage', url)}
                    label="Hover Görsel"
                    isDark={isDark}
                  />
                </div>

                {/* Gallery */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className={`text-sm font-medium ${labelClasses}`}>
                      Galeri ({formData.gallery.length} görsel)
                    </label>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={galleryUploading}
                      className="text-sm text-primary-500 hover:text-primary-400 font-medium disabled:opacity-50"
                    >
                      {galleryUploading ? 'Yükleniyor...' : '+ Ekle'}
                    </button>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleGalleryUpload}
                      className="hidden"
                    />
                  </div>
                  {formData.gallery.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {formData.gallery.map((img, index) => (
                        <div key={index} className={`relative aspect-square rounded-lg overflow-hidden group ${isDark ? 'bg-neutral-800' : 'bg-slate-100'}`}>
                          <img
                            src={img}
                            alt={`Galeri ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder.svg';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full 
                              opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-sm ${textMutedClasses}`}>Henüz galeri görseli eklenmemiş</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`rounded-2xl p-6 shadow-sm border ${cardClasses}`}
            >
              <h2 className={`text-lg font-semibold mb-4 ${headingClasses}`}>Durum</h2>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.inStock}
                    onChange={(e) => handleInputChange('inStock', e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                  />
                  <div>
                    <span className={`font-medium ${headingClasses}`}>Stokta</span>
                    <p className={`text-xs ${textMutedClasses}`}>Ürün satışa açık</p>
                  </div>
                </label>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${labelClasses}`}>
                    Stok Adedi
                  </label>
                  <input
                    type="number"
                    value={formData.stockCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0;
                      handleInputChange('stockCount', count);
                      // Auto-update inStock based on count
                      if (count === 0 && formData.inStock) {
                        handleInputChange('inStock', false);
                      }
                    }}
                    className={`w-full px-4 py-2.5 border rounded-xl transition-all ${inputClasses}`}
                    min="0"
                    step="1"
                    placeholder="Stok miktarı"
                  />
                  <p className={`text-xs mt-1.5 ${textMutedClasses}`}>
                    {formData.stockCount === 0 ? 'Stok tükendi - Ürün otomatik olarak satıştan kalkacak' : `${formData.stockCount} adet ürün mevcut`}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Reviews Card - Read Only */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-6 shadow-sm border ${cardClasses}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${headingClasses}`}>Değerlendirme İstatistikleri</h2>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                  Otomatik
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div>
                    <p className={`text-sm font-medium mb-1 ${labelClasses}`}>Ortalama Puan</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-yellow-500">{formData.rating.toFixed(1)}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-4 h-4 ${i < Math.round(formData.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium mb-1 ${labelClasses}`}>Toplam Değerlendirme</p>
                    <span className="text-2xl font-bold" style={{ color: '#e05a4c' }}>{formData.reviewCount}</span>
                  </div>
                </div>
                
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg`}>
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Bu değerler müşteri değerlendirmelerinden otomatik hesaplanır. Manuel olarak değiştirilemez.</span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-6 shadow-sm border ${cardClasses}`}
            >
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 px-4 bg-primary-500 text-white rounded-xl font-semibold
                  hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl
                  flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Değişiklikleri Kaydet
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className={`w-full mt-3 py-3 px-4 rounded-xl font-medium transition-colors ${isDark
                    ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                İptal
              </button>
            </motion.div>
          </div>
        </div>
      </form>
    </div>
  );
}
