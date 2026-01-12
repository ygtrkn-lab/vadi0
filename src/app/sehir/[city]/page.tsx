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
import { DISTRICT_CONTENTS, getDistrictContentBySlug, createCitySlug } from '@/data/city-content'
import { ISTANBUL_ILCELERI } from '@/data/istanbul-districts'
import ProductCard from '@/components/ProductCard'
import CategoryCarousel from '@/components/CategoryCarousel'
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

  // FAQ Schema for city page
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `${content.name} çiçek siparişi nasıl verilir?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${content.name} ilçesine çiçek siparişi vermek için Vadiler Çiçek web sitesinden ürün seçip, teslimat adresinizi girerek kolayca sipariş verebilirsiniz. Aynı gün teslimat seçeneğimiz mevcuttur.`
        }
      },
      {
        '@type': 'Question',
        name: `${content.name} aynı gün çiçek teslimatı var mı?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Evet, ${content.name} ilçesine aynı gün çiçek teslimatı yapıyoruz. Saat 16:00'ya kadar verilen siparişler aynı gün teslim edilir.`
        }
      },
      {
        '@type': 'Question',
        name: `${content.name} çiçek fiyatları ne kadar?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${content.name} ilçesine çiçek fiyatları 299 TL'den başlamaktadır. Gül buketi, orkide, aranjman ve özel tasarım çiçekler için farklı fiyat seçenekleri mevcuttur.`
        }
      }
    ]
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* 🔍 Hidden SEO Content - İlçe bazlı arama motoru optimizasyonu */}
      <div className="sr-only" aria-hidden="true">
        <h1>{content.name} Çiçek Siparişi | {content.name} Çiçekçi | {content.name} Online Çiçek</h1>
        <p>
          {content.name} çiçek siparişi, {content.name} çiçekçi, {content.name} online çiçek gönder, 
          {content.name} aynı gün çiçek teslimatı, {content.name} ucuz çiçek, {content.name} en iyi çiçekçi,
          {content.name} gül siparişi, {content.name} buket çiçek, {content.name} aranjman çiçek,
          {content.name} orkide gönder, {content.name} kutuda gül, {content.name} papatya buketi,
          {content.name} sevgililer günü çiçek, {content.name} doğum günü çiçeği, {content.name} anneler günü çiçek,
          {content.name} yıldönümü çiçeği, {content.name} tebrik çiçeği, {content.name} açılış çiçeği,
          {content.name} cenaze çiçeği, {content.name} nişan çiçeği, {content.name} söz çiçeği,
          {content.name} 7li gül, {content.name} 10lu gül, {content.name} 15li gül, {content.name} 20li gül,
          {content.name} 21li gül, {content.name} 25li gül, {content.name} 30lu gül, {content.name} 33lü gül,
          {content.name} 50li gül, {content.name} 99lu gül, {content.name} 101 gül buketi,
          {content.name} çiçek siparişi ver, {content.name} çiçek gönder online, {content.name} hızlı çiçek teslimatı,
          İstanbul {content.name} çiçekçi, {content.name} ilçesi çiçek, {content.name} semti çiçek gönderimi
        </p>
        <ul>
          <li>{content.name} gülleri - kırmızı gül, beyaz gül, pembe gül, sarı gül</li>
          <li>{content.name} orkide çeşitleri - tek dal orkide, çift dal orkide, mor orkide</li>
          <li>{content.name} aranjman modelleri - ferforje, seramik, cam vazo aranjman</li>
          <li>{content.name} kutuda çiçek - heart box, silindir kutu, kare kutu gül</li>
          <li>{content.name} özel gün çiçekleri - sevgililer günü, anneler günü, doğum günü</li>
        </ul>
      </div>

      <Header />
      <div className="h-0 lg:h-40" />
      
      <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
        
        {/* � Breadcrumb - EN ÜSTTE */}
        <section className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <nav className="text-xs text-gray-600 sm:text-sm">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <li><Link href="/" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link></li>
                <li className="text-gray-400">/</li>
                <li><Link href="/sehir" className="hover:text-gray-900 transition-colors">Şehirler</Link></li>
                <li className="text-gray-400">/</li>
                {!isIstanbul && (
                  <>
                    <li><Link href="/sehir/istanbul" className="hover:text-gray-900 transition-colors">İstanbul</Link></li>
                    <li className="text-gray-400">/</li>
                  </>
                )}
                <li className="font-medium text-gray-900">{content.name}</li>
              </ol>
            </nav>
          </div>
        </section>

        {/* 🎁 Haftanın Kampanyalı Ürünler - HERO ALANINDA */}
        <CategoryCarousel variant="city" />

        {/* ✨ Apple-Inspired Hero Section - Minimalist & Elegant & Compact */}
        <section className="relative bg-white overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-primary-50/30 to-transparent blur-3xl pointer-events-none" />
          </div>

          {/* Main content */}
          <div className="container mx-auto px-4 relative z-10 py-16 md:py-20">
            <div className="max-w-3xl">
              {/* Subtle badge */}
              <div className="mb-5 inline-block">
                <span className="text-xs font-semibold text-primary-600 uppercase tracking-widest">İstanbul'da Çiçek Teslimatı</span>
              </div>

              {/* Main headline - Apple style */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.15] mb-6">
                <span className="block text-gray-900">Taze Çiçekler</span>
                <span className="block bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">Kapınıza Gelsin</span>
              </h1>

              {/* Descriptive subtitle */}
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl font-light">
                İstanbul'un tüm ilçelerine hızlı ve özenli çiçek teslimatı.
              </p>

              {/* CTA Buttons - Minimal style */}
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <Link
                  href="/kategoriler"
                  className="group px-7 py-3 bg-gray-900 text-white rounded-full font-semibold text-base transition-all duration-300 hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/20 active:scale-95"
                >
                  <span className="flex items-center gap-2">
                    Çiçekleri İncele
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link
                  href="/ozel-gun"
                  className="group px-7 py-3 bg-gray-100 text-gray-900 rounded-full font-semibold text-base transition-all duration-300 hover:bg-gray-200 hover:shadow-lg hover:shadow-gray-900/10 active:scale-95"
                >
                  <span className="flex items-center gap-2">
                    Özel Günler
                    <Sparkles className="h-4 w-4" />
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Trust indicators - Subtle line under hero */}
          <div className="border-t border-gray-200">
            <div className="container mx-auto px-4 py-12 md:py-16">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                {/* Indicator 1 */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Teslimat</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{content.deliveryInfo}</p>
                  <p className="text-sm text-gray-600">Garanti ile kapınıza</p>
                </div>

                {/* Indicator 2 */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Memnuniyet</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">4.9 <span className="text-sm text-primary-600">★</span></p>
                  <p className="text-sm text-gray-600">12.000+ değerlendirme</p>
                </div>

                {/* Indicator 3 */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Seçenek</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">1000+</p>
                  <p className="text-sm text-gray-600">Çiçek ve aranjman</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* � Özel Günler (haftanın kampanyalarından hemen sonra) */}
        <section className="py-10 sm:py-14">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {content.name} İçin <span className="text-primary-600">Özel Günler</span>
              </h2>
              <Link href="/ozel-gun" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
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
                    className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:shadow-xl hover:ring-primary-500/50 hover:-translate-y-1"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${day.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${day.color} shadow-lg mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{day.name}</h3>
                    <p className="text-sm text-gray-600">{content.name} teslimat</p>
                    <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                )
              })}
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
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                  İstanbul İlçelerine <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">Çiçek Gönder</span>
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Tüm İstanbul ilçelerine aynı gün taze çiçek teslimatı yapıyoruz
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {ISTANBUL_ILCELERI.map((district) => (
                  <Link
                    key={district.id}
                    href={`/sehir/${createCitySlug(district.name)}`}
                    className="group relative overflow-hidden rounded-2xl bg-white p-4 text-center shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:shadow-xl hover:ring-primary-500/50 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-primary-500/0 group-hover:from-primary-500/10 group-hover:to-primary-600/15 transition-all duration-300" />
                    <span className="relative text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                      {district.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 📦 Popüler Bölgeler (ilçe sayfalarında) */}
        {!isIstanbul && content.popularAreas && content.popularAreas.length > 0 && (
          <section className="py-8">
            <div className="container mx-auto px-4">
              <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl ring-1 ring-gray-200">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-500 to-teal-600 shadow-lg">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">{content.name} Popüler Bölgeler</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {content.popularAreas.map((area, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 bg-gray-50 px-4 py-2 rounded-full text-sm font-medium text-gray-700 shadow-md ring-1 ring-gray-200 transition-all hover:bg-gray-100 hover:ring-primary-500/50"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-primary-600" />
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 📝 BİLGİLENDİRMELER - İçerik Section */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Main Content */}
              <div className="lg:col-span-8">
                <div className="rounded-3xl bg-white p-8 sm:p-10 shadow-xl ring-1 ring-gray-200">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                    {isIstanbul ? 'İstanbul\'da Online Çiçek Siparişi' : `${content.name}'de Çiçek Siparişi`}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed">
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
                  <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-5">Neden Vadiler?</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
                          <Clock className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-900">Aynı Gün Teslimat</span>
                          <p className="text-xs text-gray-500 mt-0.5">16:00&apos;a kadar sipariş</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
                          <ShieldCheck className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-900">Güvenli Ödeme</span>
                          <p className="text-xs text-gray-500 mt-0.5">256-bit SSL şifreleme</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/20">
                          <Flower2 className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-900">Taze Çiçek</span>
                          <p className="text-xs text-gray-500 mt-0.5">Her gün taze kesim</p>
                        </div>
                      </li>
                    </ul>
                    <Link
                      href="/kategoriler"
                      className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-sm font-semibold text-white shadow-xl shadow-primary-500/30 transition-all hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-[1.02]"
                    >
                      <Sparkles className="h-4 w-4" />
                      Çiçek Seç
                    </Link>
                  </div>

                  {/* Trust Badge */}
                  <div className="rounded-2xl bg-gradient-to-br from-primary-50 to-secondary-50 p-5 text-center ring-1 ring-primary-100">
                    <div className="flex justify-center gap-2 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-gray-900 font-semibold">4.9 / 5 Müşteri Puanı</p>
                    <p className="text-gray-600 text-xs mt-1">12.000+ değerlendirme</p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* 🌸 Popüler Çiçekler Section - EN SONDA */}
        <section className="py-12 sm:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-xs font-semibold text-primary-700 mb-3">
                  <Sparkles className="h-3.5 w-3.5" />
                  EN ÇOK TERCİH EDİLEN
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {content.name} İçin <span className="text-primary-600">Popüler Çiçekler</span>
                </h2>
              </div>
              <Link
                href="/kategoriler"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
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
            <div className="relative overflow-hidden rounded-[2.5rem] bg-white p-10 sm:p-16 text-center shadow-2xl ring-1 ring-gray-200">
              {/* Decorative Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary-100 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary-50 blur-3xl" />
              </div>
              
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-5 py-2 text-sm font-medium text-primary-700 ring-1 ring-primary-200 mb-6">
                  <Heart className="h-4 w-4" />
                  <span>Sevdiklerinizi Mutlu Edin</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  {content.name}&apos;e Hemen <br className="sm:hidden" />Çiçek Gönderin
                </h2>
                <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8">
                  Aynı gün teslimat garantisiyle sevdiklerinize özel anlar yaratın.
                </p>
                
                <Link
                  href="/kategoriler"
                  className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 px-10 py-5 text-lg font-bold text-white shadow-2xl transition-all hover:shadow-3xl hover:scale-[1.03] active:scale-[0.98]"
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
