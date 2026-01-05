import { supabaseServer } from '@/lib/supabase/server-client';

export type OrderLineInput = {
  id?: number;
  productId?: number;
  quantity?: number;
};

export type TrustedOrderLine = {
  id: number;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
  category: string;
  categoryName?: string;
};

type CatalogProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  category: string;
  category_name: string;
  image: string;
};

async function getCatalogProductsByIds(ids: number[]): Promise<Map<number, CatalogProduct>> {
  const uniqueIds = Array.from(new Set(ids)).filter((id) => Number.isFinite(id) && id > 0);
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabaseServer
    .from('products')
    .select('id, name, slug, price, category, category_name, image')
    .in('id', uniqueIds);

  if (error) {
    console.error('Error loading catalog products from Supabase:', error);
    throw new Error('Catalog unavailable');
  }

  const map = new Map<number, CatalogProduct>();
  for (const row of (data || []) as unknown as CatalogProduct[]) {
    if (typeof row?.id === 'number') {
      map.set(row.id, row);
    }
  }
  return map;
}

export async function buildTrustedOrderProducts(lines: Array<any>): Promise<{
  products: TrustedOrderLine[];
  subtotal: number;
}> {
  const trusted: TrustedOrderLine[] = [];

  const normalized = (lines || []).map((raw) => {
    const id = Number(raw?.id ?? raw?.productId);
    const quantity = Number(raw?.quantity ?? 0);
    return { raw, id, quantity };
  });

  const catalogById = await getCatalogProductsByIds(normalized.map((x) => x.id));

  for (const { id, quantity } of normalized) {

    if (!Number.isFinite(id) || id <= 0) {
      throw new Error('Invalid product id in order');
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error('Invalid quantity in order');
    }

    const catalog = catalogById.get(id);
    if (!catalog) {
      throw new Error(`Product not found in catalog: ${id}`);
    }

    trusted.push({
      id: catalog.id,
      name: catalog.name,
      slug: catalog.slug,
      image: catalog.image || '',
      price: Number(catalog.price) || 0,
      quantity,
      category: catalog.category,
      categoryName: catalog.category_name,
    });
  }

  const subtotal = trusted.reduce((sum, p) => sum + p.price * p.quantity, 0);
  return { products: trusted, subtotal };
}

export function clampMoney(value: unknown, opts?: { min?: number; max?: number }): number {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  const min = opts?.min ?? 0;
  const max = opts?.max ?? Number.POSITIVE_INFINITY;
  return Math.min(max, Math.max(min, safe));
}
