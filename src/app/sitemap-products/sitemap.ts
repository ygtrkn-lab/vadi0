import { MetadataRoute } from 'next'
import { products } from '@/data/products'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com'

// Ürünler için ayrı sitemap (500-1000 arası ürünler)
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  // 500'den sonraki ürünler
  const productPages: MetadataRoute.Sitemap = products.slice(500).map((product) => ({
    url: `${BASE_URL}/${product.category}/${product.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return productPages
}
