'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, TrendingUp, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  type: 'product' | 'category';
  id: string;
  name: string;
  slug: string;
  image: string;
  price?: number;
  originalPrice?: number;
  productCount?: number;
}

interface DesktopSearchProps {
  placeholder?: string;
}

const POPULAR_SEARCHES = [
  { text: 'Güller', icon: '🌹' },
  { text: 'Orkide', icon: '🌺' },
  { text: 'Doğum Günü', icon: '🎂' },
  { text: 'Sevgiliye', icon: '💝' },
  { text: 'Papatya', icon: '🌼' },
];

const TRENDING_SEARCHES = [
  'Premium Buket',
  'Kırmızı Güller',
  'Aşk Çiçekleri',
];

export default function DesktopSearch({ placeholder = 'Ürün, kategori veya özel gün ara...' }: DesktopSearchProps) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<SearchResult[]>([]);
  const [categories, setCategories] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 200);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches
  useEffect(() => {
    try {
      const history = localStorage.getItem('vadiler_search_history');
      setRecentSearches(history ? JSON.parse(history).slice(0, 4) : []);
    } catch {}
  }, []);

  // Load products and categories
  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()).catch(() => ({ products: [] })),
      fetch('/api/categories').then(r => r.json()).catch(() => ({ categories: [] }))
    ]).then(([pData, cData]) => {
      setProducts((pData.products || pData.data || []).map((p: any) => ({
        type: 'product',
        id: String(p.id),
        name: p.name,
        slug: `/${p.category}/${p.slug}`,
        image: p.image || '',
        price: p.price,
        originalPrice: p.oldPrice || p.old_price,
      })));
      setCategories((cData.categories || cData.data || []).map((c: any) => ({
        type: 'category',
        id: c.slug,
        name: c.name,
        slug: `/${c.slug}`,
        image: c.image || '',
        productCount: c.productCount || c.product_count || 0,
      })));
    });
  }, []);

  // Search results with categories first, then products
  const results = useMemo((): SearchResult[] => {
    if (!debouncedQuery.trim()) return [];
    const term = debouncedQuery.toLowerCase();
    
    const matchedCategories = categories
      .filter(c => c.name?.toLowerCase().includes(term) && c.productCount && c.productCount > 0)
      .slice(0, 2);
    
    const matchedProducts = products
      .filter(p => p.name?.toLowerCase().includes(term))
      .slice(0, 6);
    
    return [...matchedCategories, ...matchedProducts];
  }, [debouncedQuery, products, categories]);

  // Click outside handler
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    // Save to history
    try {
      const history = JSON.parse(localStorage.getItem('vadiler_search_history') || '[]');
      const updated = [searchQuery, ...history.filter((s: string) => s !== searchQuery)].slice(0, 10);
      localStorage.setItem('vadiler_search_history', JSON.stringify(updated));
    } catch {}
    
    setShowDropdown(false);
    setQuery('');
    window.location.href = `/arama?search=${encodeURIComponent(searchQuery)}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      const result = results[focusedIndex];
      if (result) {
        handleSearch(result.name);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setFocusedIndex(-1);
    }
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('vadiler_search_history');
    setRecentSearches([]);
  };

  const hasQuery = query.trim().length > 0;
  const hasResults = results.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) handleSearch(query);
        }}
      >
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <Search className="w-[18px] h-[18px] text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
              setFocusedIndex(-1);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full h-12 pl-12 pr-12 bg-gray-50 rounded-full
              text-[15px] text-gray-900 placeholder:text-gray-400
              border-2 border-transparent
              focus:outline-none focus:bg-white focus:border-primary-400 
              focus:shadow-xl focus:shadow-primary-500/10
              transition-all duration-300 ease-out"
            autoComplete="off"
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full
                  bg-gray-200 hover:bg-gray-300 flex items-center justify-center
                  transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-600" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-3xl
              shadow-2xl shadow-black/10 border border-gray-100
              overflow-hidden z-[9999] max-h-[520px] overflow-y-auto"
          >
            {!hasQuery ? (
              <div className="p-6 space-y-6">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Son Aramalar
                        </h3>
                      </div>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors"
                      >
                        Temizle
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {recentSearches.map((search, idx) => (
                        <motion.button
                          key={search}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => handleSearch(search)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                            hover:bg-gradient-to-r hover:from-gray-50 hover:to-primary-50/30
                            transition-all duration-200 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-primary-100 
                            flex items-center justify-center transition-colors">
                            <Search className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                          </div>
                          <span className="flex-1 text-left text-[15px] text-gray-700 font-medium">{search}</span>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 
                            opacity-0 group-hover:opacity-100 transition-all" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-primary-500" />
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Trend Aramalar
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_SEARCHES.map((item, idx) => (
                      <motion.button
                        key={item}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        onClick={() => handleSearch(item)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-50 to-secondary-50
                          border border-primary-100 text-sm font-semibold text-primary-700
                          hover:from-primary-100 hover:to-secondary-100 hover:shadow-md
                          active:scale-95 transition-all duration-200"
                      >
                        {item}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Popular Searches */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-secondary-500" />
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Popüler
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {POPULAR_SEARCHES.map((item, idx) => (
                      <motion.button
                        key={item.text}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        onClick={() => handleSearch(item.text)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl
                          bg-white border border-gray-200 
                          hover:border-secondary-300 hover:bg-secondary-50 hover:shadow-md
                          active:scale-95 transition-all duration-200 group"
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-secondary-700">
                          {item.text}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            ) : hasResults ? (
              <div>
                {/* Results Header */}
                <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-primary-50/20 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {results.length} Sonuç Bulundu
                  </p>
                </div>

                {/* Results */}
                <div className="divide-y divide-gray-100">
                  {results.map((result, idx) => (
                    <motion.div
                      key={`${result.type}-${result.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Link
                        href={result.slug}
                        onClick={() => handleSearch(result.name)}
                        className={`flex items-center gap-4 px-6 py-4 
                          hover:bg-gradient-to-r hover:from-gray-50 hover:to-primary-50/30
                          transition-all duration-200 group
                          ${focusedIndex === idx ? 'bg-primary-50/50' : ''}`}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 
                          shrink-0 ring-2 ring-transparent group-hover:ring-primary-200 transition-all">
                          {result.image ? (
                            <Image
                              src={result.image}
                              alt={result.name}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              {result.type === 'product' ? '🌸' : '📁'}
                            </div>
                          )}
                          {result.type === 'category' && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-[15px] line-clamp-1 
                            group-hover:text-primary-700 transition-colors">
                            {result.name}
                          </p>
                          {result.type === 'product' && result.price && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-base font-bold text-primary-600">
                                ₺{result.price.toLocaleString('tr-TR')}
                              </span>
                              {result.originalPrice && result.originalPrice > result.price && (
                                <>
                                  <span className="text-xs text-gray-400 line-through">
                                    ₺{result.originalPrice.toLocaleString('tr-TR')}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[10px] font-bold">
                                    %{Math.round((1 - result.price / result.originalPrice) * 100)} İNDİRİM
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                          {result.type === 'category' && result.productCount && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg 
                                bg-secondary-100 text-secondary-700 text-xs font-bold">
                                {result.productCount} Ürün
                              </span>
                            </div>
                          )}
                        </div>

                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 
                          group-hover:translate-x-1 transition-all shrink-0" />
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* View All Button */}
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => handleSearch(query)}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm
                      bg-gradient-to-r from-primary-500 to-primary-600
                      hover:from-primary-600 hover:to-primary-700
                      shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40
                      active:scale-[0.98] transition-all duration-200
                      flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Tüm Sonuçları Gör ({results.length})
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 
                  flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  Sonuç Bulunamadı
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  &ldquo;{query}&rdquo; için bir sonuç bulamadık
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {POPULAR_SEARCHES.slice(0, 3).map((item) => (
                    <button
                      key={item.text}
                      onClick={() => handleSearch(item.text)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full
                        bg-primary-50 text-primary-600 text-sm font-semibold
                        hover:bg-primary-100 active:scale-95 transition-all"
                    >
                      <span>{item.icon}</span>
                      {item.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
