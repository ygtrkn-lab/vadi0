import { Metadata } from 'next'
import Link from 'next/link'
import { 
  Building2, 
  Camera, 
  ChevronRight, 
  Clock, 
  Flower2, 
  Map, 
  MapPin, 
  Rocket, 
  Truck,
  Star,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Heart
} from 'lucide-react'
import { Footer, Header, MobileNavBar } from '@/components'
import { AVRUPA_ILCELERI, ANADOLU_ILCELERI } from '@/data/istanbul-districts'
import { createCitySlug } from '@/data/city-content'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com'

export const metadata: Metadata = {
  title: 'İstanbul Çiçek Teslimatı | Tüm İlçelere Aynı Gün | Vadiler Çiçek',
  description: 'İstanbul\'un 39 ilçesine aynı gün çiçek teslimatı! Kadıköy, Beşiktaş, Şişli, Ataşehir, Bakırköy ve tüm İstanbul\'a taze çiçek gönderin. Vadiler Çiçek ile hızlı teslimat.',
  keywords: ['istanbul çiçek', 'istanbul çiçek teslimatı', 'istanbul çiçekçi', 'anadolu yakası çiçek', 'avrupa yakası çiçek'],
  alternates: {
    canonical: `${BASE_URL}/sehir`,
  },
  openGraph: {
    title: 'İstanbul Çiçek Teslimatı | Vadiler Çiçek',
    description: 'İstanbul\'un 39 ilçesine aynı gün çiçek teslimatı! Taze çiçekler, hızlı teslimat.',
    url: `${BASE_URL}/sehir`,
    siteName: 'Vadiler Çiçek',
    locale: 'tr_TR',
    type: 'website',
  },
}

export default function CitiesIndexPage() {
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
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial from-primary-100/20 to-transparent rounded-full" />
          </div>

          <div className="container mx-auto px-4 relative">
            {/* Breadcrumb */}
            <nav className="mb-6 text-xs text-dark-500 sm:text-sm">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <li><Link href="/" className="hover:text-primary-600 transition-colors">Ana Sayfa</Link></li>
                <li className="text-dark-300">/</li>
                <li className="font-medium text-dark-900">Teslimat Bölgeleri</li>
              </ol>
            </nav>

            {/* Hero Card - Glass Morphism */}
            <div className="relative overflow-hidden rounded-[2rem] bg-white/70 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl ring-1 ring-dark-100/20 border border-white/50">
              {/* Gradient Orb Decorations */}
              <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-gradient-to-br from-primary-400/20 to-secondary-400/10 blur-2xl" />
              <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-gradient-to-tr from-secondary-400/20 to-primary-400/10 blur-2xl" />
              
              <div className="relative z-10">
                {/* Location Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-1.5 text-xs font-medium text-white shadow-lg shadow-primary-500/25 mb-6">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>39 İlçe • Tüm İstanbul</span>
                </div>
                
                {/* Emotional Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                  <span className="bg-gradient-to-r from-dark-950 via-dark-800 to-dark-950 bg-clip-text text-transparent">
                    İstanbul&apos;a
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 bg-clip-text text-transparent">
                    Çiçek Teslimatı
                  </span>
                </h1>
                
                <p className="max-w-2xl text-base sm:text-lg text-dark-600 leading-relaxed mb-8">
                  İstanbul&apos;un tüm ilçelerine aynı gün çiçek teslimatı. Avrupa ve Anadolu yakasına taze çiçekler, özenli paketleme ve hızlı teslimat garantisi.
                </p>

                {/* Trust Badges Row */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/80 backdrop-blur-xl px-5 py-3 shadow-lg ring-1 ring-dark-100/20 transition-all hover:shadow-xl hover:scale-[1.02] hover:bg-white/90">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                      <Map className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-dark-800">39 İlçe</span>
                      <p className="text-xs text-dark-600">Tüm İstanbul</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/80 backdrop-blur-xl px-5 py-3 shadow-lg ring-1 ring-dark-100/20 transition-all hover:shadow-xl hover:scale-[1.02] hover:bg-white/90">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                      <Truck className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-dark-800">Aynı Gün</span>
                      <p className="text-xs text-dark-600">Hızlı Teslimat</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/80 backdrop-blur-xl px-5 py-3 shadow-lg ring-1 ring-dark-100/20 transition-all hover:shadow-xl hover:scale-[1.02] hover:bg-white/90">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
                      <Flower2 className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-dark-800">1000+ Çiçek</span>
                      <p className="text-xs text-dark-600">Geniş Seçim</p>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  href="/kategoriler"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary-500/40 ring-1 ring-white/20 transition-all hover:shadow-2xl hover:shadow-primary-500/50 hover:scale-[1.03] active:scale-[0.98]"
                >
                  <Sparkles className="h-5 w-5" />
                  Çiçek Seç
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 🏙️ İstanbul Ana Link */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <Link
              href="/sehir/istanbul"
              className="group flex items-center justify-between rounded-3xl bg-white/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl ring-1 ring-dark-100/20 hover:shadow-2xl hover:bg-white/95 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-dark-950 group-hover:text-primary-700 transition-colors">
                    İstanbul Çiçek Siparişi
                  </h2>
                  <p className="text-dark-600 mt-1">
                    Tüm İstanbul&apos;a aynı gün teslimat garantisi
                  </p>
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 group-hover:bg-primary-100 transition-colors">
                <ChevronRight className="h-5 w-5 text-primary-700 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </section>

        {/* 🌍 Avrupa Yakası */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-dark-950">Avrupa Yakası</h2>
                <p className="text-dark-500 text-sm">{AVRUPA_ILCELERI.length} ilçede hizmet</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {AVRUPA_ILCELERI.map((district) => (
                <Link
                  key={district.id}
                  href={`/sehir/${createCitySlug(district.name)}`}
                  className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl p-4 text-center shadow-lg ring-1 ring-dark-100/20 border border-white/40 transition-all duration-300 hover:shadow-xl hover:bg-white/95 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-primary-500/0 group-hover:from-primary-500/5 group-hover:to-primary-600/10 transition-all duration-300" />
                  <span className="relative text-sm font-medium text-dark-800 group-hover:text-primary-700 transition-colors">
                    {district.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 🌏 Anadolu Yakası */}
        <section className="py-12 sm:py-16 bg-gradient-to-b from-white via-primary-50/30 to-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-dark-950">Anadolu Yakası</h2>
                <p className="text-dark-500 text-sm">{ANADOLU_ILCELERI.length} ilçede hizmet</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {ANADOLU_ILCELERI.map((district) => (
                <Link
                  key={district.id}
                  href={`/sehir/${createCitySlug(district.name)}`}
                  className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl p-4 text-center shadow-lg ring-1 ring-dark-100/20 border border-white/40 transition-all duration-300 hover:shadow-xl hover:bg-white/95 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 to-teal-500/0 group-hover:from-teal-500/10 group-hover:to-emerald-600/15 transition-all duration-300" />
                  <span className="relative text-sm font-medium text-dark-800 group-hover:text-teal-700 transition-colors">
                    {district.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 📦 Teslimat Bilgisi */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-xs font-semibold text-primary-700 mb-4">
                <Truck className="h-3.5 w-3.5" />
                TESLİMAT GARANTİSİ
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-dark-950 mb-3">
                İstanbul <span className="text-primary-600">Teslimat Seçenekleri</span>
              </h2>
              <p className="text-dark-600 max-w-2xl mx-auto">
                Profesyonel teslimat ekibimiz ile siparişleriniz güvenle kapınıza ulaşsın
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="group rounded-3xl bg-white/80 backdrop-blur-xl p-8 text-center shadow-lg ring-1 ring-dark-100/20 transition-all hover:shadow-xl hover:bg-white/95 hover:-translate-y-1">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-dark-950 mb-2">Aynı Gün Teslimat</h3>
                <p className="text-dark-600 text-sm">
                  Saat 16:00&apos;ya kadar verilen siparişler aynı gün teslim edilir.
                </p>
              </div>
              
              <div className="group rounded-3xl bg-white/80 backdrop-blur-xl p-8 text-center shadow-lg ring-1 ring-dark-100/20 transition-all hover:shadow-xl hover:bg-white/95 hover:-translate-y-1">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-dark-950 mb-2">Ekspres Teslimat</h3>
                <p className="text-dark-600 text-sm">
                  Acil siparişler için 2 saat içinde teslimat seçeneği mevcuttur.
                </p>
              </div>
              
              <div className="group rounded-3xl bg-white/80 backdrop-blur-xl p-8 text-center shadow-lg ring-1 ring-dark-100/20 transition-all hover:shadow-xl hover:bg-white/95 hover:-translate-y-1">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-dark-950 mb-2">Teslimat Fotoğrafı</h3>
                <p className="text-dark-600 text-sm">
                  Her teslimat sonrası fotoğraf ile bilgilendirilirsiniz.
                </p>
              </div>
            </div>
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
                <div className="absolute top-10 left-10 h-2 w-2 rounded-full bg-white/40" />
                <div className="absolute top-20 right-20 h-3 w-3 rounded-full bg-white/30" />
                <div className="absolute bottom-16 left-1/4 h-2 w-2 rounded-full bg-white/50" />
              </div>
              
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-5 py-2 text-sm font-medium text-white mb-6">
                  <Heart className="h-4 w-4" />
                  <span>39 İlçede Hizmet</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  İstanbul&apos;a Hemen <br className="sm:hidden" />Çiçek Gönderin
                </h2>
                <p className="text-lg text-white/90 max-w-xl mx-auto mb-8">
                  Aynı gün teslimat garantisiyle sevdiklerinize özel anlar yaratın.
                </p>
                
                <Link
                  href="/kategoriler"
                  className="inline-flex items-center gap-3 rounded-2xl bg-white/90 backdrop-blur-xl px-10 py-5 text-lg font-bold text-primary-700 shadow-2xl ring-1 ring-white/50 transition-all hover:shadow-3xl hover:scale-[1.03] active:scale-[0.98]"
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
