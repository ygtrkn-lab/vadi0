export type { Product } from '@/lib/transformers';

export type HeroSlide = {
  id: string | number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
};

export const slides: HeroSlide[] = [
  {
    id: 'haftanin-kampanyalari',
    title: 'Haftanın Kampanyaları',
    subtitle: 'Sınırlı süre fırsatlar',
    description: 'İndirimli ürünlere tek bir kategori üzerinden hızlıca ulaşın.',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1766171531/nxd3uxx_fid6yv.png',
    buttonText: 'Kampanyaları Gör',
    buttonLink: '/haftanin-kampanyalari',
  },
  {
    id: 'kampanya-urun-1',
    title: '20 Kırmızı Gül Buketi',
    subtitle: 'Haftanın kampanya ürünü',
    description: 'Kampanyadaki kırmızı gül buketiyle güçlü bir jest yapın.',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225219/vadiler/products/vadiler-sevginin-gucu-7-kirmizi-guller-aranjmani.jpg',
    buttonText: 'Ürünü İncele',
    buttonLink: '/guller/20-kirmizi-gul-buketi',
  },
  {
    id: 'kampanya-urun-2',
    title: 'Çift Dal Beyaz Orkide',
    subtitle: 'Kampanya ürünü',
    description: 'Özel tasarım çift dal orkide kampanya fiyatıyla.',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765224480/vadiler/products/vadiler-hayal-adasi-2-dal-tasarim-mor-orkide.jpg',
    buttonText: 'Ürünü İncele',
    buttonLink: '/orkideler/cift-dal-beyaz-orkide',
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
