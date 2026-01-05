import { MetadataRoute } from 'next'
import { fetchProductSitemapEntriesFromOffset } from '@/lib/seo/sitemapsSupabase'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com'

// Ürünler için ayrı sitemap (500-1000 arası ürünler)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    return await fetchProductSitemapEntriesFromOffset(500)
  } catch (error) {
    console.error('Error building product sitemap from Supabase:', error)
    return []
  }
}
