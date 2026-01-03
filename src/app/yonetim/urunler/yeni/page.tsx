'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from '@/app/yonetim/ThemeContext';
import ImageUpload from '@/components/admin/ImageUpload';

type CategoryOption = {
  id?: string | number;
  slug?: string;
  name: string;
};

export default function YeniUrunPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
    badge: '',
    inStock: true,
    stockCount: 0,
  });

  useEffect(() => {
    // Fetch categories from API
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategories(data.categories || data.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const name = formData.name.trim();
      if (!name) {
        setErrorMessage('Ürün adı zorunludur');
        return;
      }

      if (!formData.category) {
        setErrorMessage('Kategori seçiniz');
        return;
      }

      if (!formData.image) {
        setErrorMessage('Ana görsel zorunludur');
        return;
      }

      if (formData.price <= 0) {
        setErrorMessage('Fiyat 0’dan büyük olmalıdır');
        return;
      }

      if (formData.discountedPrice > 0 && formData.discountedPrice >= formData.price) {
        setErrorMessage('İndirimli fiyat normal fiyattan küçük olmalıdır');
        return;
      }

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

      // Prepare product data with calculated discount.
      // NOTE: Do not send slug/sku here; API will generate unique values.
      const productData = {
        ...formData,
        name,
        price: finalPrice,
        oldPrice,
        discount,
      };

      // Remove discountedPrice as it's not a database field
      const { discountedPrice: _discountedPrice, ...dataToSend } = productData;
      void _discountedPrice;

      // Include secondary/tertiary categories as occasionTags array
      const extras = [] as string[];
      if (formData.secondaryCategory) extras.push(formData.secondaryCategory);
      if ((formData as any).tertiaryCategory) extras.push((formData as any).tertiaryCategory);
      if (extras.length > 0) {
        (dataToSend as any).occasionTags = extras;
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage('Ürün başarıyla eklendi!');
        setTimeout(() => {
          router.push('/yonetim/urunler');
        }, 1500);
      } else {
        setErrorMessage(data.error || 'Ürün eklenirken bir hata oluştu');
      }
    } catch (error: unknown) {
      console.error('Error creating product:', error);
      const message = error instanceof Error ? error.message : 'Ürün eklenirken bir hata oluştu';
      setErrorMessage(message);
    } finally {
      setSaving(false);
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
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

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
          <h1 className={`text-2xl font-bold ${headingClasses}`}>Yeni Ürün Ekle</h1>
          <p className={`text-sm ${textMutedClasses}`}>Yeni bir ürün oluşturun</p>
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
                    placeholder="ör: Kırmızı Güller Buketi"
                    className={`w-full px-4 py-2.5 border rounded-xl transition-all ${inputClasses}`}
                    required
                  />
                  {formData.name && (
                    <p className={`text-xs mt-1 ${textMutedClasses}`}>
                      Slug: {generateSlug(formData.name)}
                    </p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${labelClasses}`}>
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    placeholder="Ürün açıklaması..."
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
                      <option value="">Kategori seçin</option>
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
                      value={formData.price || ''}
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
                      value={formData.discountedPrice || ''}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Ürün Ekle
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
