import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SPECIAL_DAYS } from '@/data/special-days'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com'

export const metadata: Metadata = {
  title: 'Özel Gün Çiçekleri | Sevgililer Günü, Anneler Günü, Doğum Günü | Vadiler Çiçek',
  description: 'Her özel gün için en güzel çiçekler! Sevgililer günü, anneler günü, doğum günü, yıldönümü ve tüm özel anlarınız için çiçek koleksiyonları. Vadiler Çiçek ile İstanbul\'a aynı gün teslimat.',
  keywords: ['özel gün çiçekleri', 'sevgililer günü çiçek', 'anneler günü çiçek', 'doğum günü çiçek', 'yıldönümü çiçek', 'online çiçek'],
  alternates: {
    canonical: `${BASE_URL}/ozel-gun`,
  },
  openGraph: {
    title: 'Özel Gün Çiçekleri | Vadiler Çiçek',
    description: 'Her özel gün için en güzel çiçekler! Sevgililer günü, anneler günü, doğum günü ve tüm özel anlarınız için.',
    url: `${BASE_URL}/ozel-gun`,
    siteName: 'Vadiler Çiçek',
    locale: 'tr_TR',
    type: 'website',
  },
}

export default function SpecialDaysIndexPage() {
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
        name: 'Özel Günler',
        item: `${BASE_URL}/ozel-gun`,
      },
    ],
  }

  // CollectionPage Schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Özel Gün Çiçekleri',
    description: 'Her özel gün için en güzel çiçek koleksiyonları',
    url: `${BASE_URL}/ozel-gun`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: SPECIAL_DAYS.map((day, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: day.name,
          url: `${BASE_URL}/ozel-gun/${day.slug}`,
          description: day.description,
        },
      })),
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-pink-500 to-rose-500 text-white py-16">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-white/80">
              <ol className="flex items-center space-x-2">
                <li><Link href="/" className="hover:text-white">Ana Sayfa</Link></li>
                <li>/</li>
                <li className="text-white font-medium">Özel Günler</li>
              </ol>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Özel Gün Çiçekleri
            </h1>
            <p className="text-xl text-white/90 max-w-2xl">
              Her özel an için en güzel çiçekler! Sevgililer günü, anneler günü, doğum günü 
              ve tüm özel anlarınızı çiçeklerle taçlandırın.
            </p>
          </div>
        </section>

        {/* Özel Günler Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SPECIAL_DAYS.map((day) => (
                <Link
                  key={day.id}
                  href={`/ozel-gun/${day.slug}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <Image
                      src={day.image}
                      alt={day.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    {day.date && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                        <span className="text-sm font-medium text-pink-600">📅 {day.date}</span>
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-2xl font-bold text-white mb-1">{day.name}</h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {day.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {day.keywords.slice(0, 3).map((keyword, index) => (
                        <span
                          key={index}
                          className="bg-pink-50 text-pink-600 px-2 py-1 rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                    <span className="text-pink-600 font-medium group-hover:text-pink-700 inline-flex items-center">
                      Çiçekleri Gör
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-6">Her Özel Gün İçin Mükemmel Çiçekler</h2>
              <p className="text-gray-600 mb-8">
                Vadiler Çiçek olarak, hayatınızdaki özel anları çiçeklerle daha da anlam kılmanıza yardımcı oluyoruz. 
                Sevgililer Günü&apos;nün romantik kırmızı güllerinden, Anneler Günü&apos;nün zarif orkidelerine, 
                doğum günlerinin neşeli buketlerinden taziye çiçeklerine kadar her duygu ve an için 
                özenle hazırlanmış koleksiyonlarımız mevcuttur.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl">🌹</span>
                  </div>
                  <h3 className="font-medium">Taze Çiçekler</h3>
                  <p className="text-sm text-gray-500">Günlük kesim</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl">🚚</span>
                  </div>
                  <h3 className="font-medium">Aynı Gün</h3>
                  <p className="text-sm text-gray-500">Teslimat garantisi</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl">💯</span>
                  </div>
                  <h3 className="font-medium">Memnuniyet</h3>
                  <p className="text-sm text-gray-500">%100 garanti</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl">📸</span>
                  </div>
                  <h3 className="font-medium">Teslimat Fotoğrafı</h3>
                  <p className="text-sm text-gray-500">Anlık bildirim</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Özel Gününüzü Çiçeklerle Kutlayın
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              İstanbul&apos;un tüm ilçelerine aynı gün teslimat garantisiyle.
            </p>
            <Link
              href="/kategoriler"
              className="inline-block bg-white text-pink-600 px-8 py-3 rounded-full font-bold hover:bg-pink-50 transition-colors"
            >
              Tüm Çiçekleri Keşfet
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
