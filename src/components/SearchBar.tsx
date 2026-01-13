'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Clock, ArrowRight } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════
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

interface SearchBarProps {
  isFullScreen?: boolean;
  onClose?: () => void;
  autoFocus?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
const POPULAR_SEARCHES = [
  { text: 'Güller', icon: '🌹' },
  { text: 'Orkide', icon: '🌺' },
  { text: 'Doğum günü', icon: '🎂' },
  { text: 'Sevgiliye', icon: '💝' },
  { text: 'Papatya', icon: '🌼' },
];

const QUICK_TAGS = [
  {
    label: 'Trend',
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14l4-4 5 5 7-7" />
        <path d="M14 4h7v7" />
      </svg>
    ),
  },
  {
    label: '3 saatte',
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="7" />
        <path d="M12 8v4l2.5 1.5" />
      </svg>
    ),
  },
  {
    label: 'Premium',
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4l3.5 5-3.5 11-3.5-11z" />
        <path d="M5 9h14" />
      </svg>
    ),
  },
  {
    label: 'Doğal',
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 18c5-6 10-6 14-12" />
        <path d="M9 10c0 4 1 7 3 9" />
      </svg>
    ),
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const getRecentSearches = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('vadiler_search_history') || '[]').slice(0, 5);
  } catch {
    return [];
  }
};

const saveSearch = (query: string) => {
  if (!query.trim() || typeof window === 'undefined') return;
  try {
    const history = getRecentSearches().filter(s => s.toLowerCase() !== query.toLowerCase());
    localStorage.setItem('vadiler_search_history', JSON.stringify([query, ...history].slice(0, 5)));
  } catch {}
};

const clearSearchHistory = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('vadiler_search_history');
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function SearchBar({ isFullScreen = false, onClose, autoFocus = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [products, setProducts] = useState<SearchResult[]>([]);
  const [categories, setCategories] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'products' | 'categories'>('suggestions');
  const debouncedQuery = useDebounce(query, 180);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load data
  useEffect(() => {
    const timer = setTimeout(() => setRecentSearches(getRecentSearches()), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()).catch(() => ({ products: [] })),
      fetch('/api/categories').then(r => r.json()).catch(() => ({ categories: [] }))
    ]).then(([pData, cData]) => {
      setProducts(pData.products || pData.data || []);
      setCategories(cData.categories || cData.data || []);
    });
  }, []);

  // Search results
  const results = useMemo((): SearchResult[] => {
    if (!debouncedQuery.trim()) return [];
    const term = debouncedQuery.toLowerCase();
    const out: SearchResult[] = [];

    // Categories first
    categories.forEach((c: SearchResult) => {
      const count = c.productCount || 0;
      if (count > 0 && c.name?.toLowerCase().includes(term)) {
        out.push(c);
      }
    });

    // Products
    products.forEach((p: SearchResult) => {
      const matches = 
        p.name?.toLowerCase().includes(term);
      
      if (matches) {
        out.push(p);
      }
    });

    return [
      ...out.filter(r => r.type === 'category').slice(0, 2),
      ...out.filter(r => r.type === 'product').slice(0, 6)
    ];
  }, [debouncedQuery, products, categories]);

  // Click outside
  useEffect(() => {
    if (isFullScreen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isFullScreen]);

  // Autofocus
  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Navigation
  const navigateTo = (url: string, searchQuery?: string) => {
    if (searchQuery) saveSearch(searchQuery);
    onClose?.();
    window.location.href = url;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigateTo(`/arama?search=${encodeURIComponent(query)}`, query);
    }
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setRecentSearches([]);
  };

  const hasQuery = query.trim().length > 0;
  const hasResults = results.length > 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // FULL SCREEN MODE (Apple/iOS Style - Clean & Minimal)
  // ═══════════════════════════════════════════════════════════════════════════
  if (isFullScreen) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Search Input - iOS Style */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ürün veya kategori ara..."
                className="w-full h-10 pl-10 pr-10 rounded-xl bg-neutral-100 text-sm text-neutral-900 placeholder:text-neutral-400
                  focus:outline-none focus:ring-2 focus:ring-neutral-900/10
                  transition-all duration-200"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-neutral-300 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </form>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* No Query - Show suggestions */}
            {!hasQuery && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 py-3 space-y-5"
              >
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Son Aramalar</p>
                      <button
                        onClick={handleClearHistory}
                        className="text-xs text-neutral-500"
                      >
                        Temizle
                      </button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((search, idx) => (
                        <motion.button
                          key={search}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          onClick={() => navigateTo(`/arama?search=${encodeURIComponent(search)}`, search)}
                          className="w-full flex items-center gap-3 py-2.5 text-left"
                        >
                          <Clock className="w-4 h-4 text-neutral-300" />
                          <span className="flex-1 text-sm text-neutral-700">{search}</span>
                          <ArrowRight className="w-4 h-4 text-neutral-300" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                <div>
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">Popüler Aramalar</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map((item, idx) => (
                      <motion.button
                        key={item.text}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => navigateTo(`/arama?search=${encodeURIComponent(item.text)}`, item.text)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-neutral-100 text-sm text-neutral-700"
                      >
                        <span>{item.icon}</span>
                        <span>{item.text}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Quick Tags */}
                <div>
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">Hızlı Filtreler</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TAGS.map((tag) => (
                      <button
                        key={tag.label}
                        onClick={() => setQuery(tag.label)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-neutral-200 text-xs text-neutral-600"
                      >
                        {tag.icon()}
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Has Query - Show Results */}
            {hasQuery && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 py-3"
              >
                {hasResults ? (
                  <div className="space-y-1">
                    {results.slice(0, 8).map((result, idx) => (
                      <motion.div
                        key={`${result.type}-${result.id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                      >
                        <Link
                          href={result.slug}
                          onClick={() => saveSearch(result.name)}
                          className="flex items-center gap-3 py-3 border-b border-neutral-100 last:border-0"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                            {result.image ? (
                              <Image
                                src={result.image}
                                alt={result.name}
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">🌸</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 line-clamp-1">{result.name}</p>
                            {result.type === 'product' && result.price && (
                              <p className="text-sm text-neutral-500">₺{result.price.toLocaleString('tr-TR')}</p>
                            )}
                            {result.type === 'category' && (
                              <p className="text-xs text-neutral-400">{result.productCount} ürün</p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-neutral-300" />
                        </Link>
                      </motion.div>
                    ))}

                    {/* View All */}
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      onClick={() => navigateTo(`/arama?search=${encodeURIComponent(query)}`, query)}
                      className="w-full py-3 mt-2 text-sm font-medium text-neutral-900 bg-neutral-100 rounded-xl"
                    >
                      Tüm sonuçları gör
                    </motion.button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-100 flex items-center justify-center">
                      <Search className="w-5 h-5 text-neutral-400" />
                    </div>
                    <p className="text-sm text-neutral-500">"{query}" için sonuç bulunamadı</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DROPDOWN MODE (Desktop)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Ürün ara..."
            className="w-full h-11 pl-12 pr-12 bg-gray-100 rounded-full
              text-[15px] text-gray-900 placeholder:text-gray-400
              border-2 border-transparent
              focus:outline-none focus:bg-white focus:border-primary-500/30 focus:shadow-lg
              transition-all duration-200"
            autoComplete="off"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 
              bg-primary-500 rounded-full flex items-center justify-center
              text-white hover:bg-primary-600 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl
              shadow-xl shadow-gray-900/10 border border-gray-100
              overflow-hidden z-50 max-h-[400px] overflow-y-auto"
          >
            {!hasQuery ? (
              <div className="p-3 space-y-3">
                {recentSearches.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase mb-2 px-1">Son Aramalar</p>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map(s => (
                        <button
                          key={s}
                          onClick={() => navigateTo(`/arama?search=${encodeURIComponent(s)}`)}
                          className="px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase mb-2 px-1">Popüler</p>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SEARCHES.map(t => (
                      <button
                        key={t.text}
                        onClick={() => navigateTo(`/arama?search=${encodeURIComponent(t.text)}`)}
                        className="px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-600
                          hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      >
                        {t.icon} {t.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : hasResults ? (
              <div className="divide-y divide-gray-50">
                {results.slice(0, 5).map(r => (
                  <Link
                    key={`${r.type}-${r.id}`}
                    href={r.slug}
                    onClick={() => { saveSearch(r.name); setShowDropdown(false); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {r.image ? (
                        <Image src={r.image} alt="" fill className="object-cover" sizes="44px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🌸</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{r.name}</p>
                      {r.type === 'product' && (
                        <p className="text-xs font-semibold text-primary-500">₺{r.price?.toLocaleString('tr-TR')}</p>
                      )}
                    </div>
                  </Link>
                ))}
                <button
                  onClick={() => navigateTo(`/arama?search=${encodeURIComponent(query)}`)}
                  className="w-full py-3 text-sm font-medium text-primary-500 hover:bg-gray-50 transition-colors"
                >
                  Tümünü gör ({results.length})
                </button>
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-400">Sonuç bulunamadı</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
