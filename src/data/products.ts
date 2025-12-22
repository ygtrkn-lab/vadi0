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
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1766363505/vadiler/slider/slide-1_tgwu5t.jpg',
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
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1766363506/vadiler/slider/slide-2_az8hcp.jpg',
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
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1766363507/vadiler/slider/slide-3_ibzway.jpg',
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
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1766363509/vadiler/slider/slide-4_a44nhb.jpg',
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
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1766363509/vadiler/slider/slide-5_pydgc1.jpg',
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
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1766363510/vadiler/slider/slide-6_vuleoj.jpg',
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
