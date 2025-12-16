import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/yonetim/',
          '/api/',
          '/hesabim/',
          '/sepet/',
          '/odeme/',
          '/payment/',
          '/*?sort=*',
          '/*?price=*',
          '/*?page=*',
          '/*?stok=*',
          '/*?filter=*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/yonetim/',
          '/api/',
          '/hesabim/',
          '/sepet/',
          '/odeme/',
          '/payment/',
        ],
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
