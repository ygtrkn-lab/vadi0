import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SPECIAL_DAYS, getSpecialDayBySlug, getAllSpecialDaySlugs } from '@/data/special-days'
import { getOccasionFAQs } from '@/data/occasion-faqs'
import ProductCard from '@/components/ProductCard'
import supabaseAdmin from '@/lib/supabase/admin'
import { transformProducts, type Product } from '@/lib/transformers'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com'

interface PageProps {
  params: Promise<{ occasion: string }>
}

// Statik sayfaları oluştur
export async function generateStaticParams() {
  return getAllSpecialDaySlugs().map(slug => ({ occasion: slug }))
}

// Dinamik metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { occasion } = await params
  const specialDay = getSpecialDayBySlug(occasion)

  if (!specialDay) {
    return {
      title: 'Sayfa Bulunamadı | Vadiler Çiçek',
    }
  }

  return {
    title: specialDay.metaTitle,
    description: specialDay.metaDescription,
    keywords: specialDay.keywords,
    alternates: {
      canonical: `${BASE_URL}/ozel-gun/${occasion}`,
    },
    openGraph: {
      title: specialDay.title,
      description: specialDay.description,
      url: `${BASE_URL}/ozel-gun/${occasion}`,
      siteName: 'Vadiler Çiçek',
      images: [
        {
          url: specialDay.image,
          width: 1200,
          height: 630,
          alt: specialDay.title,
        },
      ],
      locale: 'tr_TR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: specialDay.title,
      description: specialDay.description,
      images: [specialDay.image],
    },
  }
}

// Ürünleri özel güne göre filtrele
function getProductsForSpecialDay(specialDay: typeof SPECIAL_DAYS[0], products: Product[]) {
  const matchingProducts = products.filter((product) => {
    // Ürün tag'lerini kontrol et
    if (product.tags) {
      const hasMatchingTag = product.tags.some(tag =>
        specialDay.relatedTags.some(relatedTag =>
          tag.toLowerCase().includes(relatedTag.toLowerCase()) ||
          relatedTag.toLowerCase().includes(tag.toLowerCase())
        )
      )
      if (hasMatchingTag) return true
    }

    // Ürün adını kontrol et
    const nameMatch = specialDay.relatedTags.some(tag =>
      product.name.toLowerCase().includes(tag.toLowerCase())
    )
    if (nameMatch) return true

    // Açıklamayı kontrol et
    const descMatch = specialDay.relatedTags.some(tag =>
      (product.description || '').toLowerCase().includes(tag.toLowerCase())
    )
    if (descMatch) return true

    return false
  })

  // Eğer yeterli ürün bulunamazsa, rastgele ürünler ekle
  if (matchingProducts.length < 12) {
    const additionalProducts = products
      .filter(p => !matchingProducts.find(m => m.id === p.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 12 - matchingProducts.length)
    
    return [...matchingProducts, ...additionalProducts].slice(0, 24)
  }

  return matchingProducts.slice(0, 24)
}

export default async function SpecialDayPage({ params }: PageProps) {
  const { occasion } = await params
  const specialDay = getSpecialDayBySlug(occasion)

  if (!specialDay) {
    notFound()
  }

  // Prefer DB tagging when available, then fallback to a larger pool for text-match.
  const tagged = await supabaseAdmin
    .from('products')
    .select('*')
    .contains('occasion_tags', [occasion])
    .order('id', { ascending: true })
    .limit(240);

  const pool = tagged.data && tagged.data.length > 0
    ? tagged.data
    : (
        (await supabaseAdmin
          .from('products')
          .select('*')
          .order('id', { ascending: true })
          .limit(500)
        ).data ?? []
      );

  const transformedPool = transformProducts(pool as any);
  const matchingProducts = getProductsForSpecialDay(specialDay, transformedPool)

  // CollectionPage JSON-LD Schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${BASE_URL}/ozel-gun/${occasion}`,
    name: specialDay.title,
    description: specialDay.description,
    url: `${BASE_URL}/ozel-gun/${occasion}`,
    image: specialDay.image,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: matchingProducts.slice(0, 10).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          description: product.description || product.name,
          url: `${BASE_URL}/${product.category}/${product.slug}`,
          image: product.image || 'https://vadiler.com/placeholder.jpg',
          sku: product.sku || `VAD-${product.id}`,
          brand: {
            '@type': 'Brand',
            name: 'Vadiler Çiçek',
          },
          offers: {
            '@type': 'Offer',
            // Fiyatı noktalı ondalık formatında gönder (Google standardı)
            price: Number(product.price).toFixed(2),
            priceCurrency: 'TRY',
            priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            seller: {
              '@type': 'Organization',
              name: 'Vadiler Çiçek',
            },
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              applicableCountry: 'TR',
              returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
              merchantReturnDays: 2,
              returnMethod: 'https://schema.org/ReturnByMail',
              returnFees: 'https://schema.org/FreeReturn',
            },
            shippingDetails: {
              '@type': 'OfferShippingDetails',
              shippingRate: {
                '@type': 'MonetaryAmount',
                value: '0',
                currency: 'TRY',
              },
              shippingDestination: {
                '@type': 'DefinedRegion',
                addressCountry: 'TR',
                addressRegion: 'İstanbul',
              },
              deliveryTime: {
                '@type': 'ShippingDeliveryTime',
                handlingTime: {
                  '@type': 'QuantitativeValue',
                  minValue: 0,
                  maxValue: 1,
                  unitCode: 'DAY',
                },
                transitTime: {
                  '@type': 'QuantitativeValue',
                  minValue: 0,
                  maxValue: 1,
                  unitCode: 'DAY',
                },
              },
            },
          },
          ...(product.rating > 0 && product.reviewCount > 0 && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: product.rating,
              reviewCount: product.reviewCount,
              bestRating: 5,
              worstRating: 1,
            },
          }),
        },
      })),
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
        name: 'Özel Günler',
        item: `${BASE_URL}/ozel-gun`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: specialDay.name,
        item: `${BASE_URL}/ozel-gun/${occasion}`,
      },
    ],
  }

  // Diğer özel günler
  const otherSpecialDays = SPECIAL_DAYS.filter(day => day.slug !== occasion).slice(0, 6)

  // FAQ Schema - Özel gün bazlı sorular
  const occasionFaqs = getOccasionFAQs(occasion);
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: occasionFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
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
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-pink-500 to-rose-500 text-white py-20 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-repeat"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-white/80">
              <ol className="flex items-center space-x-2">
                <li><Link href="/" className="hover:text-white">Ana Sayfa</Link></li>
                <li>/</li>
                <li><Link href="/kategoriler" className="hover:text-white">Kategoriler</Link></li>
                <li>/</li>
                <li className="text-white font-medium">{specialDay.name}</li>
              </ol>
            </nav>

            {specialDay.date && (
              <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                <span className="text-sm font-medium">📅 {specialDay.date}</span>
              </div>
            )}

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              {specialDay.title}
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mb-8">
              {specialDay.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {specialDay.keywords.slice(0, 4).map((keyword, index) => (
                <span
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Ürünler Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold">{specialDay.name} Çiçekleri</h2>
                <p className="text-gray-600 mt-1">
                  {matchingProducts.length} ürün bulundu
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {matchingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {matchingProducts.length === 24 && (
              <div className="mt-8 text-center">
                <Link
                  href="/kategoriler"
                  className="inline-block bg-pink-600 text-white px-8 py-3 rounded-full font-medium hover:bg-pink-700 transition-colors"
                >
                  Daha Fazla Ürün Görüntüle
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* İçerik Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">
                {specialDay.name} İçin En İyi Çiçekler
              </h2>
              <div className="prose prose-lg max-w-none text-gray-600 text-center">
                <p className="mb-4">
                  {specialDay.description}
                </p>
                <p className="mb-4">
                  Vadiler Çiçek olarak {specialDay.name.toLowerCase()} için en özel çiçekleri sizin için hazırlıyoruz. 
                  Taze çiçekler, özenli paketleme ve aynı gün teslimat garantisiyle sevdiklerinize 
                  unutulmaz bir sürpriz yapabilirsiniz.
                </p>
                <p>
                  İstanbul&apos;un tüm ilçelerine aynı gün teslimat ile {specialDay.name.toLowerCase()} çiçeklerinizi
                  en taze haliyle sevdiklerinize ulaştırıyoruz.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Diğer Özel Günler */}
        <section className="py-12 bg-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Diğer Özel Günler</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {otherSpecialDays.map((day) => (
                <Link
                  key={day.id}
                  href={`/ozel-gun/${day.slug}`}
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow text-center group"
                >
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-pink-200 transition-colors">
                    <span className="text-2xl">💐</span>
                  </div>
                  <h3 className="font-medium text-gray-800 text-sm group-hover:text-pink-600 transition-colors">
                    {day.name}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              {specialDay.name} Sürprizinizi Hazırlayın
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Aynı gün teslimat garantisiyle sevdiklerinize unutulmaz bir sürpriz yapın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/kategoriler"
                className="inline-block bg-white text-pink-600 px-8 py-3 rounded-full font-bold hover:bg-pink-50 transition-colors"
              >
                Tüm Çiçekleri Gör
              </Link>
              <Link
                href="/sehir/istanbul"
                className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white/10 transition-colors"
              >
                Teslimat Bölgeleri
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
