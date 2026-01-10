'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FadeContent, SpotlightCard } from '@/components/admin';
import { useTheme } from '../../ThemeContext';
import { resizeImageBeforeUpload } from '@/lib/image-resize';
import {
  HiOutlineArrowLeft,
  HiOutlinePhotograph,
  HiOutlineVideoCamera,
  HiOutlineCloudUpload,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineSparkles
} from 'react-icons/hi';

interface CategoryCoverForm {
  id: number;
  name: string;
  slug: string;
  image: string;
  coverType: 'image' | 'video';
  coverImage: string;
  coverMobileImage: string;
  coverVideo: string;
  coverOverlay: string;
  coverCtaText: string;
  coverSubtitle: string;
}

type ToastState = { message: string; type: 'success' | 'error' } | null;

type CoverField = keyof Pick<
  CategoryCoverForm,
  'coverImage' | 'coverMobileImage' | 'coverVideo'
>;

export default function CategoryCoverManagerPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [categories, setCategories] = useState<CategoryCoverForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?all=true');
        const data = await response.json();
        const list = (data.categories || data.data || []).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          image: cat.image || '',
          coverType: cat.coverType === 'video' ? 'video' : 'image',
          coverImage: cat.coverImage || cat.image || '',
          coverMobileImage: cat.coverMobileImage || '',
          coverVideo: cat.coverVideo || '',
          coverOverlay: cat.coverOverlay || 'dark',
          coverCtaText: cat.coverCtaText || 'Keşfet',
          coverSubtitle: cat.coverSubtitle || '',
        })) as CategoryCoverForm[];
        setCategories(list);
      } catch (error) {
        console.error('Error fetching categories:', error);
        showToast('Kategoriler yüklenemedi', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFieldChange = (id: number, field: keyof CategoryCoverForm, value: string) => {
    setCategories(prev => prev.map(cat => (
      cat.id === id ? { ...cat, [field]: value } : cat
    )));
  };

  const uploadMedia = async (
    id: number,
    field: CoverField,
    file: File | undefined | null,
    type: 'image' | 'video'
  ) => {
    if (!file) return;

    if (type === 'image' && !file.type.startsWith('image/')) {
      showToast('Lütfen geçerli bir görsel seçin', 'error');
      return;
    }

    if (type === 'video' && !file.type.startsWith('video/')) {
      showToast('Lütfen geçerli bir video seçin', 'error');
      return;
    }

    setUploadingField(`${id}-${field}`);
    try {
      // Client-side resize - Cloudinary kredisi tasarrufu (sadece image için)
      const fileToUpload = type === 'image' ? await resizeImageBeforeUpload(file) : file;
      
      const formData = new FormData();
      formData.append('file', fileToUpload);
      const endpoint = type === 'video' ? '/api/upload/video' : '/api/upload';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Yükleme başarısız');
      }

      handleFieldChange(id, field, payload.data?.url || '');
      showToast('Medya başarıyla yüklendi', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Medya yüklenirken hata oluştu', 'error');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async (category: CategoryCoverForm) => {
    setSavingId(category.id);
    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: category.id,
          coverType: category.coverType,
          coverImage: category.coverImage,
          coverMobileImage: category.coverMobileImage,
          coverVideo: category.coverVideo,
          coverOverlay: category.coverOverlay,
          coverCtaText: category.coverCtaText,
          coverSubtitle: category.coverSubtitle,
        })
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Güncelleme başarısız');
      }

      showToast('Kapak bilgileri güncellendi', 'success');
    } catch (error) {
      console.error('Save error:', error);
      showToast('Kaydedilirken bir hata oluştu', 'error');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className={`text-center ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
          <div
            className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4"
            style={{ borderColor: isDark ? '#525252 transparent #525252 #525252' : '#d1d5db transparent #d1d5db #d1d5db' }}
          />
          <p>Kategori kapakları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <FadeContent direction="up" delay={0}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Kategori Kapak Yönetimi
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Ana sayfadaki kartlarda görünen görsel/video kapaklarını buradan güncelleyebilirsiniz.
            </p>
          </div>
          <button
            onClick={() => router.push('/yonetim/kategoriler')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              isDark ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-white text-gray-900 border border-gray-200 hover:border-gray-300'
            }`}
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
            Kategori Listesine Dön
          </button>
        </div>
      </FadeContent>

      <div className="grid gap-5">
        {categories.map(category => (
          <FadeContent key={category.id} direction="up" delay={0.05}>
            <SpotlightCard className="p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Preview */}
                <div className="w-full lg:w-1/3">
                  <div className={`rounded-2xl overflow-hidden border ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                    <div className="relative aspect-[3/4] bg-gray-100">
                      {category.coverType === 'video' && category.coverVideo ? (
                        <video
                          src={category.coverVideo}
                          controls
                          playsInline
                          poster={category.coverImage || category.image}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : category.coverImage || category.image ? (
                        <Image
                          src={category.coverImage || category.image}
                          alt={category.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-5xl">🌸</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-xs uppercase tracking-wide text-white/70">{category.slug}</p>
                        <h3 className="text-white text-lg font-semibold">{category.name}</h3>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="flex-1 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                        Kapak Türü
                      </label>
                      <select
                        value={category.coverType}
                        onChange={(e) => handleFieldChange(category.id, 'coverType', e.target.value as 'image' | 'video')}
                        className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none ${
                          isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-200'
                        }`}
                      >
                        <option value="image">Görsel</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                        CTA Metni
                      </label>
                      <input
                        type="text"
                        value={category.coverCtaText}
                        onChange={(e) => handleFieldChange(category.id, 'coverCtaText', e.target.value)}
                        className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none ${
                          isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-200'
                        }`}
                        placeholder="Keşfet"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      Kapak Alt Başlığı
                    </label>
                    <textarea
                      rows={2}
                      value={category.coverSubtitle}
                      onChange={(e) => handleFieldChange(category.id, 'coverSubtitle', e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none resize-none ${
                        isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-200'
                      }`}
                      placeholder="Örn: Her güne özel çiçekler"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MediaField
                      label="Kapak Görseli"
                      value={category.coverImage}
                      placeholder="https://..."
                      icon={<HiOutlinePhotograph className="w-5 h-5" />}
                      isDark={isDark}
                      uploading={uploadingField === `${category.id}-coverImage`}
                      onChange={(val) => handleFieldChange(category.id, 'coverImage', val)}
                      onUpload={(file) => uploadMedia(category.id, 'coverImage', file, 'image')}
                    />
                    <MediaField
                      label="Mobil Yedek Görsel"
                      value={category.coverMobileImage}
                      placeholder="https://..."
                      icon={<HiOutlinePhotograph className="w-5 h-5" />}
                      isDark={isDark}
                      uploading={uploadingField === `${category.id}-coverMobileImage`}
                      onChange={(val) => handleFieldChange(category.id, 'coverMobileImage', val)}
                      onUpload={(file) => uploadMedia(category.id, 'coverMobileImage', file, 'image')}
                    />
                  </div>

                  {category.coverType === 'video' && (
                    <MediaField
                      label="Kapak Videosu"
                      value={category.coverVideo}
                      placeholder="https://..."
                      icon={<HiOutlineVideoCamera className="w-5 h-5" />}
                      isDark={isDark}
                      uploading={uploadingField === `${category.id}-coverVideo`}
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(val) => handleFieldChange(category.id, 'coverVideo', val)}
                      onUpload={(file) => uploadMedia(category.id, 'coverVideo', file, 'video')}
                    />
                  )}

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      Overlay (örn: dark, light, none veya Tailwind sınıfları)
                    </label>
                    <input
                      type="text"
                      value={category.coverOverlay}
                      onChange={(e) => handleFieldChange(category.id, 'coverOverlay', e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none ${
                        isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-200'
                      }`}
                    />
                    <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                      Varsayılan değerler: <strong>dark</strong>, <strong>light</strong>, <strong>none</strong>
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleFieldChange(category.id, 'coverSubtitle', '')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium ${
                        isDark ? 'text-neutral-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Temizle
                    </button>
                    <button
                      onClick={() => handleSave(category)}
                      disabled={savingId === category.id}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors ${
                        savingId === category.id
                          ? 'bg-primary-400 text-white opacity-70 cursor-not-allowed'
                          : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                    >
                      {savingId === category.id ? 'Kaydediliyor...' : 'Kaydet'}
                      <HiOutlineCheckCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </FadeContent>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            {toast.type === 'success' ? (
              <HiOutlineSparkles className="w-5 h-5" />
            ) : (
              <HiOutlineXCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface MediaFieldProps {
  label: string;
  value: string;
  placeholder: string;
  icon: ReactNode;
  isDark: boolean;
  uploading: boolean;
  onChange: (value: string) => void;
  onUpload: (file: File | null | undefined) => void;
  accept?: string;
}

function MediaField({
  label,
  value,
  placeholder,
  icon,
  isDark,
  uploading,
  onChange,
  onUpload,
  accept = 'image/*'
}: MediaFieldProps) {
  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
        {label}
      </label>
      <div className="space-y-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none ${
            isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-200'
          }`}
        />
        <label
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed cursor-pointer text-sm font-medium transition-colors ${
            isDark
              ? 'border-neutral-700 text-neutral-300 hover:border-neutral-500'
              : 'border-gray-300 text-gray-600 hover:border-primary-500'
          } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input
            type="file"
            accept={accept}
            disabled={uploading}
            className="hidden"
            onChange={(e) => onUpload(e.target.files?.[0])}
          />
          {uploading ? 'Yükleniyor...' : (
            <>
              {icon}
              <span>Dosya Yükle</span>
              <HiOutlineCloudUpload className="w-5 h-5" />
            </>
          )}
        </label>
      </div>
    </div>
  );
}
