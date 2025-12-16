import { MetadataRoute } from 'next'
import { categories } from '@/data/products'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com'

// Kategoriler için ayrı sitemap
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  return categories.map((category) => ({
    url: `${BASE_URL}/${category.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))
}
