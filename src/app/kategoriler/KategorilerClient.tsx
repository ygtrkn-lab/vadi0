'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Search, X } from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';
import CategoryAvatar from '@/components/ui/CategoryAvatar';

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
  description: string;
  productCount: number;
}

export default function KategorilerClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState(searchQuery);

  useEffect(() => {
    setQueryInput(searchQuery);
  }, [searchQuery]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setError(null);
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Kategoriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const buildKategorilerHref = (nextQuery: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const q = nextQuery.trim();
    if (q) params.set('search', q);
    else params.delete('search');
    const qs = params.toString();
    return qs ? `/kategoriler?${qs}` : '/kategoriler';
  };

  const submitSearch = (nextQuery: string) => {
    router.push(buildKategorilerHref(nextQuery));
  };

  // Filter categories based on search query
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }

    const query = searchQuery.toLowerCase().trim();
    return categories.filter(category => 
      category.name.toLowerCase().includes(query)
    );
  }, [searchQuery, categories]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-white">
      {/* Hero */}
      <section className="pt-10 pb-6 sm:pt-14 sm:pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-2xl text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xs px-4 py-2 shadow-soft ring-1 ring-black/5">
              <span className="h-2 w-2 rounded-full bg-primary-500" />
              <span className="text-sm font-medium text-dark-700">Kategoriler</span>
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-dark-950 sm:text-4xl">
              {searchQuery ? `“${searchQuery}” için kategoriler` : 'Tüm Kategoriler'}
            </h1>
            <p className="mt-3 text-base text-dark-600 sm:text-lg">
              {searchQuery
                ? `“${searchQuery}” ile ilgili ${filteredResults.length} kategori bulundu.`
                : 'Sevdiklerinize en güzel çiçekleri seçmek için kategorilerimizi keşfedin.'}
            </p>

            {/* Search */}
            <form
              className="mt-6"
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch(queryInput);
              }}
            >
              <div className="relative mx-auto max-w-xl">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">
                  <Search size={18} />
                </div>
                <input
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  inputMode="search"
                  placeholder="Kategori ara (ör. Gül, Orkide, Lilyum)"
                  className="h-12 w-full rounded-2xl bg-white/80 backdrop-blur-xs pl-11 pr-11 text-sm text-dark-900 shadow-soft ring-1 ring-black/5 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
                {queryInput.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQueryInput('');
                      submitSearch('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-dark-500 hover:bg-dark-50"
                    aria-label="Aramayı temizle"
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-14 sm:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5 animate-pulse"
                >
                  <div className="aspect-[4/5] bg-dark-100" />
                  <div className="p-4">
                    <div className="h-4 w-2/3 rounded bg-dark-100" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-dark-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="mx-auto max-w-lg rounded-3xl bg-white p-6 text-center shadow-soft ring-1 ring-black/5">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <Search size={20} />
              </div>
              <h2 className="text-lg font-semibold text-dark-950">Bir sorun oluştu</h2>
              <p className="mt-1 text-sm text-dark-600">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-2xl bg-primary-500 px-4 text-sm font-medium text-white hover:bg-primary-600"
              >
                Tekrar dene
              </button>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
              {filteredResults.map((category, index) => {
                const hasImage = typeof category.image === 'string' && category.image.trim().length > 0;
                return (
                  <motion.div
                    key={category.slug}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.03 }}
                  >
                    <Link
                      href={`/${category.slug}`}
                      className="group relative block overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5 transition-transform duration-300 active:scale-[0.99] hover:shadow-soft-lg"
                    >
                      <div className="relative aspect-[4/5]">
                        {hasImage ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-white to-secondary-50" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

                        <div className="absolute left-3 top-3 flex items-center gap-2">
                          <CategoryAvatar name={category.name} image={hasImage ? category.image : undefined} size={44} />
                          <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-dark-700 backdrop-blur-xs ring-1 ring-black/5">
                            {category.productCount} ürün
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-base font-semibold text-white sm:text-lg">
                            {category.name}
                          </h3>
                          {category.description ? (
                            <p className="mt-1 line-clamp-2 text-xs text-white/80 sm:text-sm">
                              {category.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4">
                        <span className="text-xs font-medium text-dark-600 group-hover:text-primary-600 sm:text-sm">
                          Kategoriye git
                        </span>
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 ring-1 ring-primary-100 transition-transform group-hover:translate-x-0.5">
                          <ArrowRight size={18} />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-lg rounded-3xl bg-white p-6 text-center shadow-soft ring-1 ring-black/5"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-dark-50 text-dark-500">
                <Search size={20} />
              </div>
              <h2 className="text-lg font-semibold text-dark-950">Sonuç bulunamadı</h2>
              <p className="mt-1 text-sm text-dark-600">
                “{searchQuery}” ile ilgili kategori bulunamadı.
              </p>
              <Link
                href="/kategoriler"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-2xl bg-primary-500 px-4 text-sm font-medium text-white hover:bg-primary-600"
              >
                Tüm kategorileri göster
              </Link>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
