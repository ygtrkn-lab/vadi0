/**
 * Data transformation utilities for converting between database schema (snake_case)
 * and frontend types (camelCase)
 */

interface DbProduct {
  id: number;
  name: string;
  slug: string;
  sku?: string;
  price: number;
  old_price: number;
  discount: number;
  image: string;
  hover_image?: string;
  gallery?: string[];
  category: string;
  description?: string;
  rating: number;
  review_count: number;
  in_stock: boolean;
  stock_count: number;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku?: string;
  price: number;
  oldPrice: number;
  discount: number;
  image: string;
  hoverImage?: string;
  gallery?: string[];
  category: string;
  description?: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

/**
 * Transform database product (snake_case) to frontend product (camelCase)
 */
export function transformProduct(dbProduct: DbProduct): Product {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    slug: dbProduct.slug,
    sku: dbProduct.sku,
    price: dbProduct.price,
    oldPrice: dbProduct.old_price,
    discount: dbProduct.discount,
    image: dbProduct.image,
    hoverImage: dbProduct.hover_image,
    gallery: dbProduct.gallery,
    category: dbProduct.category,
    description: dbProduct.description,
    rating: dbProduct.rating,
    reviewCount: dbProduct.review_count,
    inStock: dbProduct.in_stock,
    stockCount: dbProduct.stock_count,
    tags: dbProduct.tags,
    createdAt: dbProduct.created_at,
    updatedAt: dbProduct.updated_at,
  };
}

/**
 * Transform array of database products to frontend products
 */
export function transformProducts(dbProducts: DbProduct[]): Product[] {
  return dbProducts.map(transformProduct);
}
