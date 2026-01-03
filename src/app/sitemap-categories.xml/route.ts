import { NextResponse } from 'next/server';
import { buildSitemapXml } from '@/lib/seo/sitemapXml';
import { fetchActiveCategorySitemapEntries } from '@/lib/seo/sitemapsSupabase';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

export async function GET() {
  let entries = [];
  try {
    entries = await fetchActiveCategorySitemapEntries();
  } catch (error) {
    console.error('Error generating sitemap-categories.xml from Supabase:', error);
  }

  return new NextResponse(buildSitemapXml(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
