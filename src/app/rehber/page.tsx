import { Metadata } from 'next';
import Link from 'next/link';
import { Footer, Header, MobileNavBar } from '@/components';
import { GUIDE_CONTENTS } from '@/data/guide-contents';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://vadilercicek.com';

export const metadata: Metadata = {
  title: 'Çiçek Rehberi ve İpuçları | Vadiler Çiçek Blog',
  description: 'Çiçek seçimi, bakımı, renk anlamları ve teslimat bilgileri. Uzman çiçekçilerden ipuçları ve rehberler!',
  keywords: ['çiçek rehberi', 'çiçek bakımı', 'çiçek seçimi', 'çiçek anlamları', 'çiçek blog'],
  alternates: {
    canonical: `${BASE_URL}/rehber`,
  },
  openGraph: {
    title: 'Çiçek Rehberi ve İpuçları | Vadiler Çiçek',
    description: 'Çiçekler hakkında bilmeniz gereken her şey! Seçim, bakım, anlamlar ve daha fazlası.',
    url: `${BASE_URL}/rehber`,
    type: 'website',
    siteName: 'Vadiler Çiçek',
    locale: 'tr_TR',
  },
};

const categories = [
  { id: 'selection', name: 'Çiçek Seçimi' },
  { id: 'care', name: 'Çiçek Bakımı' },
  { id: 'meanings', name: 'Çiçek Anlamları' },
  { id: 'occasions', name: 'Özel Günler' },
  { id: 'delivery', name: 'Teslimat Bilgisi' },
  { id: 'tips', name: 'İpuçları' },
];

export default function RehberIndexPage() {
  // Kolleksiyon Schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Çiçek Rehberi ve Blog',
    description: 'Çiçek seçimi, bakımı ve özel günler hakkında uzman rehberleri',
    url: `${BASE_URL}/rehber`,
  };

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
        name: 'Rehber',
        item: `${BASE_URL}/rehber`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-md shadow-soft p-8 md:p-12 mb-12">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-primary-50/60 via-white/20 to-white/0" />
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-3">
              Çiçek Rehberi
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-3xl">
              Çiçek seçimi, bakımı, renk anlamları ve teslimat süreci hakkında pratik bilgiler ve rehberler.
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Kategoriler</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="inline-flex items-center rounded-full border border-gray-200 bg-white/70 backdrop-blur px-4 py-2 text-sm font-medium text-gray-800 hover:border-gray-300 hover:shadow-soft transition"
              >
                {cat.name}
              </a>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-end justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Öne Çıkan Rehberler</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GUIDE_CONTENTS.slice(0, 3).map((guide) => (
              <Link
                key={guide.slug}
                href={`/rehber/${guide.slug}`}
                className="group rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-md shadow-soft hover:shadow-soft transition overflow-hidden"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={guide.image}
                    alt={guide.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 rounded-full border border-white/30 bg-black/40 backdrop-blur px-3 py-1 text-xs font-semibold text-white">
                    {guide.readTime} dk
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-xs text-primary-600 font-semibold mb-2">
                    {guide.categoryName}
                  </div>
                  <h3 className="text-lg font-semibold leading-snug mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {guide.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{guide.author}</span>
                    <span>{new Date(guide.publishDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* All Guides by Category */}
        {categories.map((cat) => {
          const categoryGuides = GUIDE_CONTENTS.filter(
            (g) => g.category === cat.id
          );
          if (categoryGuides.length === 0) return null;

          return (
            <div key={cat.id} id={cat.id} className="mb-12 scroll-mt-28">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{cat.name}</h2>
                <span className="text-sm text-gray-500">{categoryGuides.length} içerik</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {categoryGuides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/rehber/${guide.slug}`}
                    className="group flex gap-4 rounded-2xl border border-gray-100 bg-white/70 backdrop-blur-md p-4 shadow-soft hover:shadow-soft transition"
                  >
                    <img
                      src={guide.image}
                      alt={guide.title}
                      className="w-28 h-28 md:w-32 md:h-32 object-cover rounded-xl flex-shrink-0 ring-1 ring-black/5"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-base md:text-lg mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">
                        {guide.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {guide.excerpt}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{guide.readTime} dk okuma</span>
                        <span>{new Date(guide.publishDate).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        <div className="rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-md shadow-soft p-6 md:p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Çiçek Siparişi Vermek İster misiniz?
          </h2>
          <p className="text-sm md:text-base text-gray-600 mb-6 max-w-2xl mx-auto">
            Rehberlerden öğrendiklerinizi uygulayın; kategori ve özel gün koleksiyonlarından hızlıca seçim yapın.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/kategoriler"
              className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-glow hover:bg-primary-600 transition"
            >
              Tüm Kategoriler
            </Link>
            <Link
              href="/ozel-gun"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white/70 px-6 py-3 text-sm font-semibold text-gray-900 hover:border-gray-300 hover:shadow-soft transition"
            >
              Özel Günler
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      <MobileNavBar />
    </>
  );
}
