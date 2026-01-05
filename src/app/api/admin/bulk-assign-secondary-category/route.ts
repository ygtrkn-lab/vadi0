import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase/admin';

const DEFAULT_SECONDARY_SLUG = 'dogum-gunu-hediyeleri';

export const dynamic = 'force-dynamic';

async function resolveSecondarySlug(): Promise<string> {
  // Try to find a category whose name includes "Doğum Günü"
  const { data: cats } = await supabaseAdmin
    .from('categories')
    .select('slug, name');
  const match = (cats || []).find((c: any) =>
    typeof c?.name === 'string' && /doğum günü|dogum gunu/i.test(c.name)
  );
  return match?.slug || DEFAULT_SECONDARY_SLUG;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestedSlug = typeof (body as any)?.slug === 'string' ? (body as any).slug : undefined;
    const SECONDARY_CATEGORY_SLUG = requestedSlug || (await resolveSecondarySlug());

    // Fetch all product ids and current occasion tags
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, occasion_tags');

    if (error) {
      console.error('Error fetching products for bulk assign:', error);
      return NextResponse.json({ success: false, error: 'Ürünler alınamadı' }, { status: 500 });
    }

    let updated = 0;
    for (const p of products ?? []) {
      const id = (p as any)?.id as number;
      const current: string[] = Array.isArray((p as any)?.occasion_tags) ? ((p as any).occasion_tags as string[]) : [];
      if (current.includes(SECONDARY_CATEGORY_SLUG)) {
        continue;
      }
      const next = Array.from(new Set([...current, SECONDARY_CATEGORY_SLUG]));
      const { error: upErr } = await supabaseAdmin
        .from('products')
        .update({ occasion_tags: next, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (!upErr) updated += 1;
    }

    return NextResponse.json({ success: true, updated, slug: SECONDARY_CATEGORY_SLUG });
  } catch (e) {
    console.error('Bulk assign secondary category error:', e);
    return NextResponse.json({ success: false, error: 'İç hata' }, { status: 500 });
  }
}
