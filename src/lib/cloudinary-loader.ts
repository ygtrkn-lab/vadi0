/**
 * Custom Cloudinary Loader - OPTIMIZED MODE
 * 
 * Cloudinary'nin otomatik optimizasyonlarını kullanıyoruz:
 * - f_auto: Tarayıcıya göre en uygun format (WebP, AVIF)
 * - q_auto: Otomatik kalite optimizasyonu
 * - w_auto: Viewport'a göre boyutlandırma
 * 
 * Bu sayede:
 * - %70+ daha küçük dosya boyutları
 * - Modern formatlar (WebP/AVIF) otomatik
 * - Bandwidth tasarrufu
 * - Daha hızlı sayfa yükleme
 */

import type { ImageLoaderProps } from 'next/image';

export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  // Cloudinary URL değilse olduğu gibi döndür
  if (!src.includes('res.cloudinary.com')) {
    return src;
  }

  // URL'yi parse et
  const url = new URL(src);
  const pathParts = url.pathname.split('/upload/');
  
  if (pathParts.length !== 2) {
    return src; // upload/ yoksa orijinal URL'i döndür
  }

  // Optimizasyon parametreleri
  const transformations = [
    'f_auto',  // Format otomatik (WebP/AVIF)
    'q_auto',  // Kalite otomatik
    width ? `w_${width}` : 'w_auto',  // Genişlik
    'c_limit', // Orijinalden büyük olmasın
  ];

  // Yeni URL oluştur
  const [baseUrl, assetPath] = pathParts;
  return `${url.origin}${baseUrl}/upload/${transformations.join(',')}/${assetPath}`;
}

/**
 * Cloudinary URL'sinden public ID çıkar
 */
export function extractPublicId(url: string): string | null {
  if (!url.includes('res.cloudinary.com')) return null;
  
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/);
  return match ? match[1] : null;
}
