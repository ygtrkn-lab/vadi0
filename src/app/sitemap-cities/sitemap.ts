import { MetadataRoute } from 'next'
import { ISTANBUL_ILCELERI } from '@/data/istanbul-districts'
import { createCitySlug } from '@/data/city-content'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com'

// Şehir/ilçe sayfaları için ayrı sitemap
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  return [
    {
      url: `${BASE_URL}/sehir/istanbul`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    ...ISTANBUL_ILCELERI.map((district) => ({
      url: `${BASE_URL}/sehir/istanbul/${createCitySlug(district.name)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
