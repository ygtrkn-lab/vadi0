import { MetadataRoute } from 'next'
import { SPECIAL_DAYS } from '@/data/special-days'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com'

// Özel gün sayfaları için ayrı sitemap
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  return SPECIAL_DAYS.map((day) => ({
    url: `${BASE_URL}/ozel-gun/${day.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
}
