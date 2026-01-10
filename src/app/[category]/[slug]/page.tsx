import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetail from './ProductDetail';
import supabaseAdmin from '@/lib/supabase/admin';
import { transformProduct, transformProducts } from '@/lib/transformers';

interface PageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

// Cache product pages for faster TTFB while keeping data fresh
export const revalidate = 900; // 15 minutes ISR window
export const dynamicParams = true;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

// Fetch product directly from Supabase to avoid internal fetch/env issues
async function getProduct(category: string, slug: string) {
  try {
    const [{ data: productRow }, { data: categoryRow }, { data: productsForList }] = await Promise.all([
      supabaseAdmin
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('category', category)
        .maybeSingle(),
      supabaseAdmin.from('categories').select('*').eq('slug', category).eq('is_active', true).maybeSingle(),
      supabaseAdmin
        .from('products')
        .select('*')
        .or(`category.eq.${category},occasion_tags.cs.{${category}}`)
        .order('id', { ascending: true })
    ]);

    const product = productRow ? transformProduct(productRow) : null;
    const categoryData = categoryRow ?? null;
    const allProducts = transformProducts(productsForList ?? []);

    return { product, categoryData, allProducts };
  } catch (error) {
    console.error('Error fetching product:', error);
    return { product: null, categoryData: null, allProducts: [] };
  }
}

// Generate metadata for SEO using cached server data
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const { product, categoryData } = await getProduct(category, slug);

  if (!product) {
    return {
      title: 'Ürün Bulunamadı | Vadiler Çiçek',
      description: 'Aradığınız ürün bulunamadı.',
      alternates: { canonical: `${BASE_URL}/${category}/${slug}` },
    };
  }

  return {
    title: product.metaTitle || product.meta_title || `${product.name} | Vadiler Çiçek`,
    description: product.metaDescription || product.meta_description || product.description,
    keywords: product.tags?.join(', '),
    openGraph: {
      title: product.metaTitle || product.meta_title || product.name,
      description: product.metaDescription || product.meta_description || product.description,
      images: [
        {
          url: product.image,
          width: 500,
          height: 500,
          alt: product.name,
        },
      ],
      type: 'website',
      siteName: 'Vadiler Çiçek',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.metaTitle || product.meta_title || product.name,
      description: product.metaDescription || product.meta_description || product.description,
      images: [product.image],
    },
    alternates: {
      canonical: `${BASE_URL}/${category}/${slug}`,
    },
    other: {
      // Fiyatı noktalı ondalık formatında gönder (Google standardı)
      'product:price:amount': Number(product.price).toFixed(2),
      'product:price:currency': 'TRY',
      'product:availability': (product.inStock || product.in_stock) ? 'in stock' : 'out of stock',
      'product:category': categoryData?.name || product.categoryName || product.category_name || '',
    },
  };
}

// JSON-LD Structured Data for SEO
function generateJsonLd(product: any) {
  // reviewCount veya review_count'u kontrol et (snake_case veya camelCase)
  const reviewCount = Number(product.reviewCount || product.review_count || 0);
  const rating = Number(product.rating || 0);
  const hasValidRating = rating > 0 && reviewCount > 0;
  
  // Fiyatı sayı olarak formatla (Google için noktalı ondalık gerekli)
  // product.price zaten indirimli fiyat, product.oldPrice eski fiyat
  const currentPrice = Number(product.price);
  const originalPrice = Number(product.oldPrice || product.old_price || 0);
  const hasDiscount = originalPrice > 0 && originalPrice > currentPrice;
  
  // Google için fiyatı string olarak formatla (noktalı ondalık)
  const formatPrice = (price: number) => price.toFixed(2);
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: Array.isArray(product.gallery) && product.gallery.length > 0 
      ? product.gallery 
      : [product.image || 'https://vadiler.com/placeholder.jpg'],
    sku: product.sku || `VAD-${product.id}`,
    brand: {
      '@type': 'Brand',
      name: 'Vadiler Çiçek',
    },
    offers: {
      '@type': 'Offer',
      url: `https://vadiler.com/${product.category}/${product.slug}`,
      priceCurrency: 'TRY',
      // Her zaman güncel satış fiyatını kullan (indirimli veya normal)
      price: formatPrice(currentPrice),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.inStock || product.in_stock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Vadiler Çiçek',
      },
      // İndirim varsa priceSpecification ekle (Google için net fiyat gösterimi)
      ...(hasDiscount && {
        priceSpecification: {
          '@type': 'PriceSpecification',
          price: formatPrice(currentPrice),
          priceCurrency: 'TRY',
          valueAddedTaxIncluded: true,
        },
      }),
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
    // Include aggregateRating if product has valid rating
    ...(hasValidRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating.toFixed(1),
        reviewCount: reviewCount,
        ratingCount: reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { category, slug } = await params;
  
  const { product, categoryData, allProducts } = await getProduct(category, slug);

  if (!product) {
    notFound();
  }

  // Get related products from same category using already-fetched list
  const relatedProducts = allProducts
    .filter((p: any) => p.category === category && p.id !== product.id)
    .slice(0, 4);

  const categoryName = categoryData?.name
    || product.categoryName
    || product.category_name
    || product.category?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    || '';

  const jsonLd = generateJsonLd(product);

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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
                item: `https://vadiler.com/${product.category}`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: product.name,
                item: `https://vadiler.com/${product.category}/${product.slug}`,
              },
            ],
          }),
        }}
      />

      <ProductDetail product={product} relatedProducts={relatedProducts} categoryName={categoryName} />
    </>
  );
}
