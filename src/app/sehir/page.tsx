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
import DarkVeilBackground from '@/components/DarkVeilBackground'
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
                <li className="font-medium text-white">Teslimat Bölgeleri</li>
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
                  <span>39 İlçe • Tüm İstanbul</span>
                </div>
                
                {/* Emotional Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                  <span className="text-white">
                    İstanbul&apos;a
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-primary-400 bg-clip-text text-transparent">
                    Çiçek Teslimatı
                  </span>
                </h1>
                
                <p className="max-w-2xl text-base sm:text-lg text-white/80 leading-relaxed mb-8">
                  İstanbul&apos;un tüm ilçelerine aynı gün çiçek teslimatı. Avrupa ve Anadolu yakasına taze çiçekler, özenli paketleme ve hızlı teslimat garantisi.
                </p>

                {/* Trust Badges Row */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/15 backdrop-blur-xl px-5 py-3 shadow-lg ring-1 ring-white/20 transition-all hover:bg-white/25 hover:scale-[1.02]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                      <Map className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">39 İlçe</span>
                      <p className="text-xs text-white/70">Tüm İstanbul</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/15 backdrop-blur-xl px-5 py-3 shadow-lg ring-1 ring-white/20 transition-all hover:bg-white/25 hover:scale-[1.02]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                      <Truck className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">Aynı Gün</span>
                      <p className="text-xs text-white/70">Hızlı Teslimat</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/15 backdrop-blur-xl px-5 py-3 shadow-lg ring-1 ring-white/20 transition-all hover:bg-white/25 hover:scale-[1.02]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
                      <Flower2 className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">1000+ Çiçek</span>
                      <p className="text-xs text-white/70">Geniş Seçim</p>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  href="/kategoriler"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary-500/40 ring-1 ring-white/30 transition-all hover:shadow-2xl hover:shadow-primary-500/50 hover:scale-[1.03] active:scale-[0.98]"
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
              className="group flex items-center justify-between rounded-3xl bg-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-xl ring-1 ring-white/20 hover:bg-white/20 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-primary-300 transition-colors">
                    İstanbul Çiçek Siparişi
                  </h2>
                  <p className="text-white/70 mt-1">
                    Tüm İstanbul&apos;a aynı gün teslimat garantisi
                  </p>
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                <ChevronRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform" />
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
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Avrupa Yakası</h2>
                <p className="text-white/60 text-sm">{AVRUPA_ILCELERI.length} ilçede hizmet</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {AVRUPA_ILCELERI.map((district) => (
                <Link
                  key={district.id}
                  href={`/sehir/${createCitySlug(district.name)}`}
                  className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl p-4 text-center shadow-lg ring-1 ring-white/20 transition-all duration-300 hover:bg-white/20 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/20 group-hover:to-indigo-600/30 transition-all duration-300" />
                  <span className="relative text-sm font-medium text-white group-hover:text-white transition-colors">
                    {district.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 🌏 Anadolu Yakası */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Anadolu Yakası</h2>
                <p className="text-white/60 text-sm">{ANADOLU_ILCELERI.length} ilçede hizmet</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {ANADOLU_ILCELERI.map((district) => (
                <Link
                  key={district.id}
                  href={`/sehir/${createCitySlug(district.name)}`}
                  className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl p-4 text-center shadow-lg ring-1 ring-white/20 transition-all duration-300 hover:bg-white/20 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 to-emerald-500/0 group-hover:from-teal-500/20 group-hover:to-emerald-600/30 transition-all duration-300" />
                  <span className="relative text-sm font-medium text-white group-hover:text-white transition-colors">
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
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-xl px-4 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 mb-4">
                <Truck className="h-3.5 w-3.5" />
                TESLİMAT GARANTİSİ
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                İstanbul <span className="text-primary-400">Teslimat Seçenekleri</span>
              </h2>
              <p className="text-white/70 max-w-2xl mx-auto">
                Profesyonel teslimat ekibimiz ile siparişleriniz güvenle kapınıza ulaşsın
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="group rounded-3xl bg-white/10 backdrop-blur-xl p-8 text-center shadow-lg ring-1 ring-white/20 transition-all hover:bg-white/20 hover:-translate-y-1">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Aynı Gün Teslimat</h3>
                <p className="text-white/70 text-sm">
                  Saat 16:00&apos;ya kadar verilen siparişler aynı gün teslim edilir.
                </p>
              </div>
              
              <div className="group rounded-3xl bg-white/10 backdrop-blur-xl p-8 text-center shadow-lg ring-1 ring-white/20 transition-all hover:bg-white/20 hover:-translate-y-1">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Ekspres Teslimat</h3>
                <p className="text-white/70 text-sm">
                  Acil siparişler için 2 saat içinde teslimat seçeneği mevcuttur.
                </p>
              </div>
              
              <div className="group rounded-3xl bg-white/10 backdrop-blur-xl p-8 text-center shadow-lg ring-1 ring-white/20 transition-all hover:bg-white/20 hover:-translate-y-1">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Teslimat Fotoğrafı</h3>
                <p className="text-white/70 text-sm">
                  Her teslimat sonrası fotoğraf ile bilgilendirilirsiniz.
                </p>
              </div>
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
                  <span>39 İlçede Hizmet</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  İstanbul&apos;a Hemen <br className="sm:hidden" />Çiçek Gönderin
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
