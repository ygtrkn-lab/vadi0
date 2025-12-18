import productsJson from './products.json';
import categoriesJson from './categories.json';

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  longDescription?: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  image: string;
  hoverImage?: string;
  gallery?: string[];
  rating?: number;
  reviewCount?: number;
  category: string;
  categoryName?: string;
  inStock?: boolean;
  stockCount?: number;
  sku?: string;
  tags?: string[];
  features?: string[];
  deliveryInfo?: string;
  metaTitle?: string;
  metaDescription?: string;
  [key: string]: unknown;
}

export interface Category {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  productCount?: number;
  [key: string]: unknown;
}

export type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
};

export type Banner = {
  id: string;
  image: string;
  alt: string;
  link: string;
};

export type InfoBlock = {
  id: string;
  icon: 'truck' | 'shield' | 'creditCard' | 'gift' | string;
  title: string;
  description: string;
};

export const products: Product[] = (productsJson as unknown as Product[]) ?? [];
export const categories: Category[] = (categoriesJson as unknown as Category[]) ?? [];

// Homepage hero slides
export const slides: HeroSlide[] = [
  {
    id: 'hero-1',
    title: 'Taze Çiçeklerle Sürpriz',
    subtitle: 'Özenle hazırlanan buketler',
    description: 'Sevdiklerinize özel bir an yaratın. Günlük taze çiçeklerle hazırlanan seçkilerimizi keşfedin.',
    image: products[0]?.image || 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225219/vadiler/products/vadiler-sevginin-gucu-7-kirmizi-guller-aranjmani.jpg',
    buttonText: 'Ürünleri Gör',
    buttonLink: '/kategoriler',
  },
  {
    id: 'hero-2',
    title: 'Özel Gün Koleksiyonları',
    subtitle: 'Anı anlamlı kılın',
    description: 'Doğum günü, yıldönümü ve daha fazlası için seçilmiş çiçeklerle zarif bir sürpriz hazırlayın.',
    image: products[1]?.image || products[0]?.hoverImage || products[0]?.image || 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765224480/vadiler/products/vadiler-hayal-adasi-2-dal-tasarim-mor-orkide.jpg',
    buttonText: 'Özel Günleri Gör',
    buttonLink: '/ozel-gun',
  },
  {
    id: 'hero-3',
    title: 'İstanbul\'a Çiçek Gönderin',
    subtitle: 'Güvenli ve özenli teslimat',
    description: 'İstanbul\'un birçok bölgesine teslimat seçenekleriyle sevdiklerinize çiçek göndermek çok kolay.',
    image: products[2]?.image || products[0]?.image || 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225138/vadiler/products/vadiler-sensiz-olmaz-25-beyaz-guller.jpg',
    buttonText: 'Şehir Sayfaları',
    buttonLink: '/sehir',
  },
];

// Homepage banners
export const banners: Banner[] = [
  {
    id: 'banner-1',
    image: products[3]?.image || products[0]?.image,
    alt: 'Güller',
    link: '/guller',
  },
  {
    id: 'banner-2',
    image: products[4]?.image || products[1]?.image || products[0]?.image,
    alt: 'Orkideler',
    link: '/orkideler',
  },
  {
    id: 'banner-3',
    image: products[5]?.image || products[2]?.image || products[0]?.image,
    alt: 'Buketler',
    link: '/buketler',
  },
];

export const infoBlocks: InfoBlock[] = [
  {
    id: 'info-1',
    icon: 'truck',
    title: 'Özenli Teslimat',
    description: 'Teslimat seçenekleri bölge ve yoğunluğa göre değişebilir.',
  },
  {
    id: 'info-2',
    icon: 'shield',
    title: 'Taze Çiçek',
    description: 'Günlük taze çiçeklerle hazırlanan tasarımlar.',
  },
  {
    id: 'info-3',
    icon: 'creditCard',
    title: 'Güvenli Ödeme',
    description: 'Kredi kartı ve alternatif ödeme seçenekleri.',
  },
  {
    id: 'info-4',
    icon: 'gift',
    title: 'Mesaj Kartı',
    description: 'Siparişinize özel notunuzu ekleyin.',
  },
];
