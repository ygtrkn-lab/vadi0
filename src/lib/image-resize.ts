/**
 * Client-side Image Resize Utility
 * 
 * Cloudinary'ye yüklemeden önce görselleri küçültür.
 * Bu sayede:
 * - Upload bandwidth azalır
 * - Cloudinary storage azalır
 * - Delivery bandwidth azalır
 * - 0 transformation kredisi
 */

export const MAX_WIDTH = 1200;
export const MAX_HEIGHT = 1200;
export const QUALITY = 0.85;

export async function resizeImageBeforeUpload(file: File): Promise<File> {
  // GIF'leri resize etme (animasyonu bozar)
  if (file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      let { width, height } = img;
      
      // Boyut küçültme gerekli mi?
      if (width <= MAX_WIDTH && height <= MAX_HEIGHT) {
        URL.revokeObjectURL(img.src);
        resolve(file); // Zaten küçük, olduğu gibi döndür
        return;
      }
      
      // En-boy oranını koru
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);
          if (blob) {
            // Dosya adını koru ama uzantıyı jpg yap
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            const resizedFile = new File([blob], `${nameWithoutExt}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            console.log(`Image resized: ${file.size} bytes -> ${resizedFile.size} bytes (${Math.round((1 - resizedFile.size / file.size) * 100)}% smaller)`);
            resolve(resizedFile);
          } else {
            resolve(file); // Fallback
          }
        },
        'image/jpeg',
        QUALITY
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(file); // Hata durumunda orijinal dosyayı kullan
    };
    
    img.src = URL.createObjectURL(file);
  });
}
