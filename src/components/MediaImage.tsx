'use client';

import Image, { ImageProps } from 'next/image';

/**
 * Video URL'si mi kontrol eder
 */
export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov|ogg)$/i.test(url);
}

/**
 * Media türünü döndürür
 */
export function getMediaType(url: string | null | undefined): 'image' | 'video' | 'unknown' {
  if (!url) return 'unknown';
  if (/\.(mp4|webm|mov|ogg)$/i.test(url)) return 'video';
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(url)) return 'image';
  // Cloudinary veya diğer CDN'ler için default image kabul et
  if (url.includes('cloudinary') || url.includes('res.cloudinary.com')) return 'image';
  return 'unknown';
}

interface MediaImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
  videoClassName?: string;
}

/**
 * Video ve resim URL'lerini otomatik olarak işleyen Image component'i
 * - Video URL'si varsa <video> elementi render eder
 * - Resim URL'si varsa <Image> elementi render eder
 */
export default function MediaImage({ 
  src, 
  alt, 
  className, 
  videoClassName,
  fill,
  width,
  height,
  sizes,
  ...rest 
}: MediaImageProps) {
  if (!src) {
    return (
      <div className={`bg-gray-200 dark:bg-neutral-800 flex items-center justify-center ${className || ''}`}>
        <svg className="w-1/3 h-1/3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        className={videoClassName || className || 'w-full h-full object-cover'}
        muted
        playsInline
        preload="metadata"
        loop
      />
    );
  }

  // Normal Image
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        {...rest}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      {...rest}
    />
  );
}
