import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetail from './ProductDetail';

interface PageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

// Force dynamic rendering to reduce build size
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Fetch product from API
async function getProduct(category: string, slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${baseUrl}/api/products`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/categories`, { cache: 'no-store' })
    ]);
    
    const productsData = await productsRes.json();
    const categoriesData = await categoriesRes.json();
    
    const allProducts = productsData.products || productsData.data || [];
    const allCategories = categoriesData.categories || categoriesData.data || [];
    
    const product = allProducts.find((p: any) => p.category === category && p.slug === slug);
    const categoryData = allCategories.find((c: any) => c.slug === category);
    
    return { product, categoryData };
  } catch (error) {
    console.error('Error fetching product:', error);
    return { product: null, categoryData: null };
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const { product, categoryData } = await getProduct(category, slug);

  if (!product) {
    return {
      title: 'Ürün Bulunamadı | Vadiler Çiçek',
      description: 'Aradığınız ürün bulunamadı.',
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
      canonical: `https://vadiler.com/${category}/${slug}`,
    },
    other: {
      'product:price:amount': product.price.toString(),
      'product:price:currency': 'TRY',
      'product:availability': (product.inStock || product.in_stock) ? 'in stock' : 'out of stock',
      'product:category': categoryData?.name || product.categoryName || product.category_name || '',
    },
  };
}

// JSON-LD Structured Data for SEO
function generateJsonLd(product: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.gallery || [product.image],
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'Vadiler Çiçek',
    },
    offers: {
      '@type': 'Offer',
      url: `https://vadiler.com/${product.category}/${product.slug}`,
      priceCurrency: 'TRY',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Vadiler Çiçek',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount || 10,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { category, slug } = await params;
  
  const { product } = await getProduct(category, slug);

  if (!product) {
    notFound();
  }

  // Get related products from same category
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const productsRes = await fetch(`${baseUrl}/api/products`, { cache: 'no-store' });
  const productsData = await productsRes.json();
  const allProducts = productsData.products || productsData.data || [];
  
  const relatedProducts = allProducts
    .filter((p: any) => p.category === category && p.id !== product.id)
    .slice(0, 4);

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
                name: product.categoryName || product.category,
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

      <ProductDetail product={product} relatedProducts={relatedProducts} />
    </>
  );
}
