'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SpotlightCard, FadeContent } from '@/components/admin';
import { useTheme } from '../../ThemeContext';
import { resizeImageBeforeUpload } from '@/lib/image-resize';
import {
  HiOutlineArrowLeft,
  HiOutlineTag,
  HiOutlinePhotograph,
  HiOutlineX,
  HiOutlineCheck
} from 'react-icons/hi';
import Image from 'next/image';

export default function YeniKategoriPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    order: 0,
    isActive: true
  });
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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
      .replace(/^-+|-+$/g, '');
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from name
      if (field === 'name' && !prev.slug) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Lütfen geçerli bir görsel dosyası seçin', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Görsel boyutu 5MB\'dan küçük olmalıdır', 'error');
      return;
    }

    setUploading(true);
    try {
      // Client-side resize - Cloudinary kredisi tasarrufu
      const resizedFile = await resizeImageBeforeUpload(file);
      
      const uploadData = new FormData();
      uploadData.append('file', resizedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      });

      const payload = (await response.json()) as {
        success?: boolean;
        data?: { url?: string };
        error?: string;
      };

      if (!response.ok || !payload?.success || !payload.data?.url) {
        throw new Error(payload?.error || 'Upload failed');
      }

      handleInputChange('image', payload.data.url);
      showToast('Görsel başarıyla yüklendi', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Görsel yüklenirken hata oluştu', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast('Kategori adı zorunludur', 'error');
      return;
    }
    
    if (!formData.slug.trim()) {
      showToast('Slug zorunludur', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast(data.message || 'Kategori başarıyla oluşturuldu', 'success');
        setTimeout(() => {
          router.push('/yonetim/kategoriler');
        }, 1500);
      } else {
        showToast(data.error || 'Kategori oluşturulamadı', 'error');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      showToast('Kategori oluşturulurken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <FadeContent direction="up" delay={0}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className={`p-2.5 rounded-xl transition-colors ${
              isDark 
                ? 'bg-neutral-800 text-white hover:bg-neutral-700' 
                : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Yeni Kategori Oluştur
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Ürünlerinizi düzenlemek için yeni bir kategori ekleyin
            </p>
          </div>
        </div>
      </FadeContent>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <FadeContent direction="up" delay={0.1}>
          <SpotlightCard className="p-6">
            <div className="space-y-5">
              {/* Category Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                  Kategori Adı *
                </label>
                <div className="relative">
                  <HiOutlineTag className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="ör: Vazolar"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl focus:outline-none transition-colors
                      ${isDark 
                        ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                        : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                    required
                  />
                </div>
              </div>

              {/* Slug */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                  Slug (URL için) *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="vazolar"
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors font-mono text-sm
                    ${isDark 
                      ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                  required
                />
                <p className={`text-xs mt-1.5 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                  URL&apos;de görünecek: /kategoriler/{formData.slug || 'slug'}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Kategori açıklaması..."
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors resize-none
                    ${isDark 
                      ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                  Kategori Görseli
                </label>
                
                <div className="space-y-3">
                  {/* Manual URL Input */}
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => handleInputChange('image', e.target.value)}
                      placeholder="Görsel URL'si (örn: https://res.cloudinary.com/...)"
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors
                        ${isDark 
                          ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                          : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                    />
                  </div>

                  <div className={`flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    <div className="flex-1 h-px bg-current opacity-20"></div>
                    <span className="text-xs">VEYA</span>
                    <div className="flex-1 h-px bg-current opacity-20"></div>
                  </div>

                  {/* Upload Button */}
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors
                      ${isDark 
                        ? 'bg-neutral-800 border-2 border-dashed border-neutral-700 hover:border-neutral-600 text-neutral-300' 
                        : 'bg-gray-50 border-2 border-dashed border-gray-300 hover:border-purple-500 text-gray-600'}
                      ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <HiOutlinePhotograph className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {uploading ? 'Yükleniyor...' : 'Bilgisayardan Görsel Seç'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    
                    {formData.image && (
                      <button
                        type="button"
                        onClick={() => handleInputChange('image', '')}
                        className={`px-4 py-3 rounded-xl transition-colors
                          ${isDark 
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                            : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                      >
                        <HiOutlineX className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  {/* Image Preview */}
                  {formData.image && (
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Görsel Önizleme:</p>
                      <div className="relative w-full h-40 rounded-lg overflow-hidden">
                        <Image
                          src={formData.image}
                          alt="Preview"
                          fill
                          className="object-cover"
                          onError={() => handleInputChange('image', '')}
                        />
                      </div>
                    </div>
                  )}
                  
                  <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    ℹ️ Manuel URL girebilir veya JPG, PNG, WebP (max 5MB) yükleyebilirsiniz
                  </p>
                </div>
              </div>

              {/* Order & Active Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    Sıralama
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 0)}
                    className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors
                      ${isDark 
                        ? 'bg-neutral-800 border border-neutral-700 text-white focus:border-neutral-600' 
                        : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-purple-500'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    Durum
                  </label>
                  <div className="flex items-center h-[50px]">
                    <button
                      type="button"
                      onClick={() => handleInputChange('isActive', !formData.isActive)}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors
                        ${formData.isActive 
                          ? 'bg-emerald-500' 
                          : isDark ? 'bg-neutral-700' : 'bg-gray-300'}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform
                          ${formData.isActive ? 'translate-x-8' : 'translate-x-1'}`}
                      />
                    </button>
                    <span className={`ml-3 text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      {formData.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </FadeContent>

        {/* Action Buttons */}
        <FadeContent direction="up" delay={0.2}>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors
                ${isDark 
                  ? 'text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700' 
                  : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'}`}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.slug.trim()}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors 
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isDark 
                  ? 'bg-white text-black hover:bg-neutral-200' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'}`}
            >
              {loading ? 'Oluşturuluyor...' : 'Kategori Oluştur'}
            </button>
          </div>
        </FadeContent>
      </form>

      {/* Toast Notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 z-[110]"
        >
          <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl min-w-[300px] ${
            toast.type === 'success' 
              ? isDark ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200'
              : isDark ? 'bg-red-500/20 border border-red-500/30' : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`}>
              {toast.type === 'success' ? (
                <HiOutlineCheck className="w-5 h-5 text-white" />
              ) : (
                <HiOutlineX className="w-5 h-5 text-white" />
              )}
            </div>
            <p className={`text-sm font-medium ${
              toast.type === 'success'
                ? isDark ? 'text-emerald-300' : 'text-emerald-700'
                : isDark ? 'text-red-300' : 'text-red-700'
            }`}>
              {toast.message}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
