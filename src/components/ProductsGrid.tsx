'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import type { Product } from '@/lib/transformers';
import Image from 'next/image';

interface ProductsGridProps {
  title?: string;
  subtitle?: string;
  showAll?: boolean;
  limit?: number;
  categorySlug?: string;
  showCategoryImage?: boolean;
}

export default function ProductsGrid({ 
  title = "Çok Satanlar", 
  subtitle = "En beğenilen çiçeklerimiz",
  showAll = true,
  limit = 8,
  categorySlug,
  showCategoryImage = false
}: ProductsGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (categorySlug) params.set('category', categorySlug);
        if (limit) {
          params.set('limit', String(limit));
          params.set('offset', '0');
        }

        const queryString = params.toString();
        const response = await fetch(queryString ? `/api/products?${queryString}` : '/api/products', {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Ürünler yüklenirken hata oluştu');
        }

        const data = await response.json();
        const fetched: Product[] = data?.products || data?.data || [];

        if (!isMounted) return;

        const normalized = fetched.map((product) => {
          const baseProduct = { ...product };

          return {
            ...baseProduct,
            oldPrice: baseProduct.oldPrice ?? baseProduct.price,
            hoverImage: baseProduct.hoverImage ?? baseProduct.image,
            rating: baseProduct.rating ?? 5,
            discount: baseProduct.discount ?? 0,
            inStock: baseProduct.inStock ?? true,
          };
        });

        setProducts(normalized.slice(0, limit));

        if (categorySlug) {
          const categoryResponse = await fetch('/api/categories', {
            cache: 'no-store',
            signal: controller.signal,
          });

          if (categoryResponse.ok) {
            const categoryJson = await categoryResponse.json();
            const allCategories = categoryJson.categories || categoryJson.data || [];
            const foundCategory = allCategories.find((cat: any) => cat.slug === categorySlug);
            if (isMounted) setCategoryData(foundCategory || null);
          }
        } else {
          setCategoryData(null);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        if (isMounted) {
          setError('Ürünler yüklenirken sorun oluştu');
          setProducts([]);
          setCategoryData(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [categorySlug, limit]);

  const displayedProducts = products.slice(0, limit);
  const category = categorySlug ? categoryData : null;
  const skeletonItems = Array.from({ length: limit });
  const shouldHideSection = !loading && !error && displayedProducts.length === 0;

  if (shouldHideSection) return null;

  return (
    <section ref={containerRef} className="py-8 lg:py-12 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 lg:mb-8"
        >
          <div className="flex items-center gap-3">
            {showCategoryImage && category && category.image ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                <Image
                  src={category.image}
                  alt={category.name}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="p-2 bg-primary-100 rounded-xl">
                <Sparkles className="w-6 h-6 text-primary-500" />
              </div>
            )}
            <div>
              <h2 className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">
                {title}
              </h2>
              {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
            </div>
          </div>
          
          {showAll && (
            <Link 
              href={categorySlug ? `/${categorySlug}` : "/cicekler"}
              className="flex items-center gap-1 px-4 py-2 bg-primary-50 hover:bg-primary-100 
                text-primary-600 rounded-full font-semibold text-sm transition-all"
            >
              <span>Tümünü Gör</span>
              <ChevronRight size={16} />
            </Link>
          )}
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
          {loading
            ? skeletonItems.map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="h-[220px] sm:h-[260px] lg:h-[300px] rounded-xl sm:rounded-2xl bg-gray-100 animate-pulse"
                />
              ))
            : displayedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
        </div>

        {!loading && error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}

        {/* Load More Button - Mobile */}
        {showAll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 lg:mt-8 text-center sm:hidden"
          >
            <Link 
              href={categorySlug ? `/${categorySlug}` : "/cicekler"}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 rounded-full 
                text-white font-semibold text-sm transition-colors"
            >
              <span>Daha Fazla</span>
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
