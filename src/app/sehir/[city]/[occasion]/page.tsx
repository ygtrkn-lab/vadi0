import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Flower2, 
  Star, 
  Truck, 
  Clock, 
  ShieldCheck, 
  Heart,
  Sparkles,
  MapPin,
  Gift,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Package,
  MessageSquare
} from 'lucide-react';
import { Footer, Header, MobileNavBar } from '@/components';
import ProductCard from '@/components/ProductCard';
import { SPECIAL_DAYS } from '@/data/special-days';
import { ISTANBUL_CONTENT, DISTRICT_CONTENTS, getDistrictContentBySlug, createCitySlug } from '@/data/city-content';
import { ISTANBUL_ILCELERI } from '@/data/istanbul-districts';
import supabaseAdmin from '@/lib/supabase/admin';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

interface PageProps {
  params: Promise<{
    city: string;
    occasion: string;
  }>;
}

// Statik sayfaları oluştur - tüm 39 ilçe
export async function generateStaticParams() {
  const params = [];
  
  // Istanbul + tüm ilçeler
  for (const occasion of SPECIAL_DAYS) {
    params.push({
      city: 'istanbul',
      occasion: occasion.slug,
    });
    
    // Tüm 39 ilçe için oluştur
    for (const district of ISTANBUL_ILCELERI) {
      params.push({
        city: createCitySlug(district.name),
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
  
  // Şehir veya ilçe bilgisini al (dinamik fallback ile)
  const cityData = getDistrictContentBySlug(city);
  
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
  const cityData = getDistrictContentBySlug(city);
  
  if (!cityData) notFound();
  
  // Build-time'da dış domain'e fetch atmamak için ürünleri Supabase'den doğrudan çek
  const taggedQuery = await supabaseAdmin
    .from('products')
    .select('*')
    .contains('occasion_tags', [occasion])
    .order('id', { ascending: true })
    .limit(60);

  const products = Array.isArray(taggedQuery.data) && taggedQuery.data.length > 0
    ? taggedQuery.data
    : (
        (await supabaseAdmin
          .from('products')
          .select('*')
          .order('id', { ascending: true })
          .limit(60)
        ).data ?? []
      );

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
      
      <Header />
      <div className="h-0 lg:h-40" />
      
      <main className="min-h-screen bg-gradient-to-b from-primary-50/50 via-white to-white">
        
        {/* ✨ Premium Hero Section */}
        <section className="relative pt-8 pb-12 sm:pt-12 sm:pb-16 overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-200/40 to-transparent rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-secondary-200/30 to-transparent rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 relative">
            {/* Breadcrumb */}
            <nav className="mb-6 text-xs text-dark-500 sm:text-sm">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <li><Link href="/" className="hover:text-primary-600 transition-colors">Ana Sayfa</Link></li>
                <li className="text-dark-300">/</li>
                <li><Link href="/sehir" className="hover:text-primary-600 transition-colors">Şehirler</Link></li>
                <li className="text-dark-300">/</li>
                <li><Link href={`/sehir/${city}`} className="hover:text-primary-600 transition-colors">{cityData.name}</Link></li>
                <li className="text-dark-300">/</li>
                <li className="font-medium text-dark-900">{specialDay.name}</li>
              </ol>
            </nav>

            {/* Hero Card - Glass Morphism */}
            <div className="relative overflow-hidden rounded-[2rem] bg-white/75 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl ring-1 ring-dark-100/20 border border-white/40">
              {/* Gradient Orb Decorations */}
              <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-gradient-to-br from-primary-400/20 to-secondary-400/10 blur-2xl" />
              <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-gradient-to-tr from-secondary-400/20 to-primary-400/10 blur-2xl" />
              
              <div className="relative z-10">
                {/* Back Link */}
                <Link
                  href={`/sehir/${city}`}
                  className="inline-flex items-center gap-2 text-sm text-dark-500 hover:text-primary-600 transition-colors mb-6"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {cityData.name} Sayfasına Dön
                </Link>
                
                {/* Special Day Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-1.5 text-xs font-medium text-white shadow-lg shadow-primary-500/25 mb-6">
                  <Heart className="h-3.5 w-3.5" />
                  <span>{specialDay.name}</span>
                  {specialDay.date && <span className="opacity-80">• {specialDay.date}</span>}
                </div>
                
                {/* Emotional Headline */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                  <span className="bg-gradient-to-r from-dark-950 via-dark-800 to-dark-950 bg-clip-text text-transparent">
                    {cityData.name}&apos;e
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 bg-clip-text text-transparent">
                    {specialDay.name} Çiçekleri
                  </span>
                </h1>
                
                <p className="max-w-2xl text-base sm:text-lg text-dark-600 leading-relaxed mb-8">
                  {specialDay.description}
                </p>

                {/* Trust Badges Row */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/80 backdrop-blur-xl px-5 py-3 shadow-lg ring-1 ring-dark-100/20 border border-white/40">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                      <Truck className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-dark-800">{cityData.deliveryInfo}</span>
                      <p className="text-xs text-dark-600">Garantili Teslimat</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/80 backdrop-blur-xl px-5 py-3 shadow-lg ring-1 ring-dark-100/20 border border-white/40">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
                      <Gift className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-dark-800">Özel Paketleme</span>
                      <p className="text-xs text-dark-600">{specialDay.name} temalı</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/80 backdrop-blur-xl px-5 py-3 shadow-lg ring-1 ring-dark-100/20 border border-white/40">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                      <MessageSquare className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-dark-800">Ücretsiz Mesaj</span>
                      <p className="text-xs text-dark-600">Kart hediye</p>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  href="#products"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary-500/40 ring-1 ring-white/20 transition-all hover:shadow-2xl hover:shadow-primary-500/50 hover:scale-[1.03] active:scale-[0.98]"
                >
                  <Sparkles className="h-5 w-5" />
                  {specialDay.name} Çiçeklerini Gör
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 📝 Neden Vadiler Section */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Main Content */}
              <div className="lg:col-span-8">
                <div className="rounded-3xl bg-white/80 backdrop-blur-2xl p-8 sm:p-10 shadow-xl ring-1 ring-dark-100/20 border border-white/40">
                  <h2 className="text-2xl sm:text-3xl font-bold text-dark-900 mb-6">
                    {cityData.name}&apos;de {specialDay.name} için <span className="text-primary-600">En Güzel Çiçekler</span>
                  </h2>
                  
                  <div className="prose prose-lg max-w-none text-dark-600 leading-relaxed mb-8">
                    <p className="mb-5">{specialDay.description}</p>
                    <p className="mb-5">{cityData.content.substring(0, 400)}...</p>
                  </div>
                  
                  {/* Features Grid */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-xl ring-1 ring-dark-100/20 border border-white/40">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-dark-800 mb-1">Hızlı Teslimat</h3>
                        <p className="text-sm text-dark-600">{cityData.deliveryInfo}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-xl ring-1 ring-dark-100/20 border border-white/40">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                        <Flower2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-dark-800 mb-1">Taze Çiçek Garantisi</h3>
                        <p className="text-sm text-dark-600">Her gün taze kesim çiçekler</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-xl ring-1 ring-dark-100/20 border border-white/40">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-dark-800 mb-1">Özel Paketleme</h3>
                        <p className="text-sm text-dark-600">{specialDay.name} temalı ambalaj</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-xl ring-1 ring-dark-100/20 border border-white/40">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-dark-800 mb-1">Ücretsiz Mesaj Kartı</h3>
                        <p className="text-sm text-dark-600">Özel mesajınızı ekleyin</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-4">
                <div className="sticky top-32 space-y-6">
                  {/* Quick Info Card */}
                  <div className="rounded-3xl bg-white/85 backdrop-blur-2xl p-6 shadow-xl ring-1 ring-dark-100/20 border border-white/40">
                    <h3 className="text-lg font-bold text-dark-900 mb-5">Sipariş Süreci</h3>
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">1</div>
                        <div>
                          <span className="text-sm font-semibold text-dark-900">Çiçek Seçin</span>
                          <p className="text-xs text-dark-500 mt-0.5">{specialDay.name} koleksiyonundan</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">2</div>
                        <div>
                          <span className="text-sm font-semibold text-dark-900">Adres Girin</span>
                          <p className="text-xs text-dark-500 mt-0.5">{cityData.name} teslimat adresi</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">3</div>
                        <div>
                          <span className="text-sm font-semibold text-dark-900">Mesaj Ekleyin</span>
                          <p className="text-xs text-dark-500 mt-0.5">Ücretsiz mesaj kartı</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">✓</div>
                        <div>
                          <span className="text-sm font-semibold text-dark-900">Teslimat</span>
                          <p className="text-xs text-dark-500 mt-0.5">Fotoğraflı bilgilendirme</p>
                        </div>
                      </li>
                    </ol>
                  </div>

                  {/* Popüler Bölgeler */}
                  {cityData.popularAreas && cityData.popularAreas.length > 0 && (
                    <div className="rounded-2xl bg-white/85 backdrop-blur-xl p-5 shadow-lg ring-1 ring-dark-100/20 border border-white/40">
                      <h3 className="text-sm font-bold text-dark-900 mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary-500" />
                        Teslimat Bölgeleri
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {cityData.popularAreas.slice(0, 8).map((area, index) => (
                          <span key={index} className="text-xs bg-dark-50 text-dark-600 px-2 py-1 rounded-full">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* 🌸 Products Section */}
        <section id="products" className="py-12 sm:py-16 bg-gradient-to-b from-white via-primary-50/30 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-xs font-semibold text-primary-700 mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                {specialDay.name.toUpperCase()} KOLEKSİYONU
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-dark-950 mb-3">
                {cityData.name} İçin <span className="text-primary-600">{specialDay.name} Çiçekleri</span>
              </h2>
              <p className="text-dark-600 max-w-2xl mx-auto">
                Sevdiklerinizi mutlu edecek özel {specialDay.name} çiçek koleksiyonumuzu keşfedin
              </p>
            </div>
            
            {products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product, index) => (
                  <ProductCard key={product.id ?? `${occasion}-${index}`} product={product as any} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 mb-4">
                  <Flower2 className="h-8 w-8 text-primary-500" />
                </div>
                <p className="text-dark-600 text-lg mb-4">
                  Bu kategori için yakında yeni ürünler eklenecek.
                </p>
                <Link
                  href="/kategoriler"
                  className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700"
                >
                  Tüm Ürünleri Gör <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* 🚀 CTA Section */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-10 sm:p-16 text-center shadow-soft-xl">
              {/* Decorative Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
              </div>
              
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-5 py-2 text-sm font-medium text-white mb-6">
                  <Heart className="h-4 w-4" />
                  <span>{specialDay.name} Sürprizi</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  {cityData.name}&apos;de {specialDay.name} <br className="sm:hidden" />Mutluluğu Yaşatın
                </h2>
                <p className="text-lg text-white/90 max-w-xl mx-auto mb-8">
                  {specialDay.date ? `${specialDay.date} tarihinde s` : 'S'}evdiklerinize en güzel çiçekleri gönderin.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href={`/ozel-gun/${occasion}`}
                    className="inline-flex items-center gap-3 rounded-2xl bg-white/90 backdrop-blur-xl px-10 py-5 text-lg font-bold text-primary-700 shadow-2xl ring-1 ring-white/50 transition-all hover:shadow-3xl hover:scale-[1.03] active:scale-[0.98]"
                  >
                    <Sparkles className="h-5 w-5" />
                    Tüm {specialDay.name} Çiçekleri
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileNavBar />
    </>
  );
}
