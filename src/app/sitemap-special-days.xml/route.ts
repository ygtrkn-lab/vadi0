import { NextResponse } from 'next/server';
import type { MetadataRoute } from 'next';
import { SPECIAL_DAYS } from '@/data/special-days';
import { buildSitemapXml } from '@/lib/seo/sitemapXml';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

export async function GET() {
  const now = new Date().toISOString();

  const entries: MetadataRoute.Sitemap = SPECIAL_DAYS.map((day) => ({
    url: `${BASE_URL}/ozel-gun/${day.slug}`,
    lastModified: now,
  }));

  return new NextResponse(buildSitemapXml(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
