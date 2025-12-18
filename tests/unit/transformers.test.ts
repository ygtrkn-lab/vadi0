import { describe, expect, it } from 'vitest';
import { transformProduct } from '@/lib/transformers';

describe('transformProduct', () => {
  it('maps snake_case fields and merges categories + occasion_tags + primary category', () => {
    const dbProduct: any = {
      id: 1,
      name: 'Test Ürün',
      slug: 'test-urun',
      sku: 'SKU-1',
      price: 100,
      old_price: 120,
      discount: 20,
      image: 'img.jpg',
      hover_image: 'hover.jpg',
      gallery: ['a.jpg', 'b.jpg'],
      category: 'guller',
      categories: ['guller', 'aranjmanlar'],
      occasion_tags: ['sevgililer-gunu', 'guller'],
      description: 'Açıklama',
      rating: 4.5,
      review_count: 10,
      in_stock: true,
      stock_count: 5,
      tags: ['romantik'],
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    };

    const p = transformProduct(dbProduct);

    expect(p.oldPrice).toBe(120);
    expect(p.hoverImage).toBe('hover.jpg');
    expect(p.reviewCount).toBe(10);
    expect(p.inStock).toBe(true);
    expect(p.stockCount).toBe(5);

    // deduped + contains secondary category slug
    expect(p.categories).toEqual(
      expect.arrayContaining(['guller', 'aranjmanlar', 'sevgililer-gunu', 'dogum-gunu-hediyeleri'])
    );

    // no duplicates
    expect(new Set(p.categories).size).toBe(p.categories.length);
  });
});
