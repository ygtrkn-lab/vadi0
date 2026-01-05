import { NextResponse } from 'next/server';
import { buildSitemapXml } from '@/lib/seo/sitemapXml';
import { fetchProductSitemapEntriesFromOffset } from '@/lib/seo/sitemapsSupabase';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

export async function GET() {
  let productPages = [];
  try {
    productPages = await fetchProductSitemapEntriesFromOffset(0);
  } catch (error) {
    console.error('Error generating sitemap-products.xml from Supabase:', error);
  }

  if (!productPages.length) {
    productPages = [
      {
        url: `${BASE_URL}/kategoriler`,
        changeFrequency: 'daily',
        priority: 0.6,
      },
    ];
  }

  return new NextResponse(buildSitemapXml(productPages), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
