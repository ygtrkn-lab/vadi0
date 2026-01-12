import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/arama'],  // Search pages only - low quality
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/arama'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/arama'],
      },
      {
        userAgent: 'Yandex',
        allow: '/',
        disallow: ['/arama'],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-products.xml`,
      `${baseUrl}/sitemap-categories.xml`,
      `${baseUrl}/sitemap-cities.xml`,
      `${baseUrl}/sitemap-special-days.xml`,
    ],
    host: baseUrl,
  }
}
