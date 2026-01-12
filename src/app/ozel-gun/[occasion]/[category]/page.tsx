import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { Header, Footer, MobileNavBar } from '@/components';
import { SPECIAL_DAYS } from '@/data/special-days';
import supabaseAdmin from '@/lib/supabase/admin';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

interface PageProps {
  params: Promise<{
    occasion: string;
    category: string;
  }>;
}

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  is_active?: boolean | null;
};

async function fetchActiveCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug, description, image, is_active')
    .eq('is_active', true)
    .order('order', { ascending: true });

  if (error) {
    console.error('Error fetching categories from Supabase:', error);
    return [];
  }

  return (data as unknown as CategoryRow[]) ?? [];
}

async function fetchCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug, description, image, is_active')
    .eq('slug', slug)
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as unknown as CategoryRow;
}

// Statik sayfaları oluştur
export async function generateStaticParams() {
  const params = [];

  const categories = await fetchActiveCategories();
  
  // Her özel gün × kategori kombinasyonu
  for (const occasion of SPECIAL_DAYS) {
    for (const category of categories) {
      params.push({
        occasion: occasion.slug,
        category: category.slug,
      });
    }
  }
  
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { occasion, category } = await params;
  
  const specialDay = SPECIAL_DAYS.find(d => d.slug === occasion);
  const categoryData = await fetchCategoryBySlug(category);
  
  if (!specialDay || !categoryData) {
    return { title: 'Sayfa Bulunamadı' };
  }
  
  const title = `${specialDay.name} ${categoryData.name} | ${specialDay.date || ''} Özel | Vadiler Çiçek`;
  const description = `${specialDay.name} için en güzel ${categoryData.name.toLowerCase()}. ${specialDay.description.substring(0, 120)}... Hızlı ve güvenli teslimat.`;
  
  return {
    title,
    description,
    keywords: [
      ...specialDay.keywords,
      `${specialDay.name.toLowerCase()} ${categoryData.name.toLowerCase()}`,
      `${occasion} ${category}`,
      `${categoryData.name.toLowerCase()} ${specialDay.name.toLowerCase()}`,
      `online ${categoryData.name.toLowerCase()} siparişi ${specialDay.name.toLowerCase()}`,
    ],
    alternates: {
      canonical: `${BASE_URL}/ozel-gun/${occasion}/${category}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/ozel-gun/${occasion}/${category}`,
      type: 'website',
      images: [categoryData.image || specialDay.image],
      siteName: 'Vadiler Çiçek',
      locale: 'tr_TR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [categoryData.image || specialDay.image],
    },
  };
}

export default async function OccasionCategoryPage({ params }: PageProps) {
  const { occasion, category } = await params;
  
  const specialDay = SPECIAL_DAYS.find(d => d.slug === occasion);
  const categoryData = await fetchCategoryBySlug(category);
  
  if (!specialDay || !categoryData) {
    notFound();
  }

  const activeCategories = await fetchActiveCategories();
  
  // Build-time'da dış domain'e fetch atmamak için ürünleri Supabase'den doğrudan çek
  // Öncelik: hem kategori hem de occasion tag (occasion_tags) eşleşsin
  const taggedQuery = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('category', category)
    .contains('occasion_tags', [occasion])
    .order('id', { ascending: true })
    .limit(120);

  const taggedProducts = Array.isArray(taggedQuery.data) ? taggedQuery.data : [];
  const products = taggedProducts.length > 0
    ? taggedProducts
    : (
        (await supabaseAdmin
          .from('products')
          .select('*')
          .eq('category', category)
          .order('id', { ascending: true })
          .limit(120)
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
        name: 'Özel Günler',
        item: `${BASE_URL}/ozel-gun`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: specialDay.name,
        item: `${BASE_URL}/ozel-gun/${occasion}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: categoryData.name,
        item: `${BASE_URL}/ozel-gun/${occasion}/${category}`,
      },
    ],
  };

  // CollectionPage Schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${specialDay.name} ${categoryData.name}`,
    description: `${specialDay.name} için ${categoryData.name} koleksiyonu`,
    url: `${BASE_URL}/ozel-gun/${occasion}/${category}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.slice(0, 10).map((product: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          description: product.description || product.name,
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
            availability: product.inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
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
  };

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
      
      <Header />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Hero Section */}
        <div className="mb-10">
          <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-md shadow-soft px-6 py-10 md:px-10">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-primary-50/60 via-white/20 to-white/0" />
            <div className="relative text-center">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mb-3">
                {specialDay.name} {categoryData.name}
              </h1>
              <p className="text-sm md:text-base text-gray-600 max-w-3xl mx-auto">
                {specialDay.name} için {categoryData.name.toLowerCase()} koleksiyonu.
                {specialDay.date && ` ${specialDay.date} özel.`} Hızlı ve güvenli teslimat.
              </p>
            </div>
          </div>
        </div>

        {/* SEO Content Section */}
        <div className="prose prose-base md:prose-lg dark:prose-invert max-w-none mb-10 rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-md shadow-soft p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-4">
            {specialDay.name} için {categoryData.name}
          </h2>
          <p className="mb-4">
            {specialDay.description}
          </p>
          
          <h3 className="text-xl font-semibold mb-3">
            {categoryData.name} ile {specialDay.name} Sürprizi
          </h3>
          <p className="mb-4">
            {(categoryData.description || '')} kategorisinde {products.length} farklı ürün seçeneği sunuyoruz. 
            Her bütçeye uygun, özenle hazırlanmış {categoryData.name.toLowerCase()} ile sevdiklerinize 
            unutulmaz bir sürpriz yapabilirsiniz.
          </p>

          <h3 className="text-xl font-semibold mb-3">
            Neden Bu Kategoriyi Seçmelisiniz?
          </h3>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Özel Gün Temalı:</strong> {specialDay.name} konseptine uygun özel seçim</li>
            <li><strong>Profesyonel Hazırlık:</strong> Deneyimli çiçekçilerimiz tarafından özenle hazırlanır</li>
            <li><strong>Taze ve Kaliteli:</strong> Günlük kesim çiçeklerden oluşan {categoryData.name.toLowerCase()}</li>
            <li><strong>Hızlı Teslimat:</strong> İstanbul'un tüm ilçelerine özenli teslimat</li>
            <li><strong>Mesaj Kartı Hediye:</strong> Duygularınızı ifade etmek için özel mesaj kartı</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            Sipariş Süreci
          </h3>
          <ol className="list-decimal pl-6 mb-6 space-y-2">
            <li>Beğendiğiniz ürünü sepete ekleyin</li>
            <li>Teslimat bilgilerini ve mesajınızı yazın</li>
            <li>Güvenli ödeme yapın (Kredi kartı, havale veya kapıda ödeme)</li>
            <li>Siparişiniz özenle hazırlansın ve teslim edilsin</li>
          </ol>

          <h3 className="text-xl font-semibold mb-3">
            {specialDay.name} Özel Avantajlar
          </h3>
          <p className="mb-4">
            {specialDay.name} döneminde tüm {categoryData.name.toLowerCase()} siparişlerinizde özel 
            ambalaj ve mesaj kartı hediye! {specialDay.date && `${specialDay.date} tarihine kadar`} 
            verdiğiniz siparişlerde ücretsiz teslimat fırsatından yararlanabilirsiniz.
          </p>
        </div>

        {/* Products Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">
            {categoryData.name} Koleksiyonu ({products.length} Ürün)
          </h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
              {products.map((product, index) => (
                <ProductCard key={product.id ?? `${category}-${index}`} product={product as any} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-md shadow-soft">
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                Bu kombinasyon için henüz ürün eklenmemiş.
              </p>
              <div className="space-x-4">
                <a 
                  href={`/ozel-gun/${occasion}`}
                  className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-glow hover:bg-primary-600 transition"
                >
                  Tüm {specialDay.name} Ürünleri
                </a>
                <a 
                  href={`/${category}`}
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white/70 px-6 py-3 text-sm font-semibold text-gray-900 hover:border-gray-300 hover:shadow-soft transition"
                >
                  Tüm {categoryData.name}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Related Links */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div className="rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-md shadow-soft p-6">
            <h3 className="text-xl font-bold mb-3">
              Diğer {specialDay.name} Kategorileri
            </h3>
            <ul className="space-y-2">
              {activeCategories.filter((c) => c.slug !== category).slice(0, 5).map((cat) => (
                <li key={cat.slug}>
                  <a 
                    href={`/ozel-gun/${occasion}/${cat.slug}`}
                    className="text-primary-700 hover:underline"
                  >
                    {specialDay.name} {cat.name} →
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-md shadow-soft p-6">
            <h3 className="text-xl font-bold mb-3">
              {categoryData.name} için Diğer Özel Günler
            </h3>
            <ul className="space-y-2">
              {SPECIAL_DAYS.filter(d => d.slug !== occasion).slice(0, 5).map(day => (
                <li key={day.slug}>
                  <a 
                    href={`/ozel-gun/${day.slug}/${category}`}
                    className="text-primary-700 hover:underline"
                  >
                    {day.name} {categoryData.name} →
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-md shadow-soft p-6 md:p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {specialDay.name} Sürprizi Yapmaya Hazır mısınız?
          </h2>
          <p className="text-sm md:text-base text-gray-600 mb-6">
            {categoryData.name} kategorisindeki ürünlerimizle sevdiklerinizi mutlu edin.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`/ozel-gun/${occasion}`}
              className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-glow hover:bg-primary-600 transition"
            >
              Tüm {specialDay.name} Ürünleri
            </a>
            <a
              href={`/${category}`}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white/70 px-6 py-3 text-sm font-semibold text-gray-900 hover:border-gray-300 hover:shadow-soft transition"
            >
              Tüm {categoryData.name}
            </a>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNavBar />
    </>
  );
}
