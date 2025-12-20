export type { Product } from '@/lib/transformers';

export type HeroSlide = {
  id: string | number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  mobileImage?: string;
  buttonText: string;
  buttonLink: string;
};

export const slides: HeroSlide[] = [
  {
    id: 'hero-kampanya-1',
    title: 'Haftanın Kampanyaları',
    subtitle: 'Özel indirim seçkisi',
    description: 'Sınırlı süreli fırsatlarla en çok tercih edilen ürünleri avantajlı fiyatlarla keşfedin.',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225219/vadiler/products/vadiler-sevginin-gucu-7-kirmizi-guller-aranjmani.jpg',
    mobileImage:
      'https://images.unsplash.com/photo-1530092285049-1c42085fd395?q=80&w=1080&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    buttonText: 'Kampanyalara Git',
    buttonLink: '/haftanin-cicek-kampanyalari-vadiler-com',
  },
  {
    id: 'hero-kampanya-2',
    title: 'Haftalık İndirimler',
    subtitle: 'Avantajlı fiyatlar',
    description: 'Haftanın kampanyalarında seçili ürünlerde ekstra indirimleri kaçırmayın.',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225138/vadiler/products/vadiler-sensiz-olmaz-25-beyaz-guller.jpg',
    mobileImage:
      'https://plus.unsplash.com/premium_photo-1670444760243-155db6c38716?q=80&w=1080&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    buttonText: 'İndirimleri Gör',
    buttonLink: '/haftanin-cicek-kampanyalari-vadiler-com',
  },
  {
    id: 'hero-kampanya-3',
    title: 'Sürpriz Fırsatlar',
    subtitle: 'Sınırlı stok',
    description: 'Kampanya ürünleri hızlı tükenebilir. Şimdi inceleyin, fırsatı yakalayın.',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765224480/vadiler/products/vadiler-hayal-adasi-2-dal-tasarim-mor-orkide.jpg',
    mobileImage:
      'https://images.unsplash.com/photo-1446071103084-c257b5f70672?q=80&w=1080&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    buttonText: 'Kampanyalara Git',
    buttonLink: '/haftanin-cicek-kampanyalari-vadiler-com',
  },
  {
    id: 'hero-category-guller',
    title: 'Güller',
    subtitle: 'Klasik ve etkileyici',
    description: 'Kırmızı, beyaz ve renkli gül seçenekleriyle en zarif sürprizi hazırlayın.',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225219/vadiler/products/vadiler-sevginin-gucu-7-kirmizi-guller-aranjmani.jpg',
    mobileImage:
      'https://images.unsplash.com/photo-1576857990591-aad2585f34d1?q=80&w=1080&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    buttonText: 'Güllere Git',
    buttonLink: '/guller',
  },
  {
    id: 'hero-category-orkideler',
    title: 'Orkideler',
    subtitle: 'Zarif ve kalıcı',
    description: 'Minimal ve şık orkide tasarımlarıyla ev ve ofisler için güçlü bir tercih.',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765224480/vadiler/products/vadiler-hayal-adasi-2-dal-tasarim-mor-orkide.jpg',
    mobileImage:
      'https://plus.unsplash.com/premium_photo-1679177888973-99ec8477308f?q=80&w=1080&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    buttonText: 'Orkidelere Git',
    buttonLink: '/orkideler',
  },
  {
    id: 'hero-category-ozel-gun',
    title: 'Özel Günler',
    subtitle: 'Kutlamalara özel',
    description: 'Doğum günü, yıldönümü ve tüm özel anlar için hediye seçkilerini keşfedin.',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225910/vadiler/products/vadiler-teraryum-i-yi-ki-dogdun-canim-arkadasim-mor.jpg',
    mobileImage:
      'https://plus.unsplash.com/premium_photo-1676297982083-d01e995e5e07?q=80&w=1080&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    buttonText: 'Özel Günlere Git',
    buttonLink: '/ozel-gun',
  },
];

export const banners: Array<{ id: string; image: string; alt: string; link: string }> = [
  {
    id: 'banner-1',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225219/vadiler/products/vadiler-sevginin-gucu-7-kirmizi-guller-aranjmani.jpg',
    alt: 'Güller',
    link: '/guller',
  },
  {
    id: 'banner-2',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765224480/vadiler/products/vadiler-hayal-adasi-2-dal-tasarim-mor-orkide.jpg',
    alt: 'Orkideler',
    link: '/orkideler',
  },
  {
    id: 'banner-3',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225910/vadiler/products/vadiler-teraryum-i-yi-ki-dogdun-canim-arkadasim-mor.jpg',
    alt: 'Özel Günler',
    link: '/ozel-gun',
  },
];

export const infoBlocks: Array<{ id: string; icon: 'truck' | 'shield' | 'creditCard' | 'gift'; title: string; description: string }> = [
  {
    id: 'info-1',
    icon: 'truck',
    title: 'Özenli Teslimat',
    description: 'Paketleme ve teslimat süreci dikkatle yönetilir.',
  },
  {
    id: 'info-2',
    icon: 'shield',
    title: 'Güvenli Alışveriş',
    description: 'Ödeme ve sipariş akışı güvenli şekilde ilerler.',
  },
  {
    id: 'info-3',
    icon: 'creditCard',
    title: 'Kolay Ödeme',
    description: 'Kredi kartı ile pratik ödeme seçenekleri.',
  },
  {
    id: 'info-4',
    icon: 'gift',
    title: 'Mesaj Kartı',
    description: 'Siparişinize not ekleyebilirsiniz.',
  },
];
