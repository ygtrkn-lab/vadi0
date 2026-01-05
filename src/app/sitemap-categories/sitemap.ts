import { MetadataRoute } from 'next'
import { fetchActiveCategorySitemapEntries } from '@/lib/seo/sitemapsSupabase'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com'

// Kategoriler için ayrı sitemap
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    return await fetchActiveCategorySitemapEntries()
  } catch (error) {
    console.error('Error building category sitemap from Supabase:', error)
    return []
  }
}
