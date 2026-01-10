'use client';

import { useState, useRef } from 'react';
import { resizeImageBeforeUpload } from '@/lib/image-resize';
import { HiOutlinePhotograph, HiOutlineVideoCamera, HiOutlinePlay } from 'react-icons/hi';

interface MediaUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
  isDark?: boolean;
  acceptVideo?: boolean; // Video yüklemeye izin ver
}

// URL'den medya türünü belirle
export function getMediaType(url: string): 'image' | 'video' | 'unknown' {
  if (!url) return 'unknown';
  const lowered = url.toLowerCase();
  // Video uzantıları
  if (lowered.includes('.mp4') || lowered.includes('.webm') || lowered.includes('.mov') || lowered.includes('/video/')) {
    return 'video';
  }
  // Image uzantıları veya cloudinary image paths
  if (lowered.includes('.jpg') || lowered.includes('.jpeg') || lowered.includes('.png') || lowered.includes('.gif') || lowered.includes('.webp') || lowered.includes('/image/')) {
    return 'image';
  }
  return 'unknown';
}

export default function MediaUpload({ value, onChange, label, required, isDark = false, acceptVideo = false }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const validTypes = acceptVideo ? [...validImageTypes, ...validVideoTypes] : validImageTypes;

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    // Validate file type
    if (!validTypes.includes(file.type)) {
      const acceptedFormats = acceptVideo 
        ? 'JPEG, PNG, GIF, WebP, MP4, WebM veya MOV' 
        : 'JPEG, PNG, GIF ve WebP';
      setError(`Geçersiz dosya tipi. Sadece ${acceptedFormats} desteklenir.`);
      return;
    }

    // Validate file size
    const maxSize = isVideo ? 25 * 1024 * 1024 : 5 * 1024 * 1024; // Video: 25MB, Image: 5MB
    if (file.size > maxSize) {
      setError(`Dosya boyutu ${isVideo ? '25MB' : '5MB'}'dan büyük olamaz.`);
      return;
    }

    setError('');
    setUploading(true);

    try {
      let fileToUpload: File | Blob = file;
      
      // Client-side resize - sadece görsel için
      if (isImage) {
        fileToUpload = await resizeImageBeforeUpload(file);
      }
      
      const formData = new FormData();
      formData.append('file', fileToUpload);

      // Video için farklı endpoint
      const endpoint = isVideo ? '/api/upload/video' : '/api/upload';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        onChange(data.data.url);
      } else {
        setError(data.error || 'Dosya yüklenemedi');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Dosya yüklenirken bir hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeMedia = () => {
    onChange('');
  };

  const mediaType = getMediaType(value);
  const isVideoValue = mediaType === 'video';

  const acceptAttr = acceptVideo 
    ? 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime' 
    : 'image/jpeg,image/png,image/gif,image/webp';

  return (
    <div className="space-y-2">
      {label && (
        <label className={`block text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
          {label} {required && '*'}
        </label>
      )}

      {value ? (
        <div className="relative">
          <div className={`relative aspect-square w-full max-w-[200px] rounded-xl overflow-hidden ${isDark ? 'bg-neutral-800' : 'bg-slate-100'}`}>
            {isVideoValue ? (
              <div className="relative w-full h-full group">
                <video
                  src={value}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                />
                {/* Video indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center group-hover:opacity-0 transition-opacity">
                    <HiOutlinePlay className="w-6 h-6 text-white ml-1" />
                  </div>
                </div>
                {/* Video badge */}
                <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-purple-500 text-white text-xs font-medium flex items-center gap-1">
                  <HiOutlineVideoCamera className="w-3 h-3" />
                  Video
                </div>
              </div>
            ) : (
              <img
                src={value}
                alt="Yüklenen görsel"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
            )}
            <button
              type="button"
              onClick={removeMedia}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full 
                flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-neutral-500' : 'text-slate-500'} truncate max-w-[200px]`}>
            {value}
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`mt-2 text-sm font-medium ${isDark ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'}`}
          >
            Değiştir
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
            ${dragOver 
              ? (isDark ? 'border-primary-500 bg-primary-500/10' : 'border-primary-500 bg-primary-50') 
              : (isDark ? 'border-neutral-700 hover:border-neutral-600' : 'border-slate-200 hover:border-slate-300')
            }
            ${isDark ? 'bg-neutral-900/50' : 'bg-slate-50'}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center py-4">
              <svg className="animate-spin w-8 h-8 text-primary-500 mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Yükleniyor...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              <div className="flex items-center gap-2 mb-3">
                <HiOutlinePhotograph className={`w-8 h-8 ${isDark ? 'text-neutral-600' : 'text-slate-400'}`} />
                {acceptVideo && (
                  <>
                    <span className={`text-lg ${isDark ? 'text-neutral-600' : 'text-slate-400'}`}>/</span>
                    <HiOutlineVideoCamera className={`w-8 h-8 ${isDark ? 'text-purple-500' : 'text-purple-400'}`} />
                  </>
                )}
              </div>
              <p className={`text-sm mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                <span className="font-medium text-primary-500">Dosya seçin</span> veya sürükleyip bırakın
              </p>
              <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                {acceptVideo 
                  ? 'PNG, JPG, GIF, WebP (max. 5MB) veya MP4, WebM, MOV (max. 25MB)' 
                  : 'PNG, JPG, GIF veya WebP (max. 5MB)'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
