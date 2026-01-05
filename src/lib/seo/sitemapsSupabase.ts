import type { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

type CategoryRow = {
  slug: string;
  updated_at: string | null;
  is_active: boolean | null;
};

type ProductRow = {
  id: number;
  slug: string;
  category: string;
  updated_at: string | null;
};

export async function fetchActiveCategorySitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('slug, updated_at, is_active')
    .eq('is_active', true)
    .order('order', { ascending: true });

  if (error) throw error;

  return (data as unknown as CategoryRow[]).flatMap((row) => {
    if (!row?.slug) return [];
    return [
      {
        url: `${BASE_URL}/${row.slug}`,
        lastModified: row.updated_at || undefined,
        changeFrequency: 'daily',
        priority: 0.8,
      },
    ];
  });
}

export async function fetchProductSitemapEntries(options: {
  offset?: number;
  limit?: number;
} = {}): Promise<MetadataRoute.Sitemap> {
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 500;

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, slug, category, updated_at')
    .order('id', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return (data as unknown as ProductRow[]).flatMap((row) => {
    if (!row?.slug || !row?.category) return [];
    return [
      {
        url: `${BASE_URL}/${row.category}/${row.slug}`,
        lastModified: row.updated_at || undefined,
        changeFrequency: 'weekly',
        priority: 0.7,
      },
    ];
  });
}

export async function fetchProductSitemapEntriesFromOffset(offset: number): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const pageSize = 1000;

  for (let page = 0; page < 100; page++) {
    const from = offset + page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, slug, category, updated_at')
      .order('id', { ascending: true })
      .range(from, to);

    if (error) throw error;

    const rows = (data as unknown as ProductRow[]) ?? [];
    for (const row of rows) {
      if (!row?.slug || !row?.category) continue;
      entries.push({
        url: `${BASE_URL}/${row.category}/${row.slug}`,
        lastModified: row.updated_at || undefined,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    if (rows.length < pageSize) break;
  }

  return entries;
}
