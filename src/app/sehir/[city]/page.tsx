import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
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
  CheckCircle
} from 'lucide-react'
import { Footer, Header, MobileNavBar } from '@/components'
import DarkVeilBackground from '@/components/DarkVeilBackground'
import { DISTRICT_CONTENTS, getDistrictContentBySlug, createCitySlug } from '@/data/city-content'
import { ISTANBUL_ILCELERI } from '@/data/istanbul-districts'
import ProductCard from '@/components/ProductCard'
import supabaseAdmin from '@/lib/supabase/admin'
import { transformProducts } from '@/lib/transformers'

// Özel günler
const SPECIAL_DAYS = [
  { slug: 'sevgililer-gunu', name: 'Sevgililer Günü', icon: Heart, color: 'from-rose-500 to-pink-500' },
  { slug: 'anneler-gunu', name: 'Anneler Günü', icon: Heart, color: 'from-pink-500 to-fuchsia-500' },
  { slug: 'dogum-gunu', name: 'Doğum Günü', icon: Gift, color: 'from-amber-500 to-orange-500' },
  { slug: 'yildonumu', name: 'Yıldönümü', icon: Sparkles, color: 'from-purple-500 to-violet-500' },
]

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com'

interface PageProps {
  params: Promise<{ city: string }>
}

// Statik sayfaları oluştur - tüm 39 ilçe
export async function generateStaticParams() {
  const params = [
    { city: 'istanbul' },
    ...ISTANBUL_ILCELERI.map(d => ({ city: createCitySlug(d.name) })),
  ]
  return params
}

// Dinamik metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params
  const content = getDistrictContentBySlug(city)

  if (!content) {
    return {
      title: 'Sayfa Bulunamadı | Vadiler Çiçek',
    }
  }

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    keywords: content.keywords,
    alternates: {
      canonical: `${BASE_URL}/sehir/${city}`,
    },
    openGraph: {
      title: content.title,
      description: content.description,
      url: `${BASE_URL}/sehir/${city}`,
      siteName: 'Vadiler Çiçek',
      locale: 'tr_TR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.description,
    },
  }
}

export default async function CityPage({ params }: PageProps) {
  const { city } = await params
  const content = getDistrictContentBySlug(city)

  if (!content) {
    notFound()
  }

  const isIstanbul = city === 'istanbul'

  // Şehir bazlı sabit ürün seçimi (DB üzerinden, deterministic offset)
  const cityIndex = Math.max(0, DISTRICT_CONTENTS.findIndex((d) => d.slug === city)) + 1
  const offset = cityIndex * 7
  const { data: pageRows } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('id', { ascending: true })
    .range(offset, offset + 11)

  const rows = Array.isArray(pageRows) && pageRows.length > 0
    ? pageRows
    : (
        (await supabaseAdmin
          .from('products')
          .select('*')
          .order('id', { ascending: true })
          .limit(12)
        ).data ?? []
      )

  const shuffledProducts = transformProducts(rows as any)

  // LocalBusiness JSON-LD Schema
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${BASE_URL}/sehir/${city}`,
    name: 'Vadiler Çiçek',
    description: content.description,
    url: `${BASE_URL}/sehir/${city}`,
    telephone: '+90-850-307-4876',
    address: {
      '@type': 'PostalAddress',
      addressLocality: content.name,
      addressRegion: 'İstanbul',
      addressCountry: 'TR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 41.0082,
      longitude: 28.9784,
    },
    areaServed: {
      '@type': 'City',
      name: content.name,
    },
    priceRange: '₺₺',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '08:00',
      closes: '22:00',
    },
  }

  // BreadcrumbList Schema
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
      ...(isIstanbul ? [] : [{
        '@type': 'ListItem',
        position: 3,
        name: 'İstanbul',
        item: `${BASE_URL}/sehir/istanbul`,
      }]),
      {
        '@type': 'ListItem',
        position: isIstanbul ? 3 : 4,
        name: content.name,
        item: `${BASE_URL}/sehir/${city}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Header />
      <div className="h-0 lg:h-40" />
      
      <main className="min-h-screen relative overflow-hidden">
        <DarkVeilBackground />
        
        {/* ✨ Premium Hero Section */}
        <section className="relative pt-8 pb-12 sm:pt-12 sm:pb-16 overflow-hidden">
          <div className="container mx-auto px-4 relative">
            {/* Breadcrumb */}
            <nav className="mb-6 text-xs text-white/60 sm:text-sm">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <li><Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link></li>
                <li className="text-white/40">/</li>
                <li><Link href="/sehir" className="hover:text-white transition-colors">Şehirler</Link></li>
                <li className="text-white/40">/</li>
                {!isIstanbul && (
                  <>
                    <li><Link href="/sehir/istanbul" className="hover:text-white transition-colors">İstanbul</Link></li>
                    <li className="text-white/40">/</li>
                  </>
                )}
                <li className="font-medium text-white">{content.name}</li>
              </ol>
            </nav>

            {/* Hero Card - Glass Morphism on Dark */}
            <div className="relative overflow-hidden rounded-[2rem] bg-white/10 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl ring-1 ring-white/20 border border-white/10">
              {/* Gradient Orb Decorations */}
              <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-gradient-to-br from-primary-500/30 to-secondary-500/20 blur-2xl" />
              <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-gradient-to-tr from-secondary-500/30 to-primary-500/20 blur-2xl" />
              
              <div className="relative z-10">
                {/* Location Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-xl px-4 py-1.5 text-xs font-medium text-white shadow-lg ring-1 ring-white/30 mb-6">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>İstanbul, Türkiye</span>
                </div>
                
                {/* Emotional Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                  <span className="text-white">
                    {content.name}&apos;e
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-primary-400 bg-clip-text text-transparent">
                    Taze Çiçek Gönder
                  </span>
                </h1>
                
                <p className="max-w-2xl text-base sm:text-lg text-white/80 leading-relaxed mb-8">
                  {content.description}
                </p>

                {/* Trust Badges Row */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/15 backdrop-blur-xl px-5 py-3 shadow-lg ring-1 ring-white/20 transition-all hover:bg-white/25 hover:scale-[1.02]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                      <Truck className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">{content.deliveryInfo}</span>
                      <p className="text-xs text-white/70">Garantili Teslimat</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/15 backdrop-blur-xl px-5 py-3 shadow-lg ring-1 ring-white/20 transition-all hover:bg-white/25 hover:scale-[1.02]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                      <Star className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">4.9 Puan</span>
                      <p className="text-xs text-white/70">12.000+ Mutlu Müşteri</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/15 backdrop-blur-xl px-5 py-3 shadow-lg ring-1 ring-white/20 transition-all hover:bg-white/25 hover:scale-[1.02]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
                      <Flower2 className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">1000+ Çiçek</span>
                      <p className="text-xs text-white/70">Geniş Ürün Yelpazesi</p>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/kategoriler"
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary-500/40 ring-1 ring-white/30 transition-all hover:shadow-2xl hover:shadow-primary-500/50 hover:scale-[1.03] active:scale-[0.98]"
                  >
                    <Sparkles className="h-5 w-5" />
                    Çiçek Seç
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/ozel-gun"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/15 backdrop-blur-xl px-8 py-4 text-base font-semibold text-white shadow-lg ring-1 ring-white/20 transition-all hover:bg-white/25 hover:scale-[1.03] active:scale-[0.98]"
                  >
                    <Gift className="h-5 w-5 text-primary-400" />
                    Özel Günler
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🎯 İlçeler Grid (sadece İstanbul ana sayfasında) */}
        {isIstanbul && (
          <section className="py-12 sm:py-16">
            <div className="container mx-auto px-4">
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-xs font-semibold text-primary-700 mb-4">
                  <MapPin className="h-3.5 w-3.5" />
                  39 İLÇEDE HİZMET
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-dark-950 mb-3">
                  İstanbul İlçelerine <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">Çiçek Gönder</span>
                </h2>
                <p className="text-dark-600 max-w-2xl mx-auto">
                  Tüm İstanbul ilçelerine aynı gün taze çiçek teslimatı yapıyoruz
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {ISTANBUL_ILCELERI.map((district) => (
                  <Link
                    key={district.id}
                    href={`/sehir/${createCitySlug(district.name)}`}
                    className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl p-4 text-center shadow-lg ring-1 ring-dark-100/20 transition-all duration-300 hover:shadow-xl hover:bg-white/95 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-primary-500/0 group-hover:from-primary-500/10 group-hover:to-primary-600/15 transition-all duration-300" />
                    <span className="relative text-sm font-medium text-dark-800 group-hover:text-primary-700 transition-colors">
                      {district.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 🎁 Özel Günler (tüm sayfalarda) */}
        <section className="py-10 sm:py-14">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {content.name} İçin <span className="text-primary-400">Özel Günler</span>
              </h2>
              <Link href="/ozel-gun" className="text-sm font-medium text-primary-400 hover:text-primary-300 flex items-center gap-1">
                Tümünü Gör <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {SPECIAL_DAYS.map((day) => {
                const Icon = day.icon
                return (
                  <Link
                    key={day.slug}
                    href={`/sehir/${city}/${day.slug}`}
                    className="group relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl p-6 shadow-lg ring-1 ring-white/20 transition-all duration-300 hover:bg-white/20 hover:-translate-y-1"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${day.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${day.color} shadow-lg mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1">{day.name}</h3>
                    <p className="text-sm text-white/70">{content.name} teslimat</p>
                    <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* 📦 Popüler Bölgeler (ilçe sayfalarında) */}
        {!isIstanbul && content.popularAreas && content.popularAreas.length > 0 && (
          <section className="py-8">
            <div className="container mx-auto px-4">
              <div className="rounded-3xl bg-white/10 backdrop-blur-2xl p-6 sm:p-8 shadow-xl ring-1 ring-white/20">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-500 to-teal-600 shadow-lg">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">{content.name} Popüler Bölgeler</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {content.popularAreas.map((area, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-lg px-4 py-2 rounded-full text-sm font-medium text-white shadow-md ring-1 ring-white/20 transition-all hover:bg-white/25"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-secondary-400" />
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 📝 İçerik Section */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Main Content */}
              <div className="lg:col-span-8">
                <div className="rounded-3xl bg-white/10 backdrop-blur-2xl p-8 sm:p-10 shadow-xl ring-1 ring-white/20">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                    {isIstanbul ? 'İstanbul\'da Online Çiçek Siparişi' : `${content.name}'de Çiçek Siparişi`}
                  </h2>
                  <div className="prose prose-lg max-w-none text-white/80 leading-relaxed">
                    {content.content.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-5 last:mb-0">{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-4">
                <div className="sticky top-32 space-y-6">
                  {/* Quick Info Card */}
                  <div className="rounded-3xl bg-white/10 backdrop-blur-2xl p-6 shadow-xl ring-1 ring-white/20">
                    <h3 className="text-lg font-bold text-white mb-5">Neden Vadiler?</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
                          <Clock className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-white">Aynı Gün Teslimat</span>
                          <p className="text-xs text-white/60 mt-0.5">16:00&apos;a kadar sipariş</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
                          <ShieldCheck className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-white">Güvenli Ödeme</span>
                          <p className="text-xs text-white/60 mt-0.5">256-bit SSL şifreleme</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/20">
                          <Flower2 className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-white">Taze Çiçek</span>
                          <p className="text-xs text-white/60 mt-0.5">Her gün taze kesim</p>
                        </div>
                      </li>
                    </ul>
                    <Link
                      href="/kategoriler"
                      className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-sm font-semibold text-white shadow-xl shadow-primary-500/40 ring-1 ring-white/30 transition-all hover:shadow-2xl hover:shadow-primary-500/50 hover:scale-[1.02]"
                    >
                      <Sparkles className="h-4 w-4" />
                      Çiçek Seç
                    </Link>
                  </div>

                  {/* Trust Badge */}
                  <div className="rounded-2xl bg-dark-950/80 backdrop-blur-xl p-5 text-center ring-1 ring-white/10">
                    <div className="flex justify-center gap-2 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-white font-semibold">4.9 / 5 Müşteri Puanı</p>
                    <p className="text-white/50 text-xs mt-1">12.000+ değerlendirme</p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* 🌸 Ürünler Section */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-xl px-4 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 mb-3">
                  <Sparkles className="h-3.5 w-3.5" />
                  EN ÇOK TERCİH EDİLEN
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {content.name} İçin <span className="text-primary-400">Popüler Çiçekler</span>
                </h2>
              </div>
              <Link
                href="/kategoriler"
                className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-semibold transition-colors"
              >
                Tüm Ürünler
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {shuffledProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* 🚀 CTA Section */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary-500/30 to-primary-600/40 backdrop-blur-xl p-10 sm:p-16 text-center shadow-2xl ring-1 ring-white/20">
              {/* Decorative Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary-500/20 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-secondary-500/20 blur-3xl" />
              </div>
              
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-xl px-5 py-2 text-sm font-medium text-white ring-1 ring-white/30 mb-6">
                  <Heart className="h-4 w-4" />
                  <span>Sevdiklerinizi Mutlu Edin</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  {content.name}&apos;e Hemen <br className="sm:hidden" />Çiçek Gönderin
                </h2>
                <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
                  Aynı gün teslimat garantisiyle sevdiklerinize özel anlar yaratın.
                </p>
                
                <Link
                  href="/kategoriler"
                  className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 px-10 py-5 text-lg font-bold text-white shadow-2xl shadow-primary-500/40 ring-1 ring-white/30 transition-all hover:shadow-3xl hover:scale-[1.03] active:scale-[0.98]"
                >
                  <Sparkles className="h-5 w-5" />
                  Çiçek Seç
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileNavBar />
    </>
  )
}
