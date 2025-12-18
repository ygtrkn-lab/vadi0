import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { SPECIAL_DAYS } from '@/data/special-days';
import { ISTANBUL_CONTENT, DISTRICT_CONTENTS } from '@/data/city-content';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

interface PageProps {
  params: Promise<{
    city: string;
    occasion: string;
  }>;
}

// Statik sayfaları oluştur
export async function generateStaticParams() {
  const params = [];
  
  // Sadece Istanbul için şimdilik
  for (const occasion of SPECIAL_DAYS) {
    params.push({
      city: 'istanbul',
      occasion: occasion.slug,
    });
    
    // Her ilçe için de oluştur
    for (const district of DISTRICT_CONTENTS) {
      params.push({
        city: district.slug,
        occasion: occasion.slug,
      });
    }
  }
  
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city, occasion } = await params;
  
  const specialDay = SPECIAL_DAYS.find(d => d.slug === occasion);
  if (!specialDay) return { title: 'Sayfa Bulunamadı' };
  
  // Şehir veya ilçe bilgisini al
  const isIstanbul = city === 'istanbul';
  const cityData = isIstanbul 
    ? ISTANBUL_CONTENT 
    : DISTRICT_CONTENTS.find(d => d.slug === city);
  
  if (!cityData) return { title: 'Sayfa Bulunamadı' };
  
  const title = `${specialDay.name} Çiçekleri ${cityData.name} | ${specialDay.date || ''} | Vadiler Çiçek`;
  const description = `${cityData.name} için ${specialDay.name} çiçek siparişi. ${specialDay.description} Hızlı ve güvenli teslimat ile taze çiçekler kapınızda!`;
  
  return {
    title,
    description,
    keywords: [
      ...specialDay.keywords,
      `${cityData.name.toLowerCase()} ${specialDay.name.toLowerCase()}`,
      `${cityData.name.toLowerCase()} çiçek siparişi ${specialDay.name.toLowerCase()}`,
      `${cityData.name.toLowerCase()} ${occasion} çiçek`,
    ],
    alternates: {
      canonical: `${BASE_URL}/sehir/${city}/${occasion}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/sehir/${city}/${occasion}`,
      type: 'website',
      images: [specialDay.image],
      siteName: 'Vadiler Çiçek',
      locale: 'tr_TR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [specialDay.image],
    },
  };
}

export default async function CityOccasionPage({ params }: PageProps) {
  const { city, occasion } = await params;
  
  const specialDay = SPECIAL_DAYS.find(d => d.slug === occasion);
  if (!specialDay) notFound();
  
  const isIstanbul = city === 'istanbul';
  const cityData = isIstanbul 
    ? ISTANBUL_CONTENT 
    : DISTRICT_CONTENTS.find(d => d.slug === city);
  
  if (!cityData) notFound();
  
  // API'den ürünleri al - occasion slug'ı products.occasion_tags içinde tutuluyorsa category filtresiyle eşleşir
  const response = await fetch(`${BASE_URL}/api/products?category=${occasion}&limit=60`, {
    next: { revalidate: 3600 } // 1 saat cache
  });
  const productsJson = response.ok ? await response.json() : null;
  const products: any[] = Array.isArray(productsJson?.products) ? productsJson.products : [];

  // Breadcrumb Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Ana Sayfa',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Şehirler',
        item: `${BASE_URL}/sehir`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: cityData.name,
        item: `${BASE_URL}/sehir/${city}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: specialDay.name,
        item: `${BASE_URL}/sehir/${city}/${occasion}`,
      },
    ],
  };

  // LocalBusiness + Özel Gün Schema
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'Florist',
    name: `Vadiler Çiçek - ${cityData.name}`,
    description: `${cityData.name} bölgesine ${specialDay.name} özel çiçek teslimatı`,
    areaServed: {
      '@type': 'City',
      name: cityData.name,
    },
    priceRange: '₺₺',
    telephone: '+90-555-123-4567',
    address: {
      '@type': 'PostalAddress',
      addressLocality: cityData.name,
      addressRegion: 'İstanbul',
      addressCountry: 'TR',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Hero Section */}
        <div className="mb-10">
          <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-md shadow-soft px-6 py-10 md:px-10">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-primary-50/60 via-white/20 to-white/0" />
            <div className="relative text-center">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mb-3">
                {specialDay.name} Çiçekleri {cityData.name}
              </h1>
              <p className="text-sm md:text-base text-gray-600 max-w-3xl mx-auto">
                {cityData.name} bölgesine {specialDay.name} özel çiçek siparişi. Hızlı ve güvenli teslimat ile sevdiklerinizi mutlu edin.
              </p>
            </div>
          </div>
        </div>

        {/* SEO Content Section */}
        <div className="prose prose-base md:prose-lg dark:prose-invert max-w-none mb-10 rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-md shadow-soft p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-4">
            {cityData.name}'de {specialDay.name} için En Güzel Çiçekler
          </h2>
          <p className="mb-4">
            {specialDay.description}
          </p>
          
          <h3 className="text-xl font-semibold mb-3">
            Neden Vadiler Çiçek?
          </h3>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Hızlı Teslimat:</strong> {cityData.deliveryInfo}</li>
            <li><strong>Taze Çiçek Garantisi:</strong> Günlük kesim çiçeklerle hazırlanan buketler</li>
            <li><strong>Özel Gün Paketleme:</strong> {specialDay.name} temalı özel ambalaj</li>
            <li><strong>Profesyonel Teslimat:</strong> Deneyimli kurye ekibimiz ile güvenli teslimat</li>
            <li><strong>Mesaj Kartı Hediye:</strong> Sevdiklerinize özel mesajınızı ücretsiz ekleyin</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            {cityData.name} Bölgesinde Teslimat
          </h3>
          <p className="mb-4">
            {cityData.content.substring(0, 300)}...
          </p>
          
          {cityData.popularAreas && cityData.popularAreas.length > 0 && (
            <>
              <h3 className="text-xl font-semibold mb-3">
                Teslimat Yaptığımız Popüler Bölgeler
              </h3>
              <p className="mb-4">
                {cityData.popularAreas.join(', ')} ve {cityData.name}'in tüm mahallelerine çiçek gönderebilirsiniz.
              </p>
            </>
          )}

          <h3 className="text-xl font-semibold mb-3">
            Sipariş ve Teslimat Süreci
          </h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Online sipariş verin veya telefon ile iletişime geçin</li>
            <li>Çiçekçilerimiz siparişinizi özenle hazırlasın</li>
            <li>Profesyonel kurye ekibimiz güvenli şekilde teslim etsin</li>
            <li>Teslimat fotoğrafı ile bilgilendirilmeyi bekleyin</li>
          </ol>
        </div>

        {/* Products Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">
            {specialDay.name} Çiçek Koleksiyonu
          </h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
              {products.map((product, index) => (
                <ProductCard key={product.id ?? `${occasion}-${index}`} product={product as any} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Bu kategori için yakında yeni ürünler eklenecek.
              </p>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-md shadow-soft p-6 md:p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {cityData.name}'de {specialDay.name} Sürprizi Yapın
          </h2>
          <p className="text-sm md:text-base text-gray-600 mb-6">
            {specialDay.date && `${specialDay.date} tarihinde `}sevdiklerinize en güzel çiçekleri gönderin.
          </p>
          <a
            href={`/ozel-gun/${occasion}`}
            className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-glow hover:bg-primary-600 transition"
          >
            Tüm {specialDay.name} Çiçeklerini Gör
          </a>
        </div>
      </main>
    </>
  );
}
