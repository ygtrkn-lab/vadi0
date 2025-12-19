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
    id: '20-kirmizi-gul-buketi',
    title: '20 Kırmızı Gül Buketi',
    subtitle: '20 Kırmızı Gül',
    description: 'Sevdiklerinize özel 20 kırmızı gül buketi.',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225219/vadiler/products/vadiler-sevginin-gucu-7-kirmizi-guller-aranjmani.jpg',
    buttonText: 'Keşfet',
    buttonLink: '/haftanin-kampanyalari',
  },
  {
    id: 'cift-dal-beyaz-orkide',
    title: 'Çift Dal Beyaz Orkide',
    subtitle: '63% İndirim',
    description: 'Zarif çift dal beyaz orkide, özel tasarım.',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765224480/vadiler/products/vadiler-hayal-adasi-2-dal-tasarim-mor-orkide.jpg',
    buttonText: 'Keşfet',
    buttonLink: '/haftanin-kampanyalari',
  },
  {
    id: 'beyaz-papatyalar',
    title: 'Beyaz Papatyalar',
    subtitle: '60% İndirim',
    description: 'Neşeli beyaz papatyalar buketi ile sevindirin.',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225079/vadiler/products/vadiler-renkli-papatya-ve-gerberalarin-bulusmasi.jpg',
    buttonText: 'Keşfet',
    buttonLink: '/haftanin-kampanyalari',
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
