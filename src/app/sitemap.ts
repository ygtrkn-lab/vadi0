import { MetadataRoute } from 'next'
import { fetchActiveCategorySitemapEntries, fetchProductSitemapEntries } from '@/lib/seo/sitemapsSupabase'
import { SPECIAL_DAYS } from '@/data/special-days'
import { ISTANBUL_ILCELERI } from '@/data/istanbul-districts'
import { createCitySlug } from '@/data/city-content'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com'

// Ana sitemap index
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString()

  // Ana sayfalar
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/kategoriler`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/hakkimizda`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/iletisim`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/siparis-takip`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    // Yasal sayfalar
    {
      url: `${BASE_URL}/kvkk`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/gizlilik-politikasi`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cerez-politikasi`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/mesafeli-satis-sozlesmesi`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/iade-ve-iptal`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Kategori + Ürün sayfaları (Supabase)
  let categoryPages: MetadataRoute.Sitemap = []
  let productPages: MetadataRoute.Sitemap = []
  try {
    categoryPages = await fetchActiveCategorySitemapEntries()
    productPages = await fetchProductSitemapEntries({ offset: 0, limit: 500 })
  } catch (error) {
    console.error('Error fetching sitemap entries from Supabase:', error)
  }

  // Şehir sayfaları
  const cityPages: MetadataRoute.Sitemap = [
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

  // Özel gün sayfaları
  const specialDayPages: MetadataRoute.Sitemap = SPECIAL_DAYS.map((day) => ({
    url: `${BASE_URL}/ozel-gun/${day.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    ...staticPages,
    ...categoryPages,
    ...productPages,
    ...cityPages,
    ...specialDayPages,
  ]
}
