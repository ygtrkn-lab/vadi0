import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryPageClient from './CategoryPageClient';
import supabaseAdmin from '@/lib/supabase/admin';
import { transformProducts } from '@/lib/transformers';

interface PageProps {
  params: Promise<{
    category: string;
  }>;
}

// Cache category pages for faster TTFB while keeping data fresh
export const revalidate = 900; // 15 minutes ISR window
export const dynamicParams = true;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

// Fetch category and products directly from Supabase to avoid internal fetch/env issues
async function getCategoryData(slug: string) {
  try {
    const [{ data: categoryRow }, { data: productRows }] = await Promise.all([
      supabaseAdmin.from('categories').select('*').eq('slug', slug).eq('is_active', true).maybeSingle(),
      supabaseAdmin
        .from('products')
        .select('*')
        .or(`category.eq.${slug},occasion_tags.cs.{${slug}}`)
        .order('id', { ascending: true })
    ]);

    const category = categoryRow ?? null;
    const products = transformProducts(productRows ?? []);

    return { category, products };
  } catch (error) {
    console.error('Error fetching category data:', error);
    return { category: null, products: [] };
  }
}

// Generate metadata for SEO using cached server data
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;

  const { category: categoryData, products: categoryProducts } = await getCategoryData(category);

  if (!categoryData) {
    return {
      title: 'Kategori Bulunamadı | Vadiler Çiçek',
      description: 'Aradığınız kategori bulunamadı.',
      alternates: { canonical: `${BASE_URL}/${category}` },
    };
  }

  const categoryName = categoryData.name || category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return {
    title: `${categoryName} | Online Çiçek Siparişi | Vadiler Çiçek`,
    description: `${categoryName} kategorisinde ${categoryProducts.length} ürün bulunmaktadır. En taze çiçekler, hızlı ve özenli teslimat ile Vadiler Çiçek'te.`,
    keywords: [`${categoryName.toLowerCase()}`, `${categoryName.toLowerCase()} çiçek`, `${categoryName.toLowerCase()} online`, 'çiçek siparişi', 'istanbul çiçek'],
    alternates: {
      canonical: `${BASE_URL}/${category}`,
    },
    openGraph: {
      title: `${categoryName} | Vadiler Çiçek`,
      description: `${categoryName} kategorisinde ${categoryProducts.length} ürün. Taze çiçekler, hızlı teslimat.`,
      url: `${BASE_URL}/${category}`,
      type: 'website',
      locale: 'tr_TR',
      siteName: 'Vadiler Çiçek',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${categoryName} | Vadiler Çiçek`,
      description: `${categoryName} kategorisinde ${categoryProducts.length} ürün bulunmaktadır.`,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;

  const { category: categoryData, products: categoryProducts } = await getCategoryData(category);

  if (!categoryData) {
    notFound();
  }

  const categoryName = categoryData?.name || category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryName,
    description: `${categoryName} kategorisinde ${categoryProducts.length} ürün`,
    url: `https://vadiler.com/${category}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: categoryProducts.length,
      itemListElement: categoryProducts.slice(0, 10).map((product: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          description: product.description || product.name,
          url: `https://vadiler.com/${category}/${product.slug}`,
          image: product.image || 'https://vadiler.com/placeholder.jpg',
          sku: product.sku || `VAD-${product.id}`,
          brand: {
            '@type': 'Brand',
            name: 'Vadiler Çiçek',
          },
          offers: {
            '@type': 'Offer',
            price: product.price,
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
  };

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Ana Sayfa',
        item: 'https://vadiler.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: categoryName,
        item: `https://vadiler.com/${category}`,
      },
    ],
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <CategoryPageClient 
        category={category}
        categoryName={categoryName}
        products={categoryProducts}
        totalProducts={categoryProducts.length}
      />
    </>
  );
}
