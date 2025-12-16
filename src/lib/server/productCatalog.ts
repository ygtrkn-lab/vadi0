import products from '@/data/products.json';

type CatalogProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  category: string;
  categoryName?: string;
  image?: string;
  tags?: string[];
  inStock?: boolean;
};

let catalogById: Map<number, CatalogProduct> | null = null;

function getCatalogMap(): Map<number, CatalogProduct> {
  if (catalogById) return catalogById;

  const map = new Map<number, CatalogProduct>();
  for (const p of products as unknown as CatalogProduct[]) {
    if (typeof p?.id === 'number') {
      map.set(p.id, p);
    }
  }
  catalogById = map;
  return map;
}

export function getCatalogProductById(productId: number): CatalogProduct | undefined {
  return getCatalogMap().get(productId);
}

export function getCatalogPriceById(productId: number): number | undefined {
  return getCatalogProductById(productId)?.price;
}
