import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryPageClient from './CategoryPageClient';

interface PageProps {
  params: Promise<{
    category: string;
  }>;
}

// Force dynamic rendering to reduce build size
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Fetch category and products from API
async function getCategoryData(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const [categoriesRes, productsRes] = await Promise.all([
      fetch(`${baseUrl}/api/categories`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/products?category=${slug}`, { cache: 'no-store' })
    ]);
    
    const categoriesData = await categoriesRes.json();
    const productsData = await productsRes.json();
    
    const allCategories = categoriesData.categories || categoriesData.data || [];
    const filteredProducts = productsData.products || productsData.data || [];
    
    const category = allCategories.find((c: any) => c.slug === slug);
    const products = filteredProducts;
    
    return { category, products };
  } catch (error) {
    console.error('Error fetching category data:', error);
    return { category: null, products: [] };
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  
  const { category: categoryData, products: categoryProducts } = await getCategoryData(category);
  
  const categoryName = categoryData?.name || category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return {
    title: `${categoryName} | Online Çiçek Siparişi | Vadiler Çiçek`,
    description: `${categoryName} kategorisinde ${categoryProducts.length} ürün bulunmaktadır. En taze çiçekler, hızlı teslimat ile Vadiler Çiçek'te. İstanbul'a aynı gün teslimat.`,
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
          url: `https://vadiler.com/${category}/${product.slug}`,
          image: product.image,
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'TRY',
            availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
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
