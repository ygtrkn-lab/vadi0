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

  catalogById = new Map<number, CatalogProduct>();
  return catalogById;
}

export function getCatalogProductById(productId: number): CatalogProduct | undefined {
  return getCatalogMap().get(productId);
}

export function getCatalogPriceById(productId: number): number | undefined {
  return getCatalogProductById(productId)?.price;
}
