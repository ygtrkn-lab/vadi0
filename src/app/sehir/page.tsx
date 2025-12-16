import { Metadata } from 'next'
import Link from 'next/link'
import { Building2, Camera, ChevronRight, Clock, Flower, Map, MapPin, Rocket, Truck } from 'lucide-react'
import { Footer, Header } from '@/components'
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
      <main className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-white">
        {/* Hero Section */}
        <section className="pt-10 pb-8 sm:pt-14 sm:pb-10">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <nav className="mb-4 text-xs text-dark-600 sm:text-sm">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <li><Link href="/" className="hover:text-primary-700">Ana Sayfa</Link></li>
                <li className="text-dark-300">/</li>
                <li className="font-medium text-dark-900">Teslimat Bölgeleri</li>
              </ol>
            </nav>

            <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-soft-lg ring-1 ring-black/5 sm:p-10">
              <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-primary-100 to-transparent opacity-80" />
              <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-gradient-to-tr from-secondary-100 to-transparent opacity-60" />
              <div className="relative">
                <h1 className="text-3xl font-bold tracking-tight text-dark-950 sm:text-4xl">
                  İstanbul Çiçek Teslimatı
                </h1>
                <p className="mt-3 max-w-2xl text-base text-dark-700 sm:text-lg">
                  İstanbul&apos;un tüm ilçelerine aynı gün çiçek teslimatı. Avrupa ve Anadolu yakasına taze çiçekler, özenli paketleme ve hızlı teslimat.
                </p>

                <div className="mt-6 -mx-2 flex gap-3 overflow-x-auto px-2 pb-1">
                  <div className="shrink-0 flex items-center gap-2 rounded-2xl bg-primary-50 px-4 py-2 text-xs font-medium text-primary-700 ring-1 ring-primary-100 sm:text-sm">
                    <Map className="h-4 w-4" aria-hidden="true" />
                    <span>39 İlçe</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 rounded-2xl bg-primary-50 px-4 py-2 text-xs font-medium text-primary-700 ring-1 ring-primary-100 sm:text-sm">
                    <Truck className="h-4 w-4" aria-hidden="true" />
                    <span>Aynı Gün Teslimat</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 rounded-2xl bg-primary-50 px-4 py-2 text-xs font-medium text-primary-700 ring-1 ring-primary-100 sm:text-sm">
                    <Flower className="h-4 w-4" aria-hidden="true" />
                    <span>1000+ Çiçek</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* İstanbul Ana Link */}
        <section className="pb-8">
          <div className="container mx-auto px-4">
            <Link
              href="/sehir/istanbul"
              className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5 hover:bg-primary-50 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 ring-1 ring-primary-100">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
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
              <ChevronRight className="h-5 w-5 text-primary-700 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* Avrupa Yakası */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-soft ring-1 ring-black/5 text-primary-700">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold">Avrupa Yakası</h2>
              <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded text-sm ring-1 ring-primary-100">
                {AVRUPA_ILCELERI.length} İlçe
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {AVRUPA_ILCELERI.map((district) => (
                <Link
                  key={district.id}
                  href={`/sehir/istanbul/${createCitySlug(district.name)}`}
                  className="bg-white hover:bg-primary-50 border border-dark-200 hover:border-primary-200 rounded-2xl px-4 py-3 text-center transition-all shadow-soft hover:shadow-soft-lg group"
                >
                  <span className="font-medium text-dark-800 group-hover:text-primary-700">
                    {district.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Anadolu Yakası */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 ring-1 ring-primary-100 text-primary-700">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold">Anadolu Yakası</h2>
              <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded text-sm ring-1 ring-primary-100">
                {ANADOLU_ILCELERI.length} İlçe
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {ANADOLU_ILCELERI.map((district) => (
                <Link
                  key={district.id}
                  href={`/sehir/istanbul/${createCitySlug(district.name)}`}
                  className="bg-white hover:bg-primary-50 border border-dark-200 hover:border-primary-200 rounded-2xl px-4 py-3 text-center transition-all shadow-soft hover:shadow-soft-lg group"
                >
                  <span className="font-medium text-dark-800 group-hover:text-primary-700">
                    {district.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Teslimat Bilgisi */}
        <section className="py-10 sm:py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-dark-950">İstanbul Çiçek Teslimat Bilgisi</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 text-center shadow-soft ring-1 ring-black/5">
                  <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-primary-100 text-primary-700">
                    <Clock className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold mb-2">Aynı Gün Teslimat</h3>
                  <p className="text-dark-600 text-sm">
                    Saat 16:00&apos;ya kadar verilen siparişler aynı gün teslim edilir.
                  </p>
                </div>
                <div className="bg-white rounded-3xl p-6 text-center shadow-soft ring-1 ring-black/5">
                  <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-primary-100 text-primary-700">
                    <Rocket className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold mb-2">Ekspres Teslimat</h3>
                  <p className="text-dark-600 text-sm">
                    Acil siparişler için 2 saat içinde teslimat seçeneği mevcuttur.
                  </p>
                </div>
                <div className="bg-white rounded-3xl p-6 text-center shadow-soft ring-1 ring-black/5">
                  <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-primary-100 text-primary-700">
                    <Camera className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold mb-2">Teslimat Fotoğrafı</h3>
                  <p className="text-dark-600 text-sm">
                    Her teslimat sonrası fotoğraf ile bilgilendirilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-white shadow-soft-xl ring-1 ring-black/5">
              <h2 className="text-2xl font-bold sm:text-3xl mb-3">İstanbul&apos;a Çiçek Gönderin</h2>
              <p className="text-base text-white/90 sm:text-lg mb-6">
                39 ilçeye aynı gün teslimat garantisiyle sevdiklerinizi mutlu edin.
              </p>
              <Link
                href="/kategoriler"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-6 text-sm font-semibold text-primary-700 hover:bg-primary-50"
              >
                Çiçek Seç
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
