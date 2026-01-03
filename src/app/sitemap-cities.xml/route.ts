import { NextResponse } from 'next/server';
import type { MetadataRoute } from 'next';
import { ISTANBUL_ILCELERI } from '@/data/istanbul-districts';
import { createCitySlug } from '@/data/city-content';
import { buildSitemapXml } from '@/lib/seo/sitemapXml';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

export async function GET() {
  const now = new Date().toISOString();

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/sehir/istanbul`,
      lastModified: now,
    },
    ...ISTANBUL_ILCELERI.map((district) => ({
      url: `${BASE_URL}/sehir/istanbul/${createCitySlug(district.name)}`,
      lastModified: now,
    })),
  ];

  return new NextResponse(buildSitemapXml(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
