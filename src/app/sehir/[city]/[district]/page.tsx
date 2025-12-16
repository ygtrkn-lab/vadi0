import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Flower, MapPin, Star, Truck } from 'lucide-react'
import { Footer, Header } from '@/components'
import { getDistrictContentBySlug, createCitySlug } from '@/data/city-content'
import { ISTANBUL_ILCELERI } from '@/data/istanbul-districts'
import { products } from '@/data/products'
import ProductCard from '@/components/ProductCard'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com'

interface PageProps {
  params: Promise<{ city: string; district: string }>
}

// Statik sayfaları oluştur
export async function generateStaticParams() {
  // Tüm ilçeler için statik sayfalar oluştur
  const params = ISTANBUL_ILCELERI.map(district => ({
    city: 'istanbul',
    district: createCitySlug(district.name),
  }))
  return params
}

// Dinamik metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { district } = await params
  const content = getDistrictContentBySlug(district)

  // Eğer özel içerik yoksa, ilçe adından otomatik oluştur
  const districtData = ISTANBUL_ILCELERI.find(d => createCitySlug(d.name) === district)

  if (!content && !districtData) {
    return {
      title: 'Sayfa Bulunamadı | Vadiler Çiçek',
    }
  }

  const name = content?.name || districtData?.name || district
  const title = content?.metaTitle || `${name} Çiçek Siparişi | Aynı Gün Teslimat | Vadiler Çiçek`
  const description = content?.metaDescription || `${name}'e online çiçek siparişi! Aynı gün teslimat, taze çiçekler, uygun fiyatlar. Vadiler Çiçek ile ${name}'e çiçek gönderin!`

  return {
    title,
    description,
    keywords: content?.keywords || [`${name.toLowerCase()} çiçek`, `${name.toLowerCase()} çiçekçi`, `${name.toLowerCase()} çiçek siparişi`],
    alternates: {
      canonical: `${BASE_URL}/sehir/istanbul/${district}`,
    },
    openGraph: {
      title: content?.title || `${name} Çiçek Siparişi`,
      description: content?.description || description,
      url: `${BASE_URL}/sehir/istanbul/${district}`,
      siteName: 'Vadiler Çiçek',
      locale: 'tr_TR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: content?.title || `${name} Çiçek Siparişi`,
      description: content?.description || description,
    },
  }
}

export default async function DistrictPage({ params }: PageProps) {
  const { district } = await params
  const content = getDistrictContentBySlug(district)
  const districtData = ISTANBUL_ILCELERI.find(d => createCitySlug(d.name) === district)

  if (!content && !districtData) {
    notFound()
  }

  const name = content?.name || districtData?.name || district
  const side = districtData?.side === 'anadolu' ? 'Anadolu Yakası' : 'Avrupa Yakası'

  // İlçe bazlı sabit ürün seçimi (her ilçe için tutarlı görünüm)
  const districtIndex = ISTANBUL_ILCELERI.findIndex(d => createCitySlug(d.name) === district) + 1
  const startIndex = (districtIndex * 5) % Math.max(products.length - 12, 1)
  const shuffledProducts = products.slice(startIndex, startIndex + 12)

  // LocalBusiness JSON-LD Schema
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${BASE_URL}/sehir/istanbul/${district}`,
    name: 'Vadiler Çiçek',
    description: content?.description || `${name}'e online çiçek siparişi ve aynı gün teslimat.`,
    url: `${BASE_URL}/sehir/istanbul/${district}`,
    telephone: '+90-850-307-4876',
    address: {
      '@type': 'PostalAddress',
      addressLocality: name,
      addressRegion: 'İstanbul',
      addressCountry: 'TR',
    },
    areaServed: {
      '@type': 'Place',
      name: `${name}, İstanbul`,
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
        name: 'İstanbul',
        item: `${BASE_URL}/sehir/istanbul`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: name,
        item: `${BASE_URL}/sehir/istanbul/${district}`,
      },
    ],
  }

  // Varsayılan içerik (eğer özel içerik yoksa)
  const defaultContent = `${name}, İstanbul'un ${side}'nda yer alan önemli ilçelerden biridir. Vadiler Çiçek olarak ${name}'in her köşesine taze ve kaliteli çiçekler ulaştırıyoruz.

${name} Çiçek Teslimat Hizmetimiz

Aynı gün teslimat garantisiyle ${name}'e çiçek gönderebilirsiniz. Saat 16:00'ya kadar verilen siparişler aynı gün içinde teslim edilir.

Geniş Ürün Yelpazesi

Güller, orkideler, lilyumlar, papatyalar ve mevsim çiçekleriyle ${name}'deki sevdiklerinize en güzel sürprizi yapabilirsiniz.

Güvenli Ödeme

Kredi kartı, havale ve kapıda ödeme seçenekleriyle güvenle alışveriş yapabilirsiniz. Teslimat sonrası fotoğraf ile bilgilendirilirsiniz.`

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
      <main className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-white">
        {/* Hero Section */}
        <section className="pt-10 pb-8 sm:pt-14 sm:pb-10">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <nav className="mb-4 text-xs text-dark-600 sm:text-sm">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <li><Link href="/" className="hover:text-primary-700">Ana Sayfa</Link></li>
                <li className="text-dark-300">/</li>
                <li><Link href="/sehir/istanbul" className="hover:text-primary-700">İstanbul</Link></li>
                <li className="text-dark-300">/</li>
                <li className="font-medium text-dark-900">{name}</li>
              </ol>
            </nav>

            <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-soft-lg ring-1 ring-black/5 sm:p-10">
              <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-primary-100 to-transparent opacity-80" />
              <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-gradient-to-tr from-secondary-100 to-transparent opacity-60" />
              <div className="relative">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-primary-100">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  <span>{side}</span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-dark-950 sm:text-4xl">
                  {name} Çiçek Siparişi
                </h1>
                <p className="mt-3 max-w-2xl text-base text-dark-700 sm:text-lg">
                  {content?.description || `${name}'e online çiçek siparişi. Aynı gün teslimat garantisiyle sevdiklerinizi mutlu edin.`}
                </p>

                <div className="mt-6 -mx-2 flex gap-3 overflow-x-auto px-2 pb-1">
                  <div className="shrink-0 flex items-center gap-2 rounded-2xl bg-primary-50 px-4 py-2 text-xs font-medium text-primary-700 ring-1 ring-primary-100 sm:text-sm">
                    <Truck className="h-4 w-4" aria-hidden="true" />
                    <span>{content?.deliveryInfo || 'Aynı gün teslimat'}</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 rounded-2xl bg-primary-50 px-4 py-2 text-xs font-medium text-primary-700 ring-1 ring-primary-100 sm:text-sm">
                    <Flower className="h-4 w-4" aria-hidden="true" />
                    <span>1000+ Çiçek Seçeneği</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 rounded-2xl bg-primary-50 px-4 py-2 text-xs font-medium text-primary-700 ring-1 ring-primary-100 sm:text-sm">
                    <Star className="h-4 w-4" aria-hidden="true" />
                    <span>4.9 Müşteri Puanı</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popüler Bölgeler */}
        {content?.popularAreas && content.popularAreas.length > 0 && (
          <section className="pb-8">
            <div className="container mx-auto px-4">
              <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
                <h2 className="text-base font-semibold text-dark-950 mb-4">{name} Popüler Bölgeleri</h2>
                <div className="flex flex-wrap gap-2">
                  {content.popularAreas.map((area, index) => (
                    <span
                      key={index}
                      className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-medium ring-1 ring-primary-100 sm:text-sm"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* İçerik Section */}
        <section className="py-10 sm:py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5 sm:p-8">
                  <h2 className="text-xl font-bold text-dark-950 sm:text-2xl mb-5">
                    {name}&apos;de Online Çiçek Siparişi
                  </h2>
                  <div className="prose prose-lg max-w-none text-dark-700">
                    {(content?.content || defaultContent).split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-4">{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="lg:col-span-4">
                <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
                  <h3 className="text-base font-semibold text-dark-950 mb-4">Hızlı Bilgi</h3>
                  <ul className="space-y-3 text-sm text-dark-700">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-2 w-2 rounded-full bg-primary-500" />
                      <span>Saat 16:00&apos;ya kadar aynı gün teslimat</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-2 w-2 rounded-full bg-primary-500" />
                      <span>Güvenli ödeme ve hızlı destek</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 h-2 w-2 rounded-full bg-primary-500" />
                      <span>Taze çiçek, özenli paketleme</span>
                    </li>
                  </ul>
                  <div className="mt-5">
                    <Link
                      href="/kategoriler"
                      className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-primary-500 px-4 text-sm font-medium text-white hover:bg-primary-600"
                    >
                      Çiçek Seç
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Ürünler Section */}
        <section className="py-10 sm:py-12">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-dark-950 sm:text-2xl">
                {name} İçin Popüler Çiçekler
              </h2>
              <Link
                href="/kategoriler"
                className="text-primary-700 hover:text-primary-800 font-medium"
              >
                Tüm Ürünler →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {shuffledProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Diğer İlçeler */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-dark-950 sm:text-2xl">İstanbul&apos;un Diğer İlçeleri</h2>
              <Link
                href="/sehir/istanbul"
                className="hidden sm:inline-flex text-primary-700 hover:text-primary-800 font-medium"
              >
                Tüm İlçeler →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {ISTANBUL_ILCELERI
                .filter(d => createCitySlug(d.name) !== district)
                .slice(0, 12)
                .map((d) => (
                  <Link
                    key={d.id}
                    href={`/sehir/istanbul/${createCitySlug(d.name)}`}
                    className="bg-white hover:bg-primary-50 border border-dark-200 hover:border-primary-200 rounded-2xl px-4 py-3 text-center transition-colors shadow-soft ring-1 ring-black/0"
                  >
                    <span className="text-sm font-medium text-dark-800 hover:text-primary-700">
                      {d.name}
                    </span>
                  </Link>
                ))}
            </div>
            <div className="mt-6 text-center sm:hidden">
              <Link href="/sehir/istanbul" className="text-primary-700 hover:text-primary-800 font-medium">
                Tüm İlçeleri Görüntüle →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-white shadow-soft-xl ring-1 ring-black/5">
              <h2 className="text-2xl font-bold sm:text-3xl mb-3">
                {name}&apos;e Hemen Çiçek Gönderin
              </h2>
              <p className="text-base text-white/90 sm:text-lg mb-6">
                Aynı gün teslimat garantisiyle sevdiklerinizi mutlu edin.
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
