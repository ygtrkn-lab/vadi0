/**
 * Custom Cloudinary Loader - ZERO TRANSFORMATION MODE
 * 
 * Cloudinary artık çok pahalı, hiçbir transformation kullanmıyoruz.
 * Görseller olduğu gibi sunuluyor, boyutlandırma CSS ile yapılıyor.
 * 
 * Bu sayede:
 * - 0 transformation kredisi
 * - Sadece bandwidth (kaçınılmaz)
 * - Cache sayesinde tekrar istek yok
 */

import type { ImageLoaderProps } from 'next/image';

export default function cloudinaryLoader({ src }: ImageLoaderProps): string {
  // URL'yi olduğu gibi döndür - HİÇBİR TRANSFORMATION YOK
  return src;
}

/**
 * Cloudinary URL'sinden public ID çıkar
 */
export function extractPublicId(url: string): string | null {
  if (!url.includes('res.cloudinary.com')) return null;
  
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/);
  return match ? match[1] : null;
}
